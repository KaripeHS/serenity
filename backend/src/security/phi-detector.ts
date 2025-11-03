/**
 * PHI (Protected Health Information) Detector
 * Detects and classifies potentially sensitive health information in data
 */

export interface PHIDetectionResult {
  hasPHI: boolean;
  confidence: number;
  patterns: string[];
  sensitiveFields: string[];
}

export interface PHIRule {
  name: string;
  pattern: RegExp;
  confidence: number;
  description: string;
}

export class PHIDetector {
  private readonly rules: PHIRule[] = [
    {
      name: 'ssn',
      pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      confidence: 0.9,
      description: 'Social Security Number'
    },
    {
      name: 'medical_record_number',
      pattern: /\b(mrn|medical record|record number)[\s:]*\d+\b/gi,
      confidence: 0.8,
      description: 'Medical Record Number'
    },
    {
      name: 'date_of_birth',
      pattern: /\b(dob|birth date|date of birth)[\s:]*\d{1,2}\/\d{1,2}\/\d{4}\b/gi,
      confidence: 0.7,
      description: 'Date of Birth'
    },
    {
      name: 'health_plan_id',
      pattern: /\b(policy|member|health plan)[\s#:]*\w+\d+\w*\b/gi,
      confidence: 0.6,
      description: 'Health Plan Identifier'
    },
    {
      name: 'diagnosis_code',
      pattern: /\b(icd|diagnosis|dx)[\s-]*\d{1,3}\.?\d*\b/gi,
      confidence: 0.7,
      description: 'Diagnosis Code'
    },
    {
      name: 'medication',
      pattern: /\b(medication|prescription|rx)[\s:]*[a-z]+\b/gi,
      confidence: 0.5,
      description: 'Medication Reference'
    },
    {
      name: 'email',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      confidence: 0.3,
      description: 'Email Address'
    },
    {
      name: 'phone',
      pattern: /\b\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g,
      confidence: 0.4,
      description: 'Phone Number'
    }
  ];

  private readonly sensitiveFieldNames = [
    'ssn', 'social_security_number', 'medicare_number', 'medicaid_number',
    'medical_record_number', 'mrn', 'patient_id', 'diagnosis', 'treatment',
    'medication', 'prescription', 'health_plan', 'insurance', 'dob',
    'date_of_birth', 'birth_date', 'email', 'phone', 'address'
  ];

  /**
   * Detect PHI in a string value
   */
  detectInString(text: string): PHIDetectionResult {
    if (!text || typeof text !== 'string') {
      return {
        hasPHI: false,
        confidence: 0,
        patterns: [],
        sensitiveFields: []
      };
    }

    const detectedPatterns: string[] = [];
    let maxConfidence = 0;

    for (const rule of this.rules) {
      const matches = text.match(rule.pattern);
      if (matches && matches.length > 0) {
        detectedPatterns.push(rule.name);
        maxConfidence = Math.max(maxConfidence, rule.confidence);
      }
    }

    return {
      hasPHI: detectedPatterns.length > 0,
      confidence: maxConfidence,
      patterns: detectedPatterns,
      sensitiveFields: []
    };
  }

  /**
   * Detect PHI in an object
   */
  detectInObject(obj: any): PHIDetectionResult {
    if (!obj || typeof obj !== 'object') {
      return {
        hasPHI: false,
        confidence: 0,
        patterns: [],
        sensitiveFields: []
      };
    }

    const detectedPatterns: string[] = [];
    const sensitiveFields: string[] = [];
    let maxConfidence = 0;

    // Check field names for sensitive patterns
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (this.sensitiveFieldNames.some(field => lowerKey.includes(field))) {
        sensitiveFields.push(key);
        maxConfidence = Math.max(maxConfidence, 0.6);
      }

      // Check field values
      const value = obj[key];
      if (typeof value === 'string') {
        const stringResult = this.detectInString(value);
        if (stringResult.hasPHI) {
          detectedPatterns.push(...stringResult.patterns);
          maxConfidence = Math.max(maxConfidence, stringResult.confidence);
        }
      } else if (typeof value === 'object' && value !== null) {
        const nestedResult = this.detectInObject(value);
        if (nestedResult.hasPHI) {
          detectedPatterns.push(...nestedResult.patterns);
          sensitiveFields.push(...nestedResult.sensitiveFields);
          maxConfidence = Math.max(maxConfidence, nestedResult.confidence);
        }
      }
    }

    return {
      hasPHI: detectedPatterns.length > 0 || sensitiveFields.length > 0,
      confidence: maxConfidence,
      patterns: [...new Set(detectedPatterns)],
      sensitiveFields: [...new Set(sensitiveFields)]
    };
  }

  /**
   * Determine data classification based on PHI detection
   */
  classifyData(data: any): 'public' | 'internal' | 'confidential' | 'phi' {
    const result = this.detectInObject(data);

    if (!result.hasPHI) {
      return 'internal';
    }

    // High confidence PHI patterns indicate PHI classification
    if (result.confidence >= 0.7) {
      return 'phi';
    }

    // Medium confidence indicates confidential
    if (result.confidence >= 0.5) {
      return 'confidential';
    }

    // Low confidence indicates internal
    return 'internal';
  }

  /**
   * Scrub PHI from a string (replace with [REDACTED])
   */
  scrubString(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let scrubbedText = text;

    for (const rule of this.rules) {
      if (rule.confidence >= 0.7) { // Only scrub high-confidence patterns
        scrubbedText = scrubbedText.replace(rule.pattern, `[${rule.description.toUpperCase()}_REDACTED]`);
      }
    }

    return scrubbedText;
  }

  /**
   * Scrub PHI from an object
   */
  scrubObject<T>(obj: T): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const scrubbed = { ...obj } as any;

    for (const key of Object.keys(scrubbed)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive field names
      if (this.sensitiveFieldNames.some(field => lowerKey.includes(field))) {
        scrubbed[key] = '[SENSITIVE_FIELD_REDACTED]';
        continue;
      }

      const value = scrubbed[key];
      if (typeof value === 'string') {
        scrubbed[key] = this.scrubString(value);
      } else if (typeof value === 'object' && value !== null) {
        scrubbed[key] = this.scrubObject(value);
      }
    }

    return scrubbed as T;
  }

  /**
   * Check if a field name is potentially sensitive
   */
  isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFieldNames.some(field => lowerField.includes(field));
  }
}

// Export singleton instance
export const phiDetector = new PHIDetector();

// Export default
export default PHIDetector;