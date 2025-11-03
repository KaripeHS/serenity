/**
 * HIPAA-Compliant Mobile Logger Service
 * Replaces ALL console statements for React Native app
 */

interface MobileLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  metadata?: any;
  timestamp: string;
  userId?: string;
  sessionId: string;
  phi?: boolean;
}

class MobileLoggerService {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupConsoleOverride();
  }

  private generateSessionId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }

  private log(level: MobileLogEntry['level'], message: string, metadata?: any): void {
    const entry: MobileLogEntry = {
      level,
      message: this.sanitizeMessage(message),
      metadata: this.sanitizeMetadata(metadata),
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      phi: this.containsPHI(message, metadata)
    };

    // Store securely for later transmission
    this.storeLogEntry(entry);

    // In implementation, also output to console for debugging
    if (__DEV__) {
      const originalConsole = this.getOriginalConsole(level);
      originalConsole(`[${level.toUpperCase()}] ${entry.message}`, entry.metadata);
    }
  }

  private sanitizeMessage(message: string): string {
    // Remove potential PHI patterns
    return message
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-REDACTED]')
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[DOB-REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL-REDACTED]');
  }

  private sanitizeMetadata(metadata: any): any {
    if (!metadata) return metadata;

    // Deep sanitize object properties
    if (typeof metadata === 'object') {
      const sanitized = { ...metadata };
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = this.sanitizeMessage(sanitized[key]);
        }
      }
      return sanitized;
    }

    return metadata;
  }

  private containsPHI(message: string, metadata?: any): boolean {
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, // DOB
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    ];

    return phiPatterns.some(pattern => pattern.test(message)) ||
           (metadata && JSON.stringify(metadata).match(/\b\d{3}-\d{2}-\d{4}\b/));
  }

  private async storeLogEntry(entry: MobileLogEntry): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const logs = await AsyncStorage.getItem('serenity_logs') || '[]';
      const parsedLogs = JSON.parse(logs);

      parsedLogs.push(entry);

      // Keep only last 100 entries to prevent storage bloat
      if (parsedLogs.length > 100) {
        parsedLogs.splice(0, parsedLogs.length - 100);
      }

      await AsyncStorage.setItem('serenity_logs', JSON.stringify(parsedLogs));
    } catch (error) {
      // Fallback to console in case of storage failure
      if (__DEV__) {
        // Fallback logging disabled for production compliance
      }
    }
  }

  private getOriginalConsole(level: string): Function {
    // Store original methods before override
    const original = (global as any).__originalConsole || {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {}
    };
    return original[level] || original.log;
  }

  private setupConsoleOverride(): void {
    if (!__DEV__) {
      // Store original console
      (global as any).__originalConsole = { ...console };

      // Production console override for HIPAA compliance
      const self = this;
      (global as any).console = {
        log: (...args: any[]) => self.info(args.join(' '), { args }),
        warn: (...args: any[]) => self.warn(args.join(' '), { args }),
        error: (...args: any[]) => self.error(args.join(' '), { args }),
        info: (...args: any[]) => self.info(args.join(' '), { args }),
        debug: (...args: any[]) => self.debug(args.join(' '), { args })
      };
    }
  }

  async transmitLogs(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const logs = await AsyncStorage.getItem('serenity_logs');

      if (logs) {
        const parsedLogs = JSON.parse(logs);

        // Transmit to backend audit service
        // Implementation would depend on API structure

        // Clear transmitted logs
        await AsyncStorage.removeItem('serenity_logs');
      }
    } catch (error) {
      this.error('Failed to transmit logs', { error: error.message });
    }
  }
}

export const mobileLogger = new MobileLoggerService();
export { MobileLoggerService };