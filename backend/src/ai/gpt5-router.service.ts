/**
 * GPT-5 Intelligent Router Service for Serenity ERP
 * Optimizes AI model selection for cost, performance, and accuracy
 */

import { AIAgentService } from './agent.service';
import { AuditLogger } from '../audit/logger';
import { createLogger, apiLogger } from '../utils/logger';
import { environmentService } from '../config/environment';

export interface AIRequest {
  agentType: string;
  prompt: string;
  context?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxTokens?: number;
  requiresPHI: boolean;
  responseTime: 'fast' | 'balanced' | 'thorough';
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
}

export interface AIResponse {
  response: any;
  modelUsed: string;
  tokensUsed: number;
  cost: number;
  processingTime: number;
  confidence: number;
  cached: boolean;
}

export interface ModelConfig {
  model: string;
  costPerToken: number;
  averageLatency: number;
  maxTokens: number;
  bestFor: string[];
  hipaaCompliant: boolean;
}

export class GPT5RouterService {
  private modelConfigs: Record<string, ModelConfig> = {
    // GPT-5 Main Models
    'gpt-5-main': {
      model: 'gpt-5-main',
      costPerToken: 0.000015, // Estimated based on GPT-5 pricing
      averageLatency: 800,
      maxTokens: 128000,
      bestFor: ['general', 'scheduling', 'billing', 'notifications'],
      hipaaCompliant: false
    },
    'gpt-5-main-mini': {
      model: 'gpt-5-main-mini',
      costPerToken: 0.000008,
      averageLatency: 400,
      maxTokens: 128000,
      bestFor: ['simple_queries', 'data_validation', 'quick_analysis'],
      hipaaCompliant: false
    },
    'gpt-5-thinking': {
      model: 'gpt-5-thinking',
      costPerToken: 0.000030,
      averageLatency: 2000,
      maxTokens: 128000,
      bestFor: ['complex_analysis', 'policy_interpretation', 'compliance'],
      hipaaCompliant: false
    },
    'gpt-5-thinking-mini': {
      model: 'gpt-5-thinking-mini',
      costPerToken: 0.000020,
      averageLatency: 1200,
      maxTokens: 128000,
      bestFor: ['moderate_reasoning', 'data_analysis', 'insights'],
      hipaaCompliant: false
    },
    'gpt-5-thinking-nano': {
      model: 'gpt-5-thinking-nano',
      costPerToken: 0.000012,
      averageLatency: 600,
      maxTokens: 64000,
      bestFor: ['quick_reasoning', 'lightweight_analysis'],
      hipaaCompliant: false
    },

    // HIPAA-Compliant Models (Azure OpenAI)
    'azure-gpt-5-main': {
      model: 'azure-gpt-5-main',
      costPerToken: 0.000020, // Premium for HIPAA compliance
      averageLatency: 1000,
      maxTokens: 128000,
      bestFor: ['phi_analysis', 'patient_data', 'clinical_decisions'],
      hipaaCompliant: true
    },
    'azure-gpt-5-thinking': {
      model: 'azure-gpt-5-thinking',
      costPerToken: 0.000040,
      averageLatency: 2500,
      maxTokens: 128000,
      bestFor: ['complex_phi_analysis', 'clinical_reasoning', 'compliance_audit'],
      hipaaCompliant: true
    },

    // Claude for specific use cases
    'claude-sonnet': {
      model: 'claude-3-5-sonnet-20241022',
      costPerToken: 0.000015,
      averageLatency: 1000,
      maxTokens: 200000,
      bestFor: ['document_analysis', 'policy_review', 'detailed_responses'],
      hipaaCompliant: false
    },
    'claude-haiku': {
      model: 'claude-3-haiku-20240307',
      costPerToken: 0.000005,
      averageLatency: 300,
      maxTokens: 200000,
      bestFor: ['quick_responses', 'simple_tasks', 'high_volume'],
      hipaaCompliant: false
    }
  };

  // Agent-specific routing rules
  private agentRoutingRules: Record<string, any> = {
    'scheduler_agent': {
      defaultModel: 'gpt-5-main',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-thinking-mini',
      phiModel: 'azure-gpt-5-main'
    },
    'evv_watchdog_agent': {
      defaultModel: 'gpt-5-main-mini',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-main',
      phiModel: 'azure-gpt-5-main'
    },
    'billing_compliance_agent': {
      defaultModel: 'gpt-5-thinking-mini',
      fastModel: 'gpt-5-main',
      complexModel: 'gpt-5-thinking',
      phiModel: 'azure-gpt-5-thinking'
    },
    'policy_brain_agent': {
      defaultModel: 'claude-sonnet',
      fastModel: 'gpt-5-main',
      complexModel: 'gpt-5-thinking',
      phiModel: 'azure-gpt-5-thinking'
    },
    'hipaa_guardian_agent': {
      defaultModel: 'azure-gpt-5-main',
      fastModel: 'azure-gpt-5-main',
      complexModel: 'azure-gpt-5-thinking',
      phiModel: 'azure-gpt-5-thinking'
    },
    'executive_copilot_agent': {
      defaultModel: 'gpt-5-thinking',
      fastModel: 'gpt-5-main',
      complexModel: 'gpt-5-thinking',
      phiModel: 'azure-gpt-5-thinking'
    },
    'recruiting_screener_agent': {
      defaultModel: 'gpt-5-main',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-thinking-mini',
      phiModel: 'azure-gpt-5-main'
    },
    'no_show_predictor_agent': {
      defaultModel: 'gpt-5-main-mini',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-main',
      phiModel: 'azure-gpt-5-main'
    },
    'denial_resolution_agent': {
      defaultModel: 'gpt-5-thinking-mini',
      fastModel: 'gpt-5-main',
      complexModel: 'gpt-5-thinking',
      phiModel: 'azure-gpt-5-thinking'
    },
    'fpa_copilot_agent': {
      defaultModel: 'gpt-5-thinking',
      fastModel: 'gpt-5-main',
      complexModel: 'gpt-5-thinking',
      phiModel: 'azure-gpt-5-thinking'
    },
    'ai_companion': {
      defaultModel: 'gpt-5-main',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-thinking-mini',
      phiModel: 'azure-gpt-5-main'
    },
    'family_concierge_agent': {
      defaultModel: 'gpt-5-main',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-main',
      phiModel: 'azure-gpt-5-main'
    },
    'training_policy_agent': {
      defaultModel: 'claude-sonnet',
      fastModel: 'gpt-5-main',
      complexModel: 'gpt-5-thinking-mini',
      phiModel: 'azure-gpt-5-main'
    },
    'notification_agent': {
      defaultModel: 'gpt-5-main-mini',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-main',
      phiModel: 'azure-gpt-5-main'
    },
    'survey_feedback_agent': {
      defaultModel: 'gpt-5-main',
      fastModel: 'gpt-5-main-mini',
      complexModel: 'gpt-5-thinking-mini',
      phiModel: 'azure-gpt-5-main'
    }
  };

  private cache = new Map<string, { response: any; expires: number; cost: number }>();
  private costTracker = {
    daily: 0,
    monthly: 0,
    lastReset: new Date().toDateString()
  };

  constructor(
    private auditLogger: AuditLogger
  ) {
    this.initializeCostTracking();
  }

  /**
   * Intelligent model selection based on request characteristics
   */
  selectOptimalModel(request: AIRequest): string {
    const agentRules = this.agentRoutingRules[request.agentType];
    if (!agentRules) {
      return request.requiresPHI ? 'azure-gpt-5-main' : 'gpt-5-main';
    }

    // PHI always routes to HIPAA-compliant models
    if (request.requiresPHI) {
      return agentRules.phiModel;
    }

    // Route based on complexity and response time requirements
    if (request.responseTime === 'fast' && request.complexity === 'simple') {
      return agentRules.fastModel;
    }

    if (request.complexity === 'complex' || request.complexity === 'expert') {
      return agentRules.complexModel;
    }

    if (request.responseTime === 'thorough') {
      return agentRules.complexModel;
    }

    return agentRules.defaultModel;
  }

  /**
   * Enhanced prompt engineering with GPT-5 specific parameters
   */
  buildOptimizedPrompt(request: AIRequest, modelName: string): any {
    const basePrompt: Record<string, any> = {
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(request.agentType)
        },
        {
          role: 'user',
          content: request.prompt
        }
      ],
      model: modelName,
      max_tokens: request.maxTokens || this.getOptimalTokenLimit(modelName, request),
      temperature: this.getOptimalTemperature(request.agentType, request.complexity)
    };

    // GPT-5 specific parameters
    if (modelName.startsWith('gpt-5')) {
      // Use new GPT-5 parameters for better control
      basePrompt['verbosity'] = this.getVerbosityLevel(request);
      basePrompt['reasoning_effort'] = this.getReasoningEffort(request);

      // Use thinking variants for complex reasoning
      if (modelName.includes('thinking') && request.complexity === 'complex') {
        basePrompt['enable_deep_reasoning'] = true;
      }
    }

    // Add context if provided
    if (request.context) {
      basePrompt.messages.unshift({
        role: 'system',
        content: `Context: ${JSON.stringify(request.context)}`
      });
    }

    return basePrompt;
  }

  /**
   * Execute AI request with optimal routing and caching
   */
  async executeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return {
        response: cached.response,
        modelUsed: 'cached',
        tokensUsed: 0,
        cost: 0,
        processingTime: Date.now() - startTime,
        confidence: 1.0,
        cached: true
      };
    }

    // Select optimal model
    const selectedModel = this.selectOptimalModel(request);
    const modelConfig = this.modelConfigs[selectedModel];

    if (!modelConfig) {
      throw new Error(`Model configuration not found for: ${selectedModel}`);
    }

    // Build optimized prompt
    const prompt = this.buildOptimizedPrompt(request, selectedModel);

    try {
      // Execute request based on model type
      let response;
      let tokensUsed = 0;

      if (selectedModel.startsWith('gpt-5') || selectedModel.startsWith('azure-gpt')) {
        response = await this.executeOpenAIRequest(prompt, selectedModel);
        tokensUsed = response.usage?.total_tokens || 0;
      } else if (selectedModel.startsWith('claude')) {
        response = await this.executeClaudeRequest(prompt, selectedModel);
        tokensUsed = this.estimateClaudeTokens(prompt, response);
      }

      const processingTime = Date.now() - startTime;
      const cost = tokensUsed * modelConfig.costPerToken;

      // Update cost tracking
      this.updateCostTracking(cost);

      // Cache successful responses (non-PHI only)
      if (!request.requiresPHI && this.shouldCache(request)) {
        this.cache.set(cacheKey, {
          response: response.content || response.choices?.[0]?.message?.content,
          expires: Date.now() + this.getCacheDuration(request),
          cost
        });
      }

      // Audit logging
      await this.auditLogger.logActivity({
        userId: 'ai_agent',
        action: 'ai_request',
        resource: 'ai_usage',
        details: {
          agentType: request.agentType,
          modelUsed: selectedModel,
          tokensUsed,
          cost,
          processingTime,
          requiresPHI: request.requiresPHI
        }
      });

      return {
        response: response.content || response.choices?.[0]?.message?.content,
        modelUsed: selectedModel,
        tokensUsed,
        cost,
        processingTime,
        confidence: this.calculateConfidence(response, modelConfig),
        cached: false
      };

    } catch (error) {
      // Fallback to simpler model on error
      if (selectedModel !== 'gpt-5-main-mini' && !request.requiresPHI) {
        apiLogger.info(`Falling back from ${selectedModel} to gpt-5-main-mini due to error:`, error as Record<string, any>);
        const fallbackRequest = { ...request, complexity: 'simple' as const };
        return this.executeRequest(fallbackRequest);
      }
      throw error;
    }
  }

  /**
   * Execute OpenAI/Azure OpenAI request
   */
  private async executeOpenAIRequest(prompt: any, model: string): Promise<any> {
    const isAzure = model.startsWith('azure-');
    const { apiKey, endpoint } = isAzure
      ? environmentService.getAzureOpenAIConfig()
      : { apiKey: environmentService.getOpenAIConfig().apiKey, endpoint: 'https://api.openai.com/v1' };
    const baseUrl = isAzure ? endpoint : 'https://api.openai.com/v1';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(isAzure && { 'api-key': apiKey })
      },
      body: JSON.stringify({
        ...prompt,
        model: isAzure ? model.replace('azure-', '') : model
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute Claude request
   */
  private async executeClaudeRequest(prompt: any, model: string): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${environmentService.getAnthropicConfig().apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: prompt.max_tokens,
        messages: prompt.messages.filter((m: any) => m.role !== 'system'),
        system: prompt.messages.find((m: any) => m.role === 'system')?.content
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * GPT-5 specific parameter optimization
   */
  private getVerbosityLevel(request: AIRequest): 'low' | 'medium' | 'high' {
    if (request.agentType === 'ai_companion' || request.responseTime === 'fast') {
      return 'low';
    }
    if (request.agentType === 'executive_copilot_agent' || request.complexity === 'complex') {
      return 'high';
    }
    return 'medium';
  }

  private getReasoningEffort(request: AIRequest): 'minimal' | 'low' | 'medium' | 'high' | 'extensive' {
    const effortMap: Record<string, 'minimal' | 'low' | 'medium' | 'high' | 'extensive'> = {
      'simple': 'minimal',
      'moderate': 'low',
      'complex': 'high',
      'expert': 'extensive'
    };
    return effortMap[request.complexity] || 'medium';
  }

  private getOptimalTemperature(agentType: string, complexity: string): number {
    // Lower temperature for precise agents
    const preciseAgents = ['billing_compliance_agent', 'evv_watchdog_agent', 'hipaa_guardian_agent'];
    if (preciseAgents.includes(agentType)) {
      return 0.1;
    }

    // Higher temperature for creative agents
    const creativeAgents = ['ai_companion', 'family_concierge_agent', 'executive_copilot_agent'];
    if (creativeAgents.includes(agentType)) {
      return 0.7;
    }

    // Complexity-based adjustment
    const complexityMap: Record<string, number> = {
      'simple': 0.3,
      'moderate': 0.5,
      'complex': 0.6,
      'expert': 0.4 // Lower for expert-level precision
    };

    return complexityMap[complexity] || 0.5;
  }

  private getOptimalTokenLimit(modelName: string, request: AIRequest): number {
    const modelConfig = this.modelConfigs[modelName];
    if (!modelConfig) {
      return 16000; // Fallback token limit
    }
    const baseLimit = Math.min(modelConfig.maxTokens * 0.8, 32000); // Reserve 20% for input

    // Adjust based on agent type
    const tokenAdjustments: Record<string, number> = {
      'policy_brain_agent': 1.5,
      'executive_copilot_agent': 1.3,
      'ai_companion': 0.5,
      'notification_agent': 0.3,
      'evv_watchdog_agent': 0.4
    };

    const adjustment = tokenAdjustments[request.agentType] || 1.0;
    return Math.floor(baseLimit * adjustment);
  }

  /**
   * Cost optimization and tracking
   */
  private initializeCostTracking(): void {
    // Reset daily costs at midnight
    setInterval(() => {
      const today = new Date().toDateString();
      if (this.costTracker.lastReset !== today) {
        this.costTracker.daily = 0;
        this.costTracker.lastReset = today;
      }
    }, 60000); // Check every minute
  }

  private updateCostTracking(cost: number): void {
    this.costTracker.daily += cost;
    this.costTracker.monthly += cost;
  }

  async getCostAnalytics(): Promise<any> {
    return {
      today: this.costTracker.daily,
      month: this.costTracker.monthly,
      projectedMonthly: this.costTracker.daily * 30, // Simple projection
      modelUsage: await this.getModelUsageStats(),
      optimization: await this.getCostOptimizationSuggestions()
    };
  }

  /**
   * Advanced caching strategy
   */
  private generateCacheKey(request: AIRequest): string {
    const keyData = {
      agentType: request.agentType,
      prompt: this.hashPrompt(request.prompt),
      complexity: request.complexity,
      requiresPHI: request.requiresPHI
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private shouldCache(request: AIRequest): boolean {
    // Don't cache PHI-related requests
    if (request.requiresPHI) return false;

    // Cache policy/compliance queries longer
    const longCacheAgents = ['policy_brain_agent', 'training_policy_agent'];
    if (longCacheAgents.includes(request.agentType)) return true;

    // Cache simple, repetitive requests
    if (request.complexity === 'simple' && request.responseTime === 'fast') return true;

    return false;
  }

  private getCacheDuration(request: AIRequest): number {
    const durationMap: { [key: string]: number } = {
      'policy_brain_agent': 24 * 60 * 60 * 1000, // 24 hours
      'training_policy_agent': 12 * 60 * 60 * 1000, // 12 hours
      'ai_companion': 60 * 60 * 1000, // 1 hour
      'notification_agent': 30 * 60 * 1000 // 30 minutes
    };

    return durationMap[request.agentType] || 60 * 60 * 1000; // Default 1 hour
  }

  // Helper methods
  private hashPrompt(prompt: string): string {
    // Simple hash for caching (would use proper crypto in production)
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private estimateClaudeTokens(prompt: any, response: any): number {
    // Rough estimation for Claude tokens
    const inputText = JSON.stringify(prompt);
    const outputText = JSON.stringify(response);
    return Math.ceil((inputText.length + outputText.length) / 4);
  }

  private calculateConfidence(response: any, modelConfig: ModelConfig): number {
    // Implement confidence scoring based on response characteristics
    // This is a simplified version
    if (response.choices && response.choices.rows[0].finish_reason === 'stop') {
      return 0.9;
    }
    return 0.8;
  }

  private getSystemPrompt(agentType: string): string {
    // Return agent-specific system prompts
    // This would be imported from your existing prompt templates
    return `You are the ${agentType} for Serenity ERP healthcare system.`;
  }

  private async getModelUsageStats(): Promise<any> {
    // Return usage statistics by model
    return {};
  }

  private async getCostOptimizationSuggestions(): Promise<string[]> {
    const suggestions = [];

    if (this.costTracker.daily > 100) {
      suggestions.push('Consider increasing cache duration for frequently requested data');
    }

    if (this.costTracker.monthly > 2000) {
      suggestions.push('Evaluate switching some complex queries to lighter models');
    }

    return suggestions;
  }
}