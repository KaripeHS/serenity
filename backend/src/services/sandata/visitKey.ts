/**
 * Visit Key Generator
 * Creates deterministic, immutable identifiers for Sandata EVV visits
 *
 * Purpose:
 * - Prevent duplicate visit submissions to Sandata
 * - Enable idempotent retries (same visit = same key)
 * - Provide stable reference across systems
 *
 * Format: {clientId}_{caregiverId}_{YYYYMMDD}_{serviceCode}
 * Example: SND123456_EMP789012_20251103_T1019
 *
 * Immutability Guarantee:
 * - Once generated, visit_key NEVER changes
 * - Even if clock times or location are corrected
 * - Corrections use same key but increment version
 *
 * @module services/sandata/visitKey
 */

import crypto from 'crypto';
import type { VisitKeyComponents, SandataVisit } from './types';

/**
 * Generate deterministic visit key
 *
 * @param components - Visit key components (client, caregiver, date, service)
 * @returns Visit key string
 */
export function generateVisitKey(components: VisitKeyComponents): string {
  const { clientId, caregiverId, serviceDate, serviceCode } = components;

  // Validate inputs
  if (!clientId || !caregiverId || !serviceDate || !serviceCode) {
    throw new Error('All visit key components are required: clientId, caregiverId, serviceDate, serviceCode');
  }

  // Normalize service date to YYYYMMDD format
  const normalizedDate = normalizeDate(serviceDate);

  // Sanitize IDs (remove special characters, uppercase)
  const sanitizedClientId = sanitizeId(clientId);
  const sanitizedCaregiverId = sanitizeId(caregiverId);
  const sanitizedServiceCode = sanitizeServiceCode(serviceCode);

  // Generate key: {clientId}_{caregiverId}_{YYYYMMDD}_{serviceCode}
  const visitKey = `${sanitizedClientId}_${sanitizedCaregiverId}_${normalizedDate}_${sanitizedServiceCode}`;

  // Validate key length (Sandata limit: 255 chars)
  if (visitKey.length > 255) {
    throw new Error(`Visit key exceeds 255 character limit: ${visitKey.length} chars`);
  }

  return visitKey;
}

/**
 * Generate visit key from Sandata visit object
 *
 * @param visit - Sandata visit object
 * @returns Visit key string
 */
export function generateVisitKeyFromVisit(visit: SandataVisit): string {
  return generateVisitKey({
    clientId: visit.individualId,
    caregiverId: visit.employeeId,
    serviceDate: visit.serviceDate,
    serviceCode: visit.serviceCode,
  });
}

/**
 * Generate visit key from EVV record data
 * (For when we haven't synced Sandata IDs yet)
 *
 * @param evvData - EVV record data with our UUIDs
 * @returns Visit key string
 */
export function generateVisitKeyFromEVV(evvData: {
  clientId: string; // Our UUID or Sandata ID
  caregiverId: string; // Our UUID or Sandata ID
  serviceDate: string;
  serviceCode: string;
}): string {
  return generateVisitKey(evvData);
}

/**
 * Parse visit key back into components
 *
 * @param visitKey - Visit key string
 * @returns Visit key components
 */
export function parseVisitKey(visitKey: string): VisitKeyComponents {
  const parts = visitKey.split('_');

  if (parts.length !== 4) {
    throw new Error(`Invalid visit key format. Expected 4 parts separated by '_', got ${parts.length}: ${visitKey}`);
  }

  const [clientId, caregiverId, dateStr, serviceCode] = parts;

  // Validate date format (YYYYMMDD)
  if (!/^\d{8}$/.test(dateStr)) {
    throw new Error(`Invalid date format in visit key. Expected YYYYMMDD, got: ${dateStr}`);
  }

  // Validate that the date is actually valid (e.g., not month 13 or day 99)
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date format in visit key. Invalid month/day: ${dateStr}`);
  }

  // Additional validation: check if the date is actually valid
  const testDate = new Date(Date.UTC(year, month - 1, day));
  if (testDate.getUTCFullYear() !== year || testDate.getUTCMonth() !== month - 1 || testDate.getUTCDate() !== day) {
    throw new Error(`Invalid date format in visit key. Date does not exist: ${dateStr}`);
  }

  return {
    clientId,
    caregiverId,
    serviceDate: formatDateFromYYYYMMDD(dateStr),
    serviceCode,
  };
}

/**
 * Validate visit key format
 *
 * @param visitKey - Visit key to validate
 * @returns True if valid, false otherwise
 */
export function isValidVisitKey(visitKey: string): boolean {
  try {
    parseVisitKey(visitKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate hash of visit key (for collision detection)
 *
 * @param visitKey - Visit key string
 * @returns SHA-256 hash
 */
export function hashVisitKey(visitKey: string): string {
  return crypto.createHash('sha256').update(visitKey).digest('hex');
}

/**
 * Check if two visits would generate the same key (duplicate detection)
 *
 * @param visit1 - First visit
 * @param visit2 - Second visit
 * @returns True if same key, false otherwise
 */
export function isSameVisit(visit1: SandataVisit, visit2: SandataVisit): boolean {
  try {
    const key1 = generateVisitKeyFromVisit(visit1);
    const key2 = generateVisitKeyFromVisit(visit2);
    return key1 === key2;
  } catch (error) {
    return false;
  }
}

/**
 * Generate versioned visit key for corrections
 * Format: {originalKey}_v{version}
 *
 * @param originalVisitKey - Original visit key
 * @param version - Correction version (1, 2, 3, etc.)
 * @returns Versioned visit key
 */
export function generateCorrectionKey(originalVisitKey: string, version: number): string {
  if (version < 1) {
    throw new Error('Correction version must be >= 1');
  }

  if (!isValidVisitKey(originalVisitKey)) {
    throw new Error(`Invalid original visit key: ${originalVisitKey}`);
  }

  return `${originalVisitKey}_v${version}`;
}

/**
 * Extract original visit key from correction key
 *
 * @param correctionKey - Versioned correction key
 * @returns Original visit key
 */
export function extractOriginalKey(correctionKey: string): string {
  const versionMatch = correctionKey.match(/^(.+)_v\d+$/);
  if (versionMatch) {
    return versionMatch[1];
  }
  return correctionKey; // No version suffix, return as-is
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize date to YYYYMMDD format
 * Accepts: YYYY-MM-DD, YYYY/MM/DD, Date object, ISO 8601 string
 */
function normalizeDate(date: string | Date): string {
  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    // Remove time component if present
    let dateOnly = date.split('T')[0];
    // Normalize slash format to dash format (2025/11/03 -> 2025-11-03)
    dateOnly = dateOnly.replace(/\//g, '-');
    dateObj = new Date(dateOnly + 'T00:00:00Z'); // Parse as UTC to avoid timezone issues
  } else {
    throw new Error(`Invalid date type: ${typeof date}`);
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * Format YYYYMMDD back to YYYY-MM-DD
 */
function formatDateFromYYYYMMDD(dateStr: string): string {
  if (!/^\d{8}$/.test(dateStr)) {
    throw new Error(`Invalid YYYYMMDD format: ${dateStr}`);
  }

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Sanitize ID (remove special chars, uppercase for consistency)
 */
function sanitizeId(id: string): string {
  // Remove any characters that aren't alphanumeric or hyphen
  const sanitized = id.replace(/[^a-zA-Z0-9-]/g, '');

  if (sanitized.length === 0) {
    throw new Error(`Invalid ID - no valid characters remaining after sanitization: ${id}`);
  }

  return sanitized.toUpperCase();
}

/**
 * Sanitize service code (HCPCS codes are uppercase alphanumeric)
 */
function sanitizeServiceCode(code: string): string {
  const sanitized = code.replace(/[^a-zA-Z0-9]/g, '');

  if (sanitized.length === 0) {
    throw new Error(`Invalid service code: ${code}`);
  }

  return sanitized.toUpperCase();
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Generate visit keys for multiple visits (batch)
 *
 * @param visits - Array of visits
 * @returns Map of visit to visit key
 */
export function generateBatchVisitKeys(visits: SandataVisit[]): Map<SandataVisit, string> {
  const keyMap = new Map<SandataVisit, string>();

  for (const visit of visits) {
    try {
      const key = generateVisitKeyFromVisit(visit);
      keyMap.set(visit, key);
    } catch (error) {
      // Log error but continue processing other visits
      // Error will be logged by generateVisitKeyFromVisit
    }
  }

  return keyMap;
}

/**
 * Detect duplicate visits in a batch
 *
 * @param visits - Array of visits
 * @returns Array of duplicate groups
 */
export function detectDuplicates(visits: SandataVisit[]): Array<{
  visitKey: string;
  duplicates: SandataVisit[];
}> {
  const keyGroups = new Map<string, SandataVisit[]>();

  // Group visits by key
  for (const visit of visits) {
    try {
      const key = generateVisitKeyFromVisit(visit);
      const group = keyGroups.get(key) || [];
      group.push(visit);
      keyGroups.set(key, group);
    } catch (error) {
      // Skip visits that can't generate keys
      continue;
    }
  }

  // Find duplicates (groups with > 1 visit)
  const duplicates: Array<{ visitKey: string; duplicates: SandataVisit[] }> = [];

  for (const [visitKey, group] of keyGroups.entries()) {
    if (group.length > 1) {
      duplicates.push({ visitKey, duplicates: group });
    }
  }

  return duplicates;
}

/**
 * Validate visit key uniqueness across database
 * (To be used with database query)
 *
 * @param visitKey - Visit key to check
 * @param existingKeys - Set of existing visit keys from database
 * @returns True if unique, false if duplicate
 */
export function isUniqueVisitKey(visitKey: string, existingKeys: Set<string>): boolean {
  return !existingKeys.has(visitKey);
}

// ============================================================================
// Constants
// ============================================================================

export const VISIT_KEY_SEPARATOR = '_';
export const VISIT_KEY_MAX_LENGTH = 255;
export const VISIT_KEY_PATTERN = /^[A-Z0-9-]+_[A-Z0-9-]+_\d{8}_[A-Z0-9]+$/;

/**
 * Validate visit key against pattern
 */
export function matchesVisitKeyPattern(visitKey: string): boolean {
  return VISIT_KEY_PATTERN.test(visitKey);
}

// ============================================================================
// Exports
// ============================================================================

export default {
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
};
