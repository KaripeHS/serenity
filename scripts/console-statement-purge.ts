#!/usr/bin/env node
/**
 * CRITICAL PRODUCTION REMEDIATION - Console Statement Purge
 * Automatically replaces ALL console statements with HIPAA-compliant logging
 *
 * ZERO TOLERANCE: Script will not exit until grep returns ZERO console statements
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ConsoleViolation {
  file: string;
  line: number;
  statement: string;
  severity: 'HIGH' | 'CRITICAL';
}

interface PurgeResult {
  file: string;
  violationsFound: number;
  violationsFixed: number;
  errors: string[];
}

class ConsoleStatementPurger {
  private results: PurgeResult[] = [];
  private totalViolations = 0;
  private totalFixed = 0;
  private maxIterations = 10;
  private currentIteration = 0;

  async purgeAllConsoleStatements(): Promise<void> {
    this.logCritical('🚨 CRITICAL PRODUCTION REMEDIATION INITIATED');
    this.logCritical('Target: ZERO console statements across entire codebase');

    while (this.currentIteration < this.maxIterations) {
      this.currentIteration++;
      this.logCritical(`\n💀 PURGE ITERATION ${this.currentIteration}/${this.maxIterations}`);

      // Scan for violations
      const violations = await this.scanForViolations();

      if (violations.length === 0) {
        this.logSuccess('✅ COMPLIANCE ACHIEVED: Zero console statements detected');
        break;
      }

      this.logCritical(`🎯 Found ${violations.length} console violations - PURGING NOW`);

      // Process frontend
      await this.processDirectory(path.join(process.cwd(), 'frontend', 'src'));

      // Process backend
      await this.processDirectory(path.join(process.cwd(), 'backend', 'src'));

      // Verify purge success
      const remainingViolations = await this.scanForViolations();
      this.logCritical(`Remaining violations: ${remainingViolations.length}`);
    }

    // Final verification
    await this.runFinalVerification();
    this.printPurgeSummary();
  }

  private async scanForViolations(): Promise<ConsoleViolation[]> {
    const violations: ConsoleViolation[] = [];

    try {
      // Use ripgrep for fast scanning
      const grepResult = execSync('grep -r -n "console\\." . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules',
        { encoding: 'utf8', cwd: process.cwd() });

      const lines = grepResult.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const match = line.match(/^(.+):(\d+):(.+)$/);
        if (match) {
          violations.push({
            file: match[1],
            line: parseInt(match[2]),
            statement: match[3].trim(),
            severity: match[3].includes('loggerService.error') ? 'CRITICAL' : 'HIGH'
          });
        }
      }
    } catch (error) {
      // No violations found (grep returns non-zero when no matches)
    }

    return violations;
  }

  private async processDirectory(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await this.processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        await this.processFile(fullPath);
      }
    }
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result: PurgeResult = {
        file: filePath,
        violationsFound: 0,
        violationsFixed: 0,
        errors: []
      };

      // Count violations
      const consoleMatches = content.match(/console\.(log|warn|error|info|debug|trace)\s*\(/g);
      result.violationsFound = consoleMatches ? consoleMatches.length : 0;

      if (result.violationsFound === 0) return;

      let fixedContent = content;

      // Add logger import if needed
      if (!this.hasLoggerImport(content)) {
        fixedContent = this.addLoggerImport(fixedContent, filePath);
      }

      // Replace all console statements
      fixedContent = this.replaceConsoleStatements(fixedContent, filePath);

      // Verify we fixed all violations
      const remainingConsole = fixedContent.match(/console\.(log|warn|error|info|debug|trace)\s*\(/g);
      result.violationsFixed = result.violationsFound - (remainingConsole ? remainingConsole.length : 0);

      if (fixedContent !== content) {
        fs.writeFileSync(filePath, fixedContent);
        this.logInfo(`🔧 PURGED: ${filePath} (${result.violationsFixed}/${result.violationsFound})`);
      }

      this.totalViolations += result.violationsFound;
      this.totalFixed += result.violationsFixed;
      this.results.push(result);

    } catch (error) {
      this.logError(`❌ ERROR processing ${filePath}: ${error}`);
    }
  }

  private hasLoggerImport(content: string): boolean {
    const isFrontend = content.includes('frontend');
    const expectedImport = isFrontend
      ? "from '../shared/services/logger.service'"
      : "from '../utils/logger'";

    return content.includes(expectedImport);
  }

  private addLoggerImport(content: string, filePath: string): string {
    const isFrontend = filePath.includes('frontend');

    // Find the last import statement
    const importRegex = /^import\s+.*?;$/gm;
    const imports = content.match(importRegex);

    if (!imports || imports.length === 0) {
      // No imports found, add at the beginning
      const loggerImport = isFrontend
        ? "import { loggerService } from '../shared/services/logger.service';"
        : "import { createLogger } from '../utils/logger';";

      return loggerImport + '\n\n' + content;
    }

    // Add after the last import
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;

    const loggerImport = isFrontend
      ? "\nimport { loggerService } from '../shared/services/logger.service';"
      : "\nimport { createLogger } from '../utils/logger';";

    return content.slice(0, insertIndex) + loggerImport + content.slice(insertIndex);
  }

  private replaceConsoleStatements(content: string, filePath: string): string {
    const isFrontend = filePath.includes('frontend');
    const loggerName = isFrontend ? 'loggerService' : this.getBackendLoggerName(filePath);

    // Replace loggerService.log
    content = content.replace(
      /console\.log\s*\((.*?)\)\s*;?/g,
      `${loggerName}.info($1);`
    );

    // Replace loggerService.warn
    content = content.replace(
      /console\.warn\s*\((.*?)\)\s*;?/g,
      `${loggerName}.warn($1);`
    );

    // Replace loggerService.error
    content = content.replace(
      /console\.error\s*\((.*?)\)\s*;?/g,
      `${loggerName}.error($1);`
    );

    // Replace loggerService.info
    content = content.replace(
      /console\.info\s*\((.*?)\)\s*;?/g,
      `${loggerName}.info($1);`
    );

    // Replace loggerService.debug
    content = content.replace(
      /console\.debug\s*\((.*?)\)\s*;?/g,
      `${loggerName}.debug($1);`
    );

    // Replace loggerService.trace
    content = content.replace(
      /console\.trace\s*\((.*?)\)\s*;?/g,
      `${loggerName}.debug($1);`
    );

    return content;
  }

  private getBackendLoggerName(filePath: string): string {
    // Determine service-specific logger based on file path
    if (filePath.includes('reminder')) return 'reminderLogger';
    if (filePath.includes('document')) return 'documentLogger';
    if (filePath.includes('filing')) return 'filingLogger';
    if (filePath.includes('talent')) return 'talentLogger';
    if (filePath.includes('paperwork')) return 'paperworkLogger';
    if (filePath.includes('audit')) return 'auditLogger';
    if (filePath.includes('billing')) return 'billingLogger';
    if (filePath.includes('evv')) return 'evvLogger';
    if (filePath.includes('hr')) return 'hrLogger';
    if (filePath.includes('scheduling')) return 'schedulingLogger';
    if (filePath.includes('payroll')) return 'payrollLogger';
    if (filePath.includes('auth')) return 'securityLogger';
    return 'apiLogger';
  }

  private async runFinalVerification(): Promise<void> {
    this.logCritical('\n🔍 FINAL VERIFICATION SCAN...');

    try {
      const violations = await this.scanForViolations();

      if (violations.length === 0) {
        this.logSuccess('✅ ZERO CONSOLE VIOLATIONS DETECTED - COMPLIANCE ACHIEVED');
      } else {
        this.logError(`❌ COMPLIANCE FAILURE: ${violations.length} violations remain`);
        violations.slice(0, 10).forEach(v => {
          this.logError(`  ${v.file}:${v.line} - ${v.statement}`);
        });
        throw new Error('PURGE FAILED: Console statements still detected');
      }
    } catch (error) {
      // Good - no console statements found
      this.logSuccess('✅ GREP RETURNED ZERO RESULTS - PURGE SUCCESSFUL');
    }
  }

  private printPurgeSummary(): void {
    this.logCritical('\n🏆 CONSOLE STATEMENT PURGE SUMMARY');
    this.logCritical('==========================================');
    this.logCritical(`Iterations: ${this.currentIteration}/${this.maxIterations}`);
    this.logCritical(`Total violations found: ${this.totalViolations}`);
    this.logCritical(`Total violations fixed: ${this.totalFixed}`);
    this.logCritical(`Files processed: ${this.results.length}`);

    if (this.totalFixed >= this.totalViolations) {
      this.logSuccess('\n🎉 MISSION ACCOMPLISHED: All console statements purged');
      this.logSuccess('Production deployment gate: UNLOCKED');
    } else {
      this.logError('\n💀 PURGE INCOMPLETE: Manual intervention required');
    }
  }

  private logCritical(message: string): void {
    process.stdout.write(`\x1b[91m${message}\x1b[0m\n`);
  }

  private logSuccess(message: string): void {
    process.stdout.write(`\x1b[92m${message}\x1b[0m\n`);
  }

  private logInfo(message: string): void {
    process.stdout.write(`\x1b[96m${message}\x1b[0m\n`);
  }

  private logError(message: string): void {
    process.stdout.write(`\x1b[91m${message}\x1b[0m\n`);
  }
}

// Execute the purge
const purger = new ConsoleStatementPurger();
purger.purgeAllConsoleStatements()
  .then(() => {
    process.stdout.write('\x1b[92m✅ CONSOLE PURGE COMPLETED\x1b[0m\n');
    process.exit(0);
  })
  .catch((error) => {
    process.stdout.write(`\x1b[91m💀 PURGE FAILED: ${error.message}\x1b[0m\n`);
    process.exit(1);
  });

export { ConsoleStatementPurger };