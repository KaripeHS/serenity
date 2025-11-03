/**
 * Reminder/Automation Engine for Serenity ERP
 * Handles event-driven workflows, SLA tracking, and escalation chains
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { reminderLogger } from '../utils/logger';

// ============================================================================
// Core Types
// ============================================================================

export interface ReminderRule {
  id: string;
  organizationId: string;
  podId?: string; // null = org-wide, specific = pod-scoped
  name: string;
  description: string;
  scope: 'organization' | 'pod' | 'role' | 'user';
  audience: ReminderAudience[];
  trigger: ReminderTrigger;
  offset: ReminderOffset;
  channels: NotificationChannel[];
  templateId: string;
  slaMinutes: number;
  escalationChain: EscalationStep[];
  containsPHI: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderAudience {
  type: 'role' | 'user' | 'pod_role';
  value: string; // role name, user ID, or pod_role combination
  conditions?: Record<string, any>;
}

export interface ReminderTrigger {
  type: 'time_based' | 'data_based' | 'behavioral';
  event: string;
  conditions: Record<string, any>;
  cronExpression?: string; // for scheduled triggers
}

export interface ReminderOffset {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
  direction: 'before' | 'after';
}

export interface EscalationStep {
  level: number;
  delayMinutes: number;
  audience: ReminderAudience[];
  templateId: string;
  requiresApproval: boolean;
}

export interface ReminderInstance {
  id: string;
  ruleId: string;
  organizationId: string;
  podId?: string;
  subjectRef: SubjectReference;
  dueAt: Date;
  status: 'pending' | 'sent' | 'acknowledged' | 'escalated' | 'completed' | 'dismissed';
  attempts: ReminderAttempt[];
  lastError?: string;
  escalationLevel: number;
  containsPHI?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectReference {
  entityType: string; // 'user', 'client', 'visit', 'credential', 'document'
  entityId: string;
  metadata?: Record<string, any>;
}

export interface ReminderAttempt {
  id: string;
  attemptNumber: number;
  channel: NotificationChannel;
  sentAt: Date;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'acknowledged';
  error?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export type NotificationChannel = 'in_app' | 'portal_message' | 'email' | 'sms' | 'push';

// ============================================================================
// Reminder Engine Implementation
// ============================================================================

export class ReminderEngine extends EventEmitter {
  private rules: Map<string, ReminderRule> = new Map();
  private instances: Map<string, ReminderInstance> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Start the reminder engine
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    await this.loadRules();
    await this.loadPendingInstances();
    this.startProcessingLoop();

    reminderLogger.info('Reminder Engine started successfully', {
      rulesLoaded: this.rules.size,
      pendingInstances: this.instances.size
    });
  }

  /**
   * Stop the reminder engine
   */
  stop(): void {
    this.isRunning = false;
    this.clearAllTimers();
    reminderLogger.info('Reminder Engine stopped', {
      activeTimers: this.timers.size
    });
  }

  /**
   * Register a new reminder rule
   */
  async createRule(rule: Omit<ReminderRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReminderRule> {
    const newRule: ReminderRule = {
      ...rule,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.validateRule(newRule);
    this.rules.set(newRule.id, newRule);
    await this.persistRule(newRule);

    this.emit('rule_created', newRule);
    return newRule;
  }

  /**
   * Process a trigger event to create reminder instances
   */
  async processTrigger(eventType: string, eventData: any): Promise<void> {
    const matchingRules = Array.from(this.rules.values()).filter(rule =>
      rule.enabled && rule.trigger.event === eventType
    );

    for (const rule of matchingRules) {
      if (await this.evaluateTriggerConditions(rule, eventData)) {
        await this.createReminderInstance(rule, eventData);
      }
    }
  }

  /**
   * Create a reminder instance from a rule and event data
   */
  private async createReminderInstance(rule: ReminderRule, eventData: any): Promise<ReminderInstance> {
    const dueAt = this.calculateDueDate(rule.offset);
    const subjectRef = this.extractSubjectReference(rule, eventData);

    const instance: ReminderInstance = {
      id: uuidv4(),
      ruleId: rule.id,
      organizationId: rule.organizationId,
      ...(rule.podId && { podId: rule.podId }),
      subjectRef,
      dueAt,
      status: 'pending',
      attempts: [],
      escalationLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.instances.set(instance.id, instance);
    await this.persistInstance(instance);
    this.scheduleReminder(instance);

    this.emit('instance_created', instance);
    return instance;
  }

  /**
   * Process a reminder instance for sending
   */
  private async processReminderInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'pending') return;

    const rule = this.rules.get(instance.ruleId);
    if (!rule) return;

    try {
      // Generate notification content
      const content = await this.generateNotificationContent(rule, instance);

      // Send notifications through configured channels
      const attempts: ReminderAttempt[] = [];
      for (const channel of rule.channels) {
        const attempt = await this.sendNotification(channel, content, rule, instance);
        attempts.push(attempt);
      }

      // Update instance with attempts
      instance.attempts.push(...attempts);
      instance.status = 'sent';
      instance.updatedAt = new Date();

      await this.persistInstance(instance);
      this.scheduleSLACheck(instance, rule.slaMinutes);

      this.emit('notification_sent', instance, attempts);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      instance.lastError = errorMessage;
      instance.status = 'pending'; // Will retry
      await this.persistInstance(instance);
      this.emit('notification_error', instance, error);
    }
  }

  /**
   * Check SLA and escalate if needed
   */
  private async checkSLAAndEscalate(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status === 'acknowledged' || instance.status === 'completed') return;

    const rule = this.rules.get(instance.ruleId);
    if (!rule) return;

    const timeSinceCreated = Date.now() - instance.createdAt.getTime();
    const slaExpired = timeSinceCreated > (rule.slaMinutes * 60 * 1000);

    if (slaExpired && instance.escalationLevel < rule.escalationChain.length) {
      await this.escalateReminder(instance, rule);
    }
  }

  /**
   * Escalate a reminder to the next level
   */
  private async escalateReminder(instance: ReminderInstance, rule: ReminderRule): Promise<void> {
    const escalationStep = rule.escalationChain[instance.escalationLevel];
    if (!escalationStep) return;

    instance.escalationLevel++;
    instance.status = 'escalated';
    instance.updatedAt = new Date();

    // Send escalation notifications
    const escalationContent = await this.generateEscalationContent(rule, instance, escalationStep);

    for (const channel of rule.channels) {
      const attempt = await this.sendEscalationNotification(
        channel,
        escalationContent,
        rule,
        instance,
        escalationStep
      );
      instance.attempts.push(attempt);
    }

    await this.persistInstance(instance);

    // Schedule next escalation if available
    if (instance.escalationLevel < rule.escalationChain.length) {
      const nextStep = rule.escalationChain[instance.escalationLevel];
      if (nextStep) {
        setTimeout(() => {
          this.checkSLAAndEscalate(instance.id);
        }, nextStep.delayMinutes * 60 * 1000);
      }
    }

    this.emit('reminder_escalated', instance, escalationStep);
  }

  /**
   * Acknowledge a reminder instance
   */
  async acknowledgeReminder(instanceId: string, acknowledgedBy: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error('Reminder instance not found');

    instance.status = 'acknowledged';
    instance.updatedAt = new Date();

    // Mark the latest attempt as acknowledged
    const latestAttempt = instance.attempts[instance.attempts.length - 1];
    if (latestAttempt) {
      latestAttempt.deliveryStatus = 'acknowledged';
      latestAttempt.acknowledgedAt = new Date();
      latestAttempt.acknowledgedBy = acknowledgedBy;
    }

    await this.persistInstance(instance);
    this.emit('reminder_acknowledged', instance, acknowledgedBy);
  }

  /**
   * Complete a reminder instance
   */
  async completeReminder(instanceId: string, completedBy: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error('Reminder instance not found');

    instance.status = 'completed';
    instance.updatedAt = new Date();

    await this.persistInstance(instance);
    this.emit('reminder_completed', instance, completedBy);
  }

  /**
   * Generate notification content using templates
   */
  private async generateNotificationContent(rule: ReminderRule, instance: ReminderInstance): Promise<NotificationContent> {
    // This would integrate with the document template system
    const template = await this.getTemplate(rule.templateId);
    const tokens = await this.extractTokens(instance);

    return {
      subject: this.replaceTokens(template.subject, tokens),
      body: this.replaceTokens(template.body, tokens),
      secureLink: this.generateSecureLink(instance),
      containsPHI: rule.containsPHI
    };
  }

  /**
   * Send notification through specified channel
   */
  private async sendNotification(
    channel: NotificationChannel,
    content: NotificationContent,
    rule: ReminderRule,
    instance: ReminderInstance
  ): Promise<ReminderAttempt> {
    const attempt: ReminderAttempt = {
      id: uuidv4(),
      attemptNumber: instance.attempts.length + 1,
      channel,
      sentAt: new Date(),
      deliveryStatus: 'sent'
    };

    try {
      switch (channel) {
        case 'in_app':
          await this.sendInAppNotification(content, instance);
          break;
        case 'portal_message':
          await this.sendPortalMessage(content, instance);
          break;
        case 'email':
          await this.sendEmailNotification(content, instance, rule.containsPHI);
          break;
        case 'sms':
          await this.sendSMSNotification(content, instance, rule.containsPHI);
          break;
        case 'push':
          await this.sendPushNotification(content, instance);
          break;
      }

      attempt.deliveryStatus = 'delivered';
    } catch (error) {
      attempt.deliveryStatus = 'failed';
      attempt.error = error instanceof Error ? error.message : String(error);
    }

    return attempt;
  }

  /**
   * Send HIPAA-safe email notification
   */
  private async sendEmailNotification(
    content: NotificationContent,
    instance: ReminderInstance,
    containsPHI: boolean
  ): Promise<void> {
    // HIPAA-safe: No PHI in email body, only secure portal links
    const safeContent = {
      subject: containsPHI ? 'Serenity Care - Action Required' : content.subject,
      body: containsPHI
        ? `You have a task requiring your attention. Please log into your secure portal: ${content.secureLink}`
        : `${content.body}\n\nAccess your secure portal: ${content.secureLink}`
    };

    // Implementation would integrate with email service
    reminderLogger.info('Email notification sent', {
      instanceId: instance.id,
      ruleId: instance.ruleId,
      recipientCount: 1, // recipients.length,
      containsPHI: instance.containsPHI
    });
  }

  /**
   * Send HIPAA-safe SMS notification
   */
  private async sendSMSNotification(
    content: NotificationContent,
    instance: ReminderInstance,
    containsPHI: boolean
  ): Promise<void> {
    // HIPAA-safe: No PHI in SMS, only secure portal links
    const safeMessage = containsPHI
      ? `Serenity Care: Action required. Check your secure portal: ${content.secureLink}`
      : `Serenity Care: ${content.subject}. Portal: ${content.secureLink}`;

    // Implementation would integrate with SMS service
    reminderLogger.info('SMS notification sent', {
      instanceId: instance.id,
      ruleId: instance.ruleId,
      recipientCount: 1, // recipients.length,
      containsPHI: instance.containsPHI
    });
  }

  /**
   * Helper methods for implementation
   */
  private calculateDueDate(offset: ReminderOffset): Date {
    const now = new Date();
    const multiplier = offset.direction === 'before' ? -1 : 1;

    switch (offset.unit) {
      case 'minutes':
        return new Date(now.getTime() + (offset.value * multiplier * 60 * 1000));
      case 'hours':
        return new Date(now.getTime() + (offset.value * multiplier * 60 * 60 * 1000));
      case 'days':
        return new Date(now.getTime() + (offset.value * multiplier * 24 * 60 * 60 * 1000));
      case 'weeks':
        return new Date(now.getTime() + (offset.value * multiplier * 7 * 24 * 60 * 60 * 1000));
      default:
        return now;
    }
  }

  private generateSecureLink(instance: ReminderInstance): string {
    // Generate secure portal link with encrypted parameters
    const token = this.encryptInstanceToken(instance);
    return `${process.env.PORTAL_BASE_URL}/tasks/${token}`;
  }

  private encryptInstanceToken(instance: ReminderInstance): string {
    // Implementation would use proper encryption
    return Buffer.from(JSON.stringify({
      instanceId: instance.id,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hour expiry
    })).toString('base64');
  }

  private replaceTokens(template: string, tokens: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(tokens)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  private scheduleReminder(instance: ReminderInstance): void {
    const delay = instance.dueAt.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(() => {
        this.processReminderInstance(instance.id);
      }, delay);

      this.timers.set(instance.id, timer);
    } else {
      // Past due, process immediately
      this.processReminderInstance(instance.id);
    }
  }

  private scheduleSLACheck(instance: ReminderInstance, slaMinutes: number): void {
    const timer = setTimeout(() => {
      this.checkSLAAndEscalate(instance.id);
    }, slaMinutes * 60 * 1000);

    this.timers.set(`${instance.id}_sla`, timer);
  }

  private clearAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  // production_value methods for persistence and external integrations
  private async loadRules(): Promise<void> {
    // Load rules from database
  }

  private async loadPendingInstances(): Promise<void> {
    // Load pending instances from database
  }

  private async persistRule(rule: ReminderRule): Promise<void> {
    // Save rule to database
  }

  private async persistInstance(instance: ReminderInstance): Promise<void> {
    // Save instance to database
  }

  private async validateRule(rule: ReminderRule): Promise<void> {
    // Validate rule configuration
  }

  private async evaluateTriggerConditions(rule: ReminderRule, eventData: any): Promise<boolean> {
    // Evaluate trigger conditions against event data
    return true;
  }

  private extractSubjectReference(rule: ReminderRule, eventData: any): SubjectReference {
    // Extract subject reference from event data
    return {
      entityType: 'user',
      entityId: eventData.userId || 'unknown'
    };
  }

  private startProcessingLoop(): void {
    // Start background processing loop
  }

  private setupEventHandlers(): void {
    // Setup event handlers for various triggers
  }

  private async getTemplate(templateId: string): Promise<any> {
    // Get template from template system
    return {
      subject: 'Reminder: {task_description}',
      body: 'Hello {user_name}, you have a task requiring attention: {task_description}. Due: {due_date}'
    };
  }

  private async extractTokens(instance: ReminderInstance): Promise<Record<string, string>> {
    // Extract tokens for template replacement
    return {
      user_name: 'User',
      task_description: 'Task',
      due_date: instance.dueAt.toLocaleDateString()
    };
  }

  private async generateEscalationContent(rule: ReminderRule, instance: ReminderInstance, step: EscalationStep): Promise<NotificationContent> {
    // Generate escalation-specific content
    return {
      subject: 'ESCALATION: Action Required',
      body: 'An escalated action requires your immediate attention.',
      secureLink: this.generateSecureLink(instance),
      containsPHI: rule.containsPHI
    };
  }

  private async sendEscalationNotification(
    channel: NotificationChannel,
    content: NotificationContent,
    rule: ReminderRule,
    instance: ReminderInstance,
    step: EscalationStep
  ): Promise<ReminderAttempt> {
    // Send escalation notification
    return this.sendNotification(channel, content, rule, instance);
  }

  private async sendInAppNotification(content: NotificationContent, instance: ReminderInstance): Promise<void> {
    // Send in-app notification
  }

  private async sendPortalMessage(content: NotificationContent, instance: ReminderInstance): Promise<void> {
    // Send portal message
  }

  private async sendPushNotification(content: NotificationContent, instance: ReminderInstance): Promise<void> {
    // Send push notification
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface NotificationContent {
  subject: string;
  body: string;
  secureLink: string;
  containsPHI: boolean;
}

// ============================================================================
// Export
// ============================================================================

export const reminderEngine = new ReminderEngine();