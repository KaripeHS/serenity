/**
 * App Constants and Configuration
 */

// API Configuration
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.serenitycarepartners.com/api';

// GPS Configuration
export const GPS_CONFIG = {
  GEOFENCE_RADIUS_METERS: 200, // 200 meters = ~656 feet
  HIGH_ACCURACY: true,
  TIMEOUT_MS: 10000, // 10 seconds
  MAX_AGE_MS: 5000, // 5 seconds
  DISTANCE_FILTER_METERS: 10, // Update location every 10 meters
};

// Offline Sync Configuration
export const SYNC_CONFIG = {
  RETRY_INTERVAL_MS: 30000, // Retry sync every 30 seconds
  MAX_RETRIES: 10,
  BATCH_SIZE: 10, // Sync 10 visits at a time
};

// UI Constants
export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#6b7280',
  lightGray: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
  black: '#000000',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

// Feature Flags
export const FEATURES = {
  OFFLINE_MODE: true,
  PHOTO_CAPTURE: true,
  PUSH_NOTIFICATIONS: false, // TODO: Enable after setup
  BIOMETRIC_AUTH: false, // TODO: Enable after setup
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  USER_PROFILE: 'user_profile',
  PENDING_VISITS: 'pending_visits',
  APP_SETTINGS: 'app_settings',
  LAST_SYNC: 'last_sync',
};

// EVV Requirements
export const EVV_REQUIREMENTS = {
  REQUIRED_FIELDS: [
    'patientId',
    'caregiverId',
    'clockInTime',
    'clockInLatitude',
    'clockInLongitude',
    'serviceType',
  ],
  PHOTO_REQUIRED: false, // Optional by default
  SIGNATURE_REQUIRED: false, // Future feature
};
