/**
 * Unit Tests for Visit Key Utility
 * Tests deterministic key generation, collision detection, and correction versioning
 */

import {
  generateVisitKey,
  generateVisitKeyFromVisit,
  generateVisitKeyFromEVV,
  parseVisitKey,
  isValidVisitKey,
  hashVisitKey,
  isSameVisit,
  generateCorrectionKey,
  extractOriginalKey,
  generateBatchVisitKeys,
  detectDuplicates,
  isUniqueVisitKey,
  matchesVisitKeyPattern,
} from '../visitKey';
import { createMockVisit } from './__mocks__/sandataResponses';
import type { SandataVisit } from '../types';

describe('VisitKey Utility', () => {
  describe('generateVisitKey', () => {
    it('should generate valid visit key from components', () => {
      const key = generateVisitKey({
        clientId: 'CLIENT123',
        caregiverId: 'CAREGIVER456',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
      });

      expect(key).toBe('CLIENT123_CAREGIVER456_20251103_T1019');
    });

    it('should normalize date from various formats', () => {
      const key1 = generateVisitKey({
        clientId: 'CLIENT123',
        caregiverId: 'CAREGIVER456',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
      });

      const key2 = generateVisitKey({
        clientId: 'CLIENT123',
        caregiverId: 'CAREGIVER456',
        serviceDate: '2025/11/03',
        serviceCode: 'T1019',
      });

      expect(key1).toBe(key2);
    });

    it('should sanitize IDs to uppercase alphanumeric', () => {
      const key = generateVisitKey({
        clientId: 'client-123',
        caregiverId: 'caregiver@456',
        serviceDate: '2025-11-03',
        serviceCode: 't1019',
      });

      expect(key).toBe('CLIENT-123_CAREGIVER456_20251103_T1019');
    });

    it('should throw error for missing components', () => {
      expect(() =>
        generateVisitKey({
          clientId: '',
          caregiverId: 'CAREGIVER456',
          serviceDate: '2025-11-03',
          serviceCode: 'T1019',
        })
      ).toThrow('All visit key components are required');
    });

    it('should throw error for invalid date', () => {
      expect(() =>
        generateVisitKey({
          clientId: 'CLIENT123',
          caregiverId: 'CAREGIVER456',
          serviceDate: 'invalid-date',
          serviceCode: 'T1019',
        })
      ).toThrow('Invalid date');
    });

    it('should handle Date objects', () => {
      const key = generateVisitKey({
        clientId: 'CLIENT123',
        caregiverId: 'CAREGIVER456',
        serviceDate: new Date('2025-11-03T00:00:00Z') as any,
        serviceCode: 'T1019',
      });

      expect(key).toContain('20251103');
    });
  });

  describe('generateVisitKeyFromVisit', () => {
    it('should generate key from SandataVisit object', () => {
      const visit = createMockVisit({
        individualId: 'IND123',
        employeeId: 'EMP456',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
      });

      const key = generateVisitKeyFromVisit(visit);

      expect(key).toBe('IND123_EMP456_20251103_T1019');
    });
  });

  describe('parseVisitKey', () => {
    it('should parse valid visit key into components', () => {
      const key = 'CLIENT123_CAREGIVER456_20251103_T1019';
      const components = parseVisitKey(key);

      expect(components).toEqual({
        clientId: 'CLIENT123',
        caregiverId: 'CAREGIVER456',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
      });
    });

    it('should throw error for invalid format', () => {
      expect(() => parseVisitKey('INVALID_KEY')).toThrow('Invalid visit key format');
    });

    it('should throw error for invalid date in key', () => {
      expect(() => parseVisitKey('CLIENT123_CAREGIVER456_20251399_T1019')).toThrow(
        'Invalid date format in visit key'
      );
    });
  });

  describe('isValidVisitKey', () => {
    it('should return true for valid visit key', () => {
      expect(isValidVisitKey('CLIENT123_CAREGIVER456_20251103_T1019')).toBe(true);
    });

    it('should return false for invalid visit key', () => {
      expect(isValidVisitKey('INVALID')).toBe(false);
      expect(isValidVisitKey('TOO_FEW_PARTS')).toBe(false);
      expect(isValidVisitKey('CLIENT123_CAREGIVER456_INVALID_T1019')).toBe(false);
    });
  });

  describe('matchesVisitKeyPattern', () => {
    it('should match valid pattern', () => {
      expect(matchesVisitKeyPattern('CLIENT123_CAREGIVER456_20251103_T1019')).toBe(true);
      expect(matchesVisitKeyPattern('ABC-DEF_GHI-JKL_20251103_T1020')).toBe(true);
    });

    it('should not match invalid patterns', () => {
      expect(matchesVisitKeyPattern('lowercase_ids_20251103_t1019')).toBe(false);
      expect(matchesVisitKeyPattern('CLIENT123_CAREGIVER456_2025-11-03_T1019')).toBe(false);
    });
  });

  describe('hashVisitKey', () => {
    it('should generate consistent SHA-256 hash', () => {
      const key = 'CLIENT123_CAREGIVER456_20251103_T1019';
      const hash1 = hashVisitKey(key);
      const hash2 = hashVisitKey(key);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64-char hex string
    });

    it('should generate different hashes for different keys', () => {
      const hash1 = hashVisitKey('CLIENT123_CAREGIVER456_20251103_T1019');
      const hash2 = hashVisitKey('CLIENT123_CAREGIVER456_20251103_T1020');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isSameVisit', () => {
    it('should return true for visits with same key components', () => {
      const visit1 = createMockVisit({
        individualId: 'IND123',
        employeeId: 'EMP456',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
        clockInTime: '2025-11-03T09:00:00Z',
      });

      const visit2 = createMockVisit({
        individualId: 'IND123',
        employeeId: 'EMP456',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
        clockInTime: '2025-11-03T10:00:00Z', // Different time, but same key
      });

      expect(isSameVisit(visit1, visit2)).toBe(true);
    });

    it('should return false for visits with different key components', () => {
      const visit1 = createMockVisit({
        individualId: 'IND123',
        employeeId: 'EMP456',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
      });

      const visit2 = createMockVisit({
        individualId: 'IND123',
        employeeId: 'EMP456',
        serviceDate: '2025-11-04', // Different date
        serviceCode: 'T1019',
      });

      expect(isSameVisit(visit1, visit2)).toBe(false);
    });
  });

  describe('generateCorrectionKey', () => {
    it('should generate versioned correction key', () => {
      const originalKey = 'CLIENT123_CAREGIVER456_20251103_T1019';
      const correctionKey = generateCorrectionKey(originalKey, 1);

      expect(correctionKey).toBe('CLIENT123_CAREGIVER456_20251103_T1019_v1');
    });

    it('should handle multiple versions', () => {
      const originalKey = 'CLIENT123_CAREGIVER456_20251103_T1019';

      expect(generateCorrectionKey(originalKey, 1)).toBe('CLIENT123_CAREGIVER456_20251103_T1019_v1');
      expect(generateCorrectionKey(originalKey, 2)).toBe('CLIENT123_CAREGIVER456_20251103_T1019_v2');
      expect(generateCorrectionKey(originalKey, 10)).toBe('CLIENT123_CAREGIVER456_20251103_T1019_v10');
    });

    it('should throw error for invalid version', () => {
      const originalKey = 'CLIENT123_CAREGIVER456_20251103_T1019';

      expect(() => generateCorrectionKey(originalKey, 0)).toThrow('Correction version must be >= 1');
      expect(() => generateCorrectionKey(originalKey, -1)).toThrow('Correction version must be >= 1');
    });

    it('should throw error for invalid original key', () => {
      expect(() => generateCorrectionKey('INVALID_KEY', 1)).toThrow('Invalid original visit key');
    });
  });

  describe('extractOriginalKey', () => {
    it('should extract original key from correction key', () => {
      const correctionKey = 'CLIENT123_CAREGIVER456_20251103_T1019_v1';
      const originalKey = extractOriginalKey(correctionKey);

      expect(originalKey).toBe('CLIENT123_CAREGIVER456_20251103_T1019');
    });

    it('should return same key if no version suffix', () => {
      const key = 'CLIENT123_CAREGIVER456_20251103_T1019';
      const result = extractOriginalKey(key);

      expect(result).toBe(key);
    });

    it('should handle multiple-digit versions', () => {
      const correctionKey = 'CLIENT123_CAREGIVER456_20251103_T1019_v99';
      const originalKey = extractOriginalKey(correctionKey);

      expect(originalKey).toBe('CLIENT123_CAREGIVER456_20251103_T1019');
    });
  });

  describe('generateBatchVisitKeys', () => {
    it('should generate keys for multiple visits', () => {
      const visits: SandataVisit[] = [
        createMockVisit({ individualId: 'IND1', employeeId: 'EMP1', serviceDate: '2025-11-03' }),
        createMockVisit({ individualId: 'IND2', employeeId: 'EMP2', serviceDate: '2025-11-03' }),
        createMockVisit({ individualId: 'IND3', employeeId: 'EMP3', serviceDate: '2025-11-03' }),
      ];

      const keyMap = generateBatchVisitKeys(visits);

      expect(keyMap.size).toBe(3);
      expect(keyMap.get(visits[0])).toContain('IND1_EMP1');
      expect(keyMap.get(visits[1])).toContain('IND2_EMP2');
      expect(keyMap.get(visits[2])).toContain('IND3_EMP3');
    });

    it('should handle empty array', () => {
      const keyMap = generateBatchVisitKeys([]);
      expect(keyMap.size).toBe(0);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect duplicate visits with same key', () => {
      const visits: SandataVisit[] = [
        createMockVisit({
          individualId: 'IND123',
          employeeId: 'EMP456',
          serviceDate: '2025-11-03',
          serviceCode: 'T1019',
          clockInTime: '2025-11-03T09:00:00Z',
        }),
        createMockVisit({
          individualId: 'IND123',
          employeeId: 'EMP456',
          serviceDate: '2025-11-03',
          serviceCode: 'T1019',
          clockInTime: '2025-11-03T10:00:00Z', // Different time, same key
        }),
      ];

      const duplicates = detectDuplicates(visits);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].duplicates).toHaveLength(2);
      expect(duplicates[0].visitKey).toContain('IND123_EMP456_20251103_T1019');
    });

    it('should return empty array for no duplicates', () => {
      const visits: SandataVisit[] = [
        createMockVisit({ individualId: 'IND1', employeeId: 'EMP1', serviceDate: '2025-11-03' }),
        createMockVisit({ individualId: 'IND2', employeeId: 'EMP2', serviceDate: '2025-11-03' }),
      ];

      const duplicates = detectDuplicates(visits);

      expect(duplicates).toHaveLength(0);
    });

    it('should detect multiple duplicate groups', () => {
      const visits: SandataVisit[] = [
        // Group 1 duplicates
        createMockVisit({ individualId: 'IND1', employeeId: 'EMP1', serviceDate: '2025-11-03' }),
        createMockVisit({ individualId: 'IND1', employeeId: 'EMP1', serviceDate: '2025-11-03' }),
        // Group 2 duplicates
        createMockVisit({ individualId: 'IND2', employeeId: 'EMP2', serviceDate: '2025-11-03' }),
        createMockVisit({ individualId: 'IND2', employeeId: 'EMP2', serviceDate: '2025-11-03' }),
        // Unique visit
        createMockVisit({ individualId: 'IND3', employeeId: 'EMP3', serviceDate: '2025-11-03' }),
      ];

      const duplicates = detectDuplicates(visits);

      expect(duplicates).toHaveLength(2);
      expect(duplicates[0].duplicates).toHaveLength(2);
      expect(duplicates[1].duplicates).toHaveLength(2);
    });
  });

  describe('isUniqueVisitKey', () => {
    it('should return true for unique key', () => {
      const existingKeys = new Set(['KEY1', 'KEY2', 'KEY3']);
      expect(isUniqueVisitKey('KEY4', existingKeys)).toBe(true);
    });

    it('should return false for duplicate key', () => {
      const existingKeys = new Set(['KEY1', 'KEY2', 'KEY3']);
      expect(isUniqueVisitKey('KEY2', existingKeys)).toBe(false);
    });

    it('should handle empty set', () => {
      const existingKeys = new Set<string>();
      expect(isUniqueVisitKey('KEY1', existingKeys)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long IDs within limit', () => {
      const longId = 'A'.repeat(50);
      const key = generateVisitKey({
        clientId: longId,
        caregiverId: longId,
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
      });

      expect(key.length).toBeLessThanOrEqual(255);
    });

    it('should throw error if key exceeds 255 chars', () => {
      const veryLongId = 'A'.repeat(200);

      expect(() =>
        generateVisitKey({
          clientId: veryLongId,
          caregiverId: veryLongId,
          serviceDate: '2025-11-03',
          serviceCode: 'T1019',
        })
      ).toThrow('Visit key exceeds 255 character limit');
    });

    it('should handle UUIDs as IDs', () => {
      const key = generateVisitKey({
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        caregiverId: '660e8400-e29b-41d4-a716-446655440001',
        serviceDate: '2025-11-03',
        serviceCode: 'T1019',
      });

      expect(isValidVisitKey(key)).toBe(true);
    });

    it('should handle leap year dates', () => {
      const key = generateVisitKey({
        clientId: 'CLIENT123',
        caregiverId: 'CAREGIVER456',
        serviceDate: '2024-02-29', // Leap year
        serviceCode: 'T1019',
      });

      expect(key).toContain('20240229');
    });
  });
});
