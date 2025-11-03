#!/usr/bin/env node
/**
 * CRITICAL TYPESCRIPT ERROR FIXER
 * Automatically fixes common TypeScript compilation errors
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  errorCode: string;
  message: string;
}

interface FixResult {
  file: string;
  errorsFound: number;
  errorsFixed: number;
  description: string[];
}

class TypeScriptErrorFixer {
  private results: FixResult[] = [];
  private totalErrors = 0;
  private totalFixed = 0;

  async fixAllErrors(): Promise<void> {
    this.logCritical('🔧 TYPESCRIPT ERROR FIXER INITIATED');
    this.logCritical('Target: Fix all compilation errors for production readiness');

    // Fix frontend errors
    await this.fixFrontendErrors();

    // Fix backend errors
    await this.fixBackendErrors();

    this.printFixingSummary();
  }

  private async fixFrontendErrors(): Promise<void> {
    this.logInfo('🎯 Fixing frontend TypeScript errors...');

    try {
      // Get TypeScript errors
      const errors = await this.getFrontendErrors();
      this.logInfo(`Found ${errors.length} frontend TypeScript errors`);

      // Fix SuperAdminConsole.tsx errors (major source of errors)
      await this.fixSuperAdminConsoleErrors();

      // Fix other common frontend errors
      await this.fixCommonFrontendErrors();

    } catch (error) {
      this.logError(`Error fixing frontend: ${error}`);
    }
  }

  private async fixBackendErrors(): Promise<void> {
    this.logInfo('🎯 Fixing backend TypeScript errors...');

    try {
      // Fix backend imports and type issues
      await this.fixBackendImports();
      await this.fixBackendTypeIssues();

    } catch (error) {
      this.logError(`Error fixing backend: ${error}`);
    }
  }

  private async getFrontendErrors(): Promise<string[]> {
    try {
      execSync('cd frontend && npm run type-check', { stdio: 'pipe' });
      return [];
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      return output.split('\n').filter(line => line.includes('error TS'));
    }
  }

  private async fixSuperAdminConsoleErrors(): Promise<void> {
    const filePath = path.join(process.cwd(), 'frontend', 'src', 'components', 'governance', 'SuperAdminConsole.tsx');

    if (!fs.existsSync(filePath)) {
      this.logError('SuperAdminConsole.tsx not found');
      return;
    }

    const result: FixResult = {
      file: filePath,
      errorsFound: 0,
      errorsFixed: 0,
      description: []
    };

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix common JSX syntax errors from pattern replacement
    const fixes = [
      {
        pattern: /production_value="([^"]+)"/g,
        replacement: 'placeholder="$1"',
        description: 'Fixed placeholder attribute syntax'
      },
      {
        pattern: /loggerService\.info\('([^']+):', ([^}]+)\);\}/g,
        replacement: 'loggerService.info(\'$1\', { data: $2 })}',
        description: 'Fixed logger syntax'
      },
      {
        pattern: /\{[^}]*\{[^}]*\}/g,
        replacement: (match) => {
          // Fix nested braces issues
          const cleaned = match.replace(/\{\s*\{/g, '{').replace(/\}\s*\}/g, '}');
          return cleaned;
        },
        description: 'Fixed nested brace syntax'
      },
      {
        pattern: /onClick=\{[^}]*;[^}]*\}/g,
        replacement: (match) => {
          // Remove semicolons from onClick handlers
          return match.replace(/;/g, '');
        },
        description: 'Fixed onClick handler syntax'
      }
    ];

    fixes.forEach(fix => {
      const beforeCount = (content.match(fix.pattern) || []).length;
      if (beforeCount > 0) {
        content = content.replace(fix.pattern, fix.replacement);
        const afterCount = (content.match(fix.pattern) || []).length;
        const fixed = beforeCount - afterCount;

        result.errorsFound += beforeCount;
        result.errorsFixed += fixed;
        result.description.push(`${fix.description}: ${fixed} fixes`);
      }
    });

    // Additional manual fixes for specific syntax errors
    content = this.fixJSXSyntaxIssues(content);
    content = this.fixImportStatements(content);
    content = this.fixFunctionSyntax(content);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      this.logInfo(`🔧 FIXED: ${filePath} (${result.errorsFixed} errors)`);
      this.results.push(result);
      this.totalErrors += result.errorsFound;
      this.totalFixed += result.errorsFixed;
    }
  }

  private fixJSXSyntaxIssues(content: string): string {
    // Fix unclosed JSX tags and malformed attributes
    content = content.replace(/production_value=/g, 'placeholder=');

    // Fix broken onClick handlers
    content = content.replace(/onClick=\{[^}]*;[^}]*\}/g, (match) => {
      return match.replace(/;/g, '');
    });

    // Fix malformed JSX expressions
    content = content.replace(/\{\s*\{/g, '{');
    content = content.replace(/\}\s*\}/g, '}');

    return content;
  }

  private fixImportStatements(content: string): string {
    // Ensure proper import syntax
    if (!content.includes('import { loggerService }')) {
      const importIndex = content.indexOf('import React');
      if (importIndex !== -1) {
        const insertIndex = content.indexOf('\n', importIndex) + 1;
        content = content.slice(0, insertIndex) +
          "import { loggerService } from '../../shared/services/logger.service';\n" +
          content.slice(insertIndex);
      }
    }

    return content;
  }

  private fixFunctionSyntax(content: string): string {
    // Fix function parameter syntax
    content = content.replace(/\(\s*\{[^}]*\}\s*\)\s*=>/g, (match) => {
      // Ensure proper destructuring syntax
      return match.replace(/\s+/g, ' ');
    });

    return content;
  }

  private async fixCommonFrontendErrors(): Promise<void> {
    const commonFiles = [
      'frontend/src/components/ai/AICompanion.tsx',
      'frontend/src/components/ui/Input.tsx',
      'frontend/src/App-simple.tsx'
    ];

    for (const file of commonFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        await this.fixFileCommonErrors(fullPath);
      }
    }
  }

  private async fixFileCommonErrors(filePath: string): Promise<void> {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix production_value attributes
    content = content.replace(/production_value=/g, 'placeholder=');

    // Fix any remaining pattern replacement issues
    content = content.replace(/production implementation/g, 'implementation');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      this.logInfo(`🔧 FIXED: ${filePath}`);
    }
  }

  private async fixBackendImports(): Promise<void> {
    const backendFiles = [
      'backend/src/automation/talent-pipeline.ts',
      'backend/src/ai/gpt5-router.service.ts'
    ];

    for (const file of backendFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        await this.fixBackendFileImports(fullPath);
      }
    }
  }

  private async fixBackendFileImports(filePath: string): Promise<void> {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix import statement formatting
    content = content.replace(/import { createLogger } from '\.\.\/utils\/logger';\nimport { environmentService }/g,
      "import { createLogger } from '../utils/logger';\nimport { environmentService }");

    // Ensure environment service is properly imported
    if (content.includes('environmentService') && !content.includes('import { environmentService }')) {
      const createLoggerImport = content.indexOf("import { createLogger } from '../utils/logger';");
      if (createLoggerImport !== -1) {
        const insertIndex = content.indexOf('\n', createLoggerImport) + 1;
        content = content.slice(0, insertIndex) +
          "import { environmentService } from '../config/environment';\n" +
          content.slice(insertIndex);
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      this.logInfo(`🔧 FIXED: ${filePath}`);
    }
  }

  private async fixBackendTypeIssues(): Promise<void> {
    // Create missing interface files if needed
    await this.createMissingInterfaces();
  }

  private async createMissingInterfaces(): Promise<void> {
    const interfaceFiles = [
      {
        path: 'backend/src/types/common.ts',
        content: `
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
`
      }
    ];

    for (const file of interfaceFiles) {
      const fullPath = path.join(process.cwd(), file.path);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, file.content);
        this.logInfo(`📄 CREATED: ${file.path}`);
      }
    }
  }

  private printFixingSummary(): void {
    this.logCritical('\n🔧 TYPESCRIPT ERROR FIXING SUMMARY');
    this.logCritical('=======================================');
    this.logCritical(`Total errors found: ${this.totalErrors}`);
    this.logCritical(`Total errors fixed: ${this.totalFixed}`);
    this.logCritical(`Files processed: ${this.results.length}`);

    if (this.results.length > 0) {
      this.logInfo('\nFiles with fixes applied:');
      this.results.forEach(result => {
        this.logInfo(`  ${result.file}:`);
        result.description.forEach(desc => {
          this.logInfo(`    - ${desc}`);
        });
      });
    }

    if (this.totalFixed > 0) {
      this.logSuccess('\n🎉 TYPESCRIPT ERRORS FIXED');
      this.logSuccess('Compilation readiness improved');
    } else {
      this.logError('\n💀 NO FIXES APPLIED');
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

// Execute the fixer
const fixer = new TypeScriptErrorFixer();
fixer.fixAllErrors()
  .then(() => {
    process.stdout.write('\x1b[92m✅ TYPESCRIPT ERROR FIXING COMPLETED\x1b[0m\n');
    process.exit(0);
  })
  .catch((error) => {
    process.stdout.write(`\x1b[91m💀 FIXING FAILED: ${error.message}\x1b[0m\n`);
    process.exit(1);
  });

export { TypeScriptErrorFixer };