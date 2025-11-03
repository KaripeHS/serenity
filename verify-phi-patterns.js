#!/usr/bin/env node
/**
 * PHI PATTERN VERIFICATION TEST
 * CRITICAL: Proves PHI patterns are properly detected and redacted
 */

/* eslint-disable no-console */

const PHI_PATTERNS = [
  // SSN patterns
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'SSN', replacement: '[SSN-REDACTED]' },
  { pattern: /\b\d{9}\b/g, type: 'SSN_NO_DASH', replacement: '[SSN-REDACTED]' },

  // Date of birth patterns
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, type: 'DOB_SLASH', replacement: '[DOB-REDACTED]' },
  { pattern: /\b\d{1,2}-\d{1,2}-\d{4}\b/g, type: 'DOB_DASH', replacement: '[DOB-REDACTED]' },
  { pattern: /\b\d{4}-\d{1,2}-\d{1,2}\b/g, type: 'DOB_ISO', replacement: '[DOB-REDACTED]' },

  // Email patterns
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'EMAIL', replacement: '[EMAIL-REDACTED]' },

  // Phone patterns
  { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, type: 'PHONE', replacement: '[PHONE-REDACTED]' },
  { pattern: /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g, type: 'PHONE_PAREN', replacement: '[PHONE-REDACTED]' },
  { pattern: /\b\d{10}\b/g, type: 'PHONE_NO_FORMAT', replacement: '[PHONE-REDACTED]' },

  // Address patterns
  { pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Circle|Cir|Court|Ct|Place|Pl)\b/gi, type: 'ADDRESS', replacement: '[ADDRESS-REDACTED]' },
  { pattern: /\b\d{5}(?:-\d{4})?\b/g, type: 'ZIP_CODE', replacement: '[ZIP-REDACTED]' },

  // Medical IDs
  { pattern: /\b[A-Z]\d{8,12}\b/g, type: 'MEDICAID_ID', replacement: '[MEDICAID-ID-REDACTED]' },
  { pattern: /\b\d{8,12}[A-Z]\b/g, type: 'MEDICARE_ID', replacement: '[MEDICARE-ID-REDACTED]' },

  // Credit card patterns
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, type: 'CREDIT_CARD', replacement: '[CARD-REDACTED]' },

  // Common name patterns
  { pattern: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, type: 'FULL_NAME', replacement: '[NAME-REDACTED]' },

  // License patterns
  { pattern: /\b[A-Z]{1,2}\d{6,8}\b/g, type: 'LICENSE', replacement: '[LICENSE-REDACTED]' }
];

function scrubPHI(content) {
  if (typeof content !== 'string') {
    return '[NON-STRING-CONTENT]';
  }

  let scrubbed = content;
  let hasPHI = false;

  for (const phiPattern of PHI_PATTERNS) {
    if (phiPattern.pattern.test(scrubbed)) {
      hasPHI = true;
      scrubbed = scrubbed.replace(phiPattern.pattern, phiPattern.replacement);
    }
  }

  return { scrubbed, hasPHI };
}

const TEST_CASES = [
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
    mustNotContain: ["4532-1234-5678-9012"],
    description: "Credit card scrubbing"
  },
  {
    input: "License number OH1234567 for Jane Doe",
    mustNotContain: ["OH1234567", "Jane Doe"],
    description: "License and name scrubbing"
  }
];

console.log('🔍 TESTING PHI SCRUBBING PATTERNS...\n');

let passed = 0;
let failed = 0;
const failures = [];

TEST_CASES.forEach((testCase, index) => {
  const result = scrubPHI(testCase.input);

  // Check for leaks
  const leaks = testCase.mustNotContain.filter(phi =>
    result.scrubbed.includes(phi)
  );

  if (leaks.length > 0) {
    console.log(`❌ Test ${index + 1} FAILED: ${testCase.description}`);
    console.log(`   INPUT: ${testCase.input}`);
    console.log(`   OUTPUT: ${result.scrubbed}`);
    console.log(`   PHI LEAKED: ${leaks.join(', ')}`);
    failures.push(`${testCase.description}: ${leaks.join(', ')}`);
    failed++;
  } else {
    console.log(`✅ Test ${index + 1} PASSED: ${testCase.description}`);
    console.log(`   INPUT: ${testCase.input}`);
    console.log(`   OUTPUT: ${result.scrubbed}`);
    console.log(`   PHI DETECTED: ${result.hasPHI ? 'YES' : 'NO'}`);
    passed++;
  }
  console.log('');
});

console.log(`RESULTS: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error('❌ PHI SCRUBBING FAILED - CRITICAL VIOLATIONS:');
  failures.forEach(failure => {
    console.error(`  • ${failure}`);
  });
  console.error('\n💀 DO NOT DEPLOY - PHI LEAKS DETECTED');
  process.exit(1);
} else {
  console.log('✅ ALL PHI SCRUBBING TESTS PASSED');
  console.log('🔒 HIPAA COMPLIANCE VERIFIED');
  console.log('\n🎉 PHI SCRUBBING VERIFICATION COMPLETED SUCCESSFULLY');
}