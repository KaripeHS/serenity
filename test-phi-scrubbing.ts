#!/usr/bin/env node
/**
 * PHI SCRUBBING VERIFICATION TEST
 * CRITICAL: Proves the logger actually scrubs PHI as claimed
 */

import { logger } from './frontend/src/shared/services/logger.service.js';
import * as fs from 'fs';
import * as path from 'path';

interface PHITestCase {
  input: string;
  mustNotContain: string[];
  description: string;
}

const PHI_TEST_CASES: PHITestCase[] = [
  {
    input: "Patient SSN is 123-45-6789",
    mustNotContain: ["123-45-6789"],
    description: "SSN scrubbing"
  },
  {
    input: "DOB: 01/15/1980 for John Smith",
    mustNotContain: ["01/15/1980", "John Smith"],
    description: "DOB and name scrubbing"
  },
  {
    input: "Email patient@example.com and phone 555-123-4567",
    mustNotContain: ["patient@example.com", "555-123-4567"],
    description: "Email and phone scrubbing"
  },
  {
    input: "Medicaid ID: M123456789",
    mustNotContain: ["M123456789"],
    description: "Medicaid ID scrubbing"
  },
  {
    input: "Patient lives at 123 Main St, Columbus, OH 43215",
    mustNotContain: ["123 Main St", "43215"],
    description: "Address scrubbing"
  },
  {
    input: "Credit card 4532-1234-5678-9012 expires 12/25",
    mustNotContain: ["4532-1234-5678-9012", "12/25"],
    description: "Credit card scrubbing"
  },
  {
    input: "License number OH1234567 for Jane Doe",
    mustNotContain: ["OH1234567", "Jane Doe"],
    description: "License and name scrubbing"
  }
];

async function testPHIScrubbing(): Promise<void> {
  process.stdout.write('🔍 TESTING PHI SCRUBBING...\n\n');

  // Create logs directory
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Clear log file
  const logFile = path.join(logsDir, 'combined.log');
  fs.writeFileSync(logFile, '');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < PHI_TEST_CASES.length; i++) {
    const testCase = PHI_TEST_CASES[i];

    // Log the PHI using our logger
    logger.info(testCase.input);

    // Small delay to ensure logging completes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Read the log file to check for leaks
    let logContent = '';
    try {
      if (fs.existsSync(logFile)) {
        logContent = fs.readFileSync(logFile, 'utf-8');
      }
    } catch (error) {
      // Log file might not exist yet
    }

    // Also check localStorage for audit logs
    const auditLogs = logger.getAuditLogs();
    const auditContent = JSON.stringify(auditLogs);

    // Check for leaks in both log file and audit logs
    const allContent = logContent + auditContent;

    const leaks = testCase.mustNotContain.filter(phi =>
      allContent.includes(phi)
    );

    if (leaks.length > 0) {
      process.stdout.write(`❌ Test ${i + 1} FAILED: ${testCase.description}\n`);
      process.stdout.write(`   PHI LEAKED: ${leaks.join(', ')}\n`);
      failures.push(`${testCase.description}: ${leaks.join(', ')}`);
      failed++;
    } else {
      process.stdout.write(`✅ Test ${i + 1} PASSED: ${testCase.description}\n`);
      passed++;
    }
  }

  process.stdout.write(`\nRESULTS: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.stdout.write('❌ PHI SCRUBBING FAILED - CRITICAL VIOLATIONS:\n');
    failures.forEach(failure => {
      process.stdout.write(`  • ${failure}\n`);
    });
    process.stdout.write('\n💀 DO NOT DEPLOY - PHI LEAKS DETECTED\n');
    process.exit(1);
  } else {
    process.stdout.write('✅ ALL PHI SCRUBBING TESTS PASSED\n');
    process.stdout.write('🔒 HIPAA COMPLIANCE VERIFIED\n');
  }

  // Additional verification - check audit logs for proper classification
  const auditLogs = logger.getAuditLogs();
  const phiScrubbed = auditLogs.filter(log => log.audit.scrubbed);

  process.stdout.write(`\nAUDIT VERIFICATION:\n`);
  process.stdout.write(`Total log entries: ${auditLogs.length}\n`);
  process.stdout.write(`PHI scrubbed entries: ${phiScrubbed.length}\n`);

  if (phiScrubbed.length === PHI_TEST_CASES.length) {
    process.stdout.write('✅ All PHI entries properly flagged as scrubbed\n');
  } else {
    process.stdout.write('❌ PHI scrubbing detection failed\n');
    process.exit(1);
  }
}

// Run the test
testPHIScrubbing()
  .then(() => {
    process.stdout.write('\n🎉 PHI SCRUBBING VERIFICATION COMPLETED SUCCESSFULLY\n');
    process.exit(0);
  })
  .catch((error) => {
    process.stdout.write(`\n💀 PHI SCRUBBING TEST FAILED: ${error.message}\n`);
    process.exit(1);
  });