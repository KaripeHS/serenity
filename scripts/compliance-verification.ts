#!/usr/bin/env node
/**
 * CRITICAL COMPLIANCE VERIFICATION SCRIPT
 * Runs continuous hostile audit until 100% compliance achieved
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ComplianceResult {
  category: string;
  score: number;
  maxScore: number;
  violations: string[];
  status: 'PASS' | 'FAIL' | 'WARNING';
}

interface AuditReport {
  timestamp: string;
  overallScore: number;
  maxScore: number;
  compliancePercent: number;
  results: ComplianceResult[];
  status: 'COMPLIANT' | 'NON_COMPLIANT';
}

class ComplianceVerifier {
  private auditHistory: AuditReport[] = [];
  private maxIterations = 50;
  private currentIteration = 0;
  private targetCompliance = 100;

  async runContinuousAudit(): Promise<void> {
    this.logCritical('🚨 HOSTILE COMPLIANCE AUDIT INITIATED');
    this.logCritical('Target: 100% COMPLIANCE SCORE - ZERO TOLERANCE');

    while (this.currentIteration < this.maxIterations) {
      this.currentIteration++;
      this.logCritical(`\n💀 AUDIT ITERATION ${this.currentIteration}/${this.maxIterations}`);

      const auditReport = await this.runFullAudit();
      this.auditHistory.push(auditReport);

      this.logAuditResults(auditReport);

      if (auditReport.compliancePercent >= this.targetCompliance) {
        this.logSuccess('🎉 100% COMPLIANCE ACHIEVED');
        break;
      } else {
        this.logError(`💀 COMPLIANCE FAILURE: ${auditReport.compliancePercent}% (Target: ${this.targetCompliance}%)`);

        if (this.currentIteration >= this.maxIterations) {
          this.logError('❌ MAX ITERATIONS REACHED - MANUAL INTERVENTION REQUIRED');
          break;
        }
      }
    }

    await this.generateComplianceReport();
  }

  private async runFullAudit(): Promise<AuditReport> {
    const timestamp = new Date().toISOString();
    const results: ComplianceResult[] = [];

    // 1. Console Statement Audit
    results.push(await this.auditConsoleStatements());

    // 2. PHI Leak Detection
    results.push(await this.auditPHILeaks());

    // 3. Secret Detection
    results.push(await this.auditSecrets());

    // 4. Development Pattern Detection
    results.push(await this.auditDevPatterns());

    // 5. TypeScript Compilation
    results.push(await this.auditTypeScript());

    // 6. ESLint Compliance
    results.push(await this.auditESLint());

    // 7. Security Headers
    results.push(await this.auditSecurityHeaders());

    // 8. HIPAA Logger Implementation
    results.push(await this.auditHIPAALogger());

    // Calculate overall score
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const compliancePercent = Math.round((totalScore / maxScore) * 100);

    return {
      timestamp,
      overallScore: totalScore,
      maxScore,
      compliancePercent,
      results,
      status: compliancePercent >= this.targetCompliance ? 'COMPLIANT' : 'NON_COMPLIANT'
    };
  }

  private async auditConsoleStatements(): Promise<ComplianceResult> {
    const violations: string[] = [];

    try {
      const result = execSync('grep -r "console\\." . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules',
        { encoding: 'utf8', cwd: process.cwd() });

      const lines = result.split('\n').filter(line => line.trim());

      // Filter out legitimate console usage in logger service
      const realViolations = lines.filter(line =>
        !line.includes('logger.service.ts') &&
        !line.includes('* CRITICAL: This replaces ALL console') &&
        !line.includes('loggerService.groupCollapsed') &&
        !line.includes('console = ')
      );

      realViolations.forEach(line => violations.push(line));

    } catch (error) {
      // No violations found
    }

    return {
      category: 'Console Statement Audit',
      score: violations.length === 0 ? 20 : 0,
      maxScore: 20,
      violations,
      status: violations.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  private async auditPHILeaks(): Promise<ComplianceResult> {
    const violations: string[] = [];

    try {
      // Check for SSN patterns
      const ssnResult = execSync('grep -r "\\b\\d{3}-\\d{2}-\\d{4}\\b" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules',
        { encoding: 'utf8' });
      ssnResult.split('\n').filter(line => line.trim()).forEach(line =>
        violations.push(`SSN Pattern: ${line}`));
    } catch (error) {}

    try {
      // Check for DOB patterns
      const dobResult = execSync('grep -r "\\b\\d{1,2}/\\d{1,2}/\\d{4}\\b" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules',
        { encoding: 'utf8' });
      dobResult.split('\n').filter(line => line.trim()).forEach(line =>
        violations.push(`DOB Pattern: ${line}`));
    } catch (error) {}

    return {
      category: 'PHI Leak Detection',
      score: violations.length === 0 ? 25 : 0,
      maxScore: 25,
      violations,
      status: violations.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  private async auditSecrets(): Promise<ComplianceResult> {
    const violations: string[] = [];

    try {
      const result = execSync('grep -r "api_key\\|apikey\\|API_KEY\\|password.*=" . --include="*.ts" --include="*.js" --exclude-dir=node_modules',
        { encoding: 'utf8' });
      result.split('\n').filter(line => line.trim()).forEach(line => {
        if (!line.includes('interface') && !line.includes('type') && !line.includes('@param')) {
          violations.push(`Secret: ${line}`);
        }
      });
    } catch (error) {}

    return {
      category: 'Secret Detection',
      score: violations.length === 0 ? 15 : 0,
      maxScore: 15,
      violations,
      status: violations.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  private async auditDevPatterns(): Promise<ComplianceResult> {
    const violations: string[] = [];

    try {
      const result = execSync('grep -r "TODO\\|FIXME\\|hint\\|implementation" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules',
        { encoding: 'utf8' });
      result.split('\n').filter(line => line.trim()).forEach(line =>
        violations.push(`Dev Pattern: ${line}`));
    } catch (error) {}

    return {
      category: 'Development Pattern Detection',
      score: violations.length === 0 ? 10 : Math.max(0, 10 - Math.floor(violations.length / 2)),
      maxScore: 10,
      violations,
      status: violations.length === 0 ? 'PASS' : 'WARNING'
    };
  }

  private async auditTypeScript(): Promise<ComplianceResult> {
    const violations: string[] = [];

    try {
      // Check frontend
      if (fs.existsSync('frontend')) {
        execSync('cd frontend && npm run type-check', { stdio: 'pipe' });
      }
    } catch (error) {
      violations.push('Frontend TypeScript compilation errors');
    }

    try {
      // Check backend
      if (fs.existsSync('backend')) {
        execSync('cd backend && npx tsc --noEmit', { stdio: 'pipe' });
      }
    } catch (error) {
      violations.push('Backend TypeScript compilation errors');
    }

    return {
      category: 'TypeScript Compilation',
      score: violations.length === 0 ? 15 : 0,
      maxScore: 15,
      violations,
      status: violations.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  private async auditESLint(): Promise<ComplianceResult> {
    const violations: string[] = [];

    try {
      if (fs.existsSync('frontend')) {
        execSync('cd frontend && npm run lint', { stdio: 'pipe' });
      }
    } catch (error) {
      violations.push('ESLint violations detected');
    }

    return {
      category: 'ESLint Compliance',
      score: violations.length === 0 ? 10 : 0,
      maxScore: 10,
      violations,
      status: violations.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  private async auditSecurityHeaders(): Promise<ComplianceResult> {
    const violations: string[] = [];

    // Check if security headers are implemented
    const securityFiles = [
      'backend/src/middleware/security.ts',
      'backend/src/config/security.ts'
    ];

    securityFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        violations.push(`Missing security configuration: ${file}`);
      }
    });

    return {
      category: 'Security Headers',
      score: violations.length === 0 ? 5 : 0,
      maxScore: 5,
      violations,
      status: violations.length === 0 ? 'PASS' : 'WARNING'
    };
  }

  private async auditHIPAALogger(): Promise<ComplianceResult> {
    const violations: string[] = [];

    const loggerFiles = [
      'frontend/src/shared/services/logger.service.ts',
      'backend/src/utils/logger.ts'
    ];

    loggerFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        violations.push(`Missing HIPAA logger: ${file}`);
      } else {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.includes('PHI') || !content.includes('redact')) {
          violations.push(`HIPAA logger missing PHI protection: ${file}`);
        }
      }
    });

    return {
      category: 'HIPAA Logger Implementation',
      score: violations.length === 0 ? 15 : 0,
      maxScore: 15,
      violations,
      status: violations.length === 0 ? 'PASS' : 'FAIL'
    };
  }

  private logAuditResults(report: AuditReport): void {
    this.logCritical(`\n📊 AUDIT REPORT - ${report.timestamp}`);
    this.logCritical('='.repeat(60));

    if (report.status === 'COMPLIANT') {
      this.logSuccess(`✅ COMPLIANCE: ${report.compliancePercent}% (${report.overallScore}/${report.maxScore})`);
    } else {
      this.logError(`❌ NON-COMPLIANT: ${report.compliancePercent}% (${report.overallScore}/${report.maxScore})`);
    }

    report.results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      const scoreText = `${result.score}/${result.maxScore}`;

      this.logInfo(`${statusIcon} ${result.category}: ${scoreText}`);

      if (result.violations.length > 0) {
        result.violations.slice(0, 3).forEach(violation => {
          this.logError(`  • ${violation}`);
        });
        if (result.violations.length > 3) {
          this.logError(`  • ... and ${result.violations.length - 3} more violations`);
        }
      }
    });
  }

  private async generateComplianceReport(): Promise<void> {
    const reportPath = 'compliance-audit-report.json';
    const finalReport = {
      auditSummary: {
        totalIterations: this.currentIteration,
        finalCompliance: this.auditHistory[this.auditHistory.length - 1]?.compliancePercent || 0,
        targetCompliance: this.targetCompliance,
        status: this.auditHistory[this.auditHistory.length - 1]?.status || 'NON_COMPLIANT'
      },
      auditHistory: this.auditHistory
    };

    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

    this.logSuccess(`\n📄 Compliance report generated: ${reportPath}`);

    const finalCompliance = finalReport.auditSummary.finalCompliance;
    if (finalCompliance >= this.targetCompliance) {
      this.logSuccess('🎉 PRODUCTION DEPLOYMENT APPROVED');
    } else {
      this.logError('💀 PRODUCTION DEPLOYMENT BLOCKED');
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

// Execute the verification
const verifier = new ComplianceVerifier();
verifier.runContinuousAudit()
  .then(() => {
    process.stdout.write('\x1b[92m✅ COMPLIANCE VERIFICATION COMPLETED\x1b[0m\n');
    process.exit(0);
  })
  .catch((error) => {
    process.stdout.write(`\x1b[91m💀 VERIFICATION FAILED: ${error.message}\x1b[0m\n`);
    process.exit(1);
  });

export { ComplianceVerifier };