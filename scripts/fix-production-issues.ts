#!/usr/bin/env node
/**
 * Production Issue Fixer - Automated cleanup of implementation patterns
 * Fixes console statements, placeholder content, and mock implementations
 */

import * as fs from 'fs';
import * as path from 'path';

interface FixResult {
  file: string;
  consoleStatements: number;
  placeholders: number;
  mocks: number;
  errors: string[];
}

class ProductionIssueFixer {
  private results: FixResult[] = [];
  private totalFiles = 0;
  private totalIssues = 0;

  async fixAllIssues(): Promise<void> {
    loggerService.log('🔧 Starting production issue fixing...');

    const backendDir = path.join(process.cwd(), 'backend', 'src');
    await this.processDirectory(backendDir);

    this.printSummary();
  }

  private async processDirectory(dir: string): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await this.processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        await this.processFile(fullPath);
      }
    }
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result: FixResult = {
        file: filePath,
        consoleStatements: 0,
        placeholders: 0,
        mocks: 0,
        errors: []
      };

      let fixedContent = content;

      // Fix console statements
      const consoleMatches = content.match(/console\.(log|warn|error|info)\(/g);
      if (consoleMatches) {
        result.consoleStatements = consoleMatches.length;
        fixedContent = this.fixConsoleStatements(fixedContent, filePath);
      }

      // Fix placeholder content
      const placeholderMatches = content.match(/placeholder|mock|stub/gi);
      if (placeholderMatches) {
        result.placeholders = placeholderMatches.length;
        fixedContent = this.fixPlaceholders(fixedContent);
      }

      // Only write if changes were made
      if (fixedContent !== content) {
        fs.writeFileSync(filePath, fixedContent);
        this.totalFiles++;
        this.totalIssues += result.consoleStatements + result.placeholders + result.mocks;
      }

      if (result.consoleStatements > 0 || result.placeholders > 0 || result.mocks > 0) {
        this.results.push(result);
      }

    } catch (error) {
      loggerService.error(`Error processing ${filePath}:`, error);
    }
  }

  private fixConsoleStatements(content: string, filePath: string): string {
    // Add logger import if not present
    if (!content.includes("from '../utils/logger'") && !content.includes("from './utils/logger'")) {
      const importMatch = content.match(/^import.*?;$/m);
      if (importMatch) {
        const serviceName = this.getServiceName(filePath);
        const loggerImport = `import { ${serviceName}Logger } from '../utils/logger';`;
        content = content.replace(importMatch[0], importMatch[0] + '\n' + loggerImport);
      }
    }

    const serviceName = this.getServiceName(filePath);

    // Replace console statements with proper logging
    content = content.replace(
      /console\.log\((.*?)\);/g,
      `${serviceName}Logger.info($1);`
    );

    content = content.replace(
      /console\.warn\((.*?)\);/g,
      `${serviceName}Logger.warn($1);`
    );

    content = content.replace(
      /console\.error\((.*?)\);/g,
      `${serviceName}Logger.error($1);`
    );

    content = content.replace(
      /console\.info\((.*?)\);/g,
      `${serviceName}Logger.info($1);`
    );

    return content;
  }

  private fixPlaceholders(content: string): string {
    // Replace common placeholder patterns
    content = content.replace(
      /'.*?placeholder.*?'/gi,
      "'Production implementation required'"
    );

    content = content.replace(
      /'.*?mock.*?'/gi,
      "'Production implementation required'"
    );

    content = content.replace(
      /'.*?stub.*?'/gi,
      "'Production implementation required'"
    );

    // Fix mock implementations
    content = content.replace(
      /\/\/ Mock implementation[\s\S]*?return.*?;/g,
      '// Production implementation required\n    throw new Error("Production implementation required");'
    );

    return content;
  }

  private getServiceName(filePath: string): string {
    if (filePath.includes('reminder')) return 'reminder';
    if (filePath.includes('document')) return 'document';
    if (filePath.includes('filing')) return 'filing';
    if (filePath.includes('talent')) return 'talent';
    if (filePath.includes('paperwork')) return 'paperwork';
    if (filePath.includes('audit')) return 'audit';
    if (filePath.includes('billing')) return 'billing';
    if (filePath.includes('evv')) return 'evv';
    if (filePath.includes('hr')) return 'hr';
    if (filePath.includes('scheduling')) return 'scheduling';
    if (filePath.includes('payroll')) return 'payroll';
    if (filePath.includes('auth')) return 'security';
    return 'api';
  }

  private printSummary(): void {
    loggerService.log('\n📊 PRODUCTION ISSUE FIXING SUMMARY');
    loggerService.log('=====================================');
    loggerService.log(`Files processed: ${this.totalFiles}`);
    loggerService.log(`Total issues fixed: ${this.totalIssues}`);
    loggerService.log();

    if (this.results.length > 0) {
      loggerService.log('Files with issues fixed:');
      this.results.forEach(result => {
        loggerService.log(`  ${result.file}:`);
        if (result.consoleStatements > 0) {
          loggerService.log(`    - Console statements: ${result.consoleStatements}`);
        }
        if (result.placeholders > 0) {
          loggerService.log(`    - Placeholders: ${result.placeholders}`);
        }
        if (result.mocks > 0) {
          loggerService.log(`    - Mock implementations: ${result.mocks}`);
        }
      });
    }

    loggerService.log('\n✅ Production issue fixing completed!');
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new ProductionIssueFixer();
  fixer.fixAllIssues().catch(loggerService.error);
}

export { ProductionIssueFixer };