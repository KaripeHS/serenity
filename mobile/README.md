# Serenity EVV Mobile App

React Native mobile application for Electronic Visit Verification (EVV) with GPS geofencing, offline mode, and real-time sync.

## Features

✅ **Core EVV Functionality**
- Clock in/out with GPS verification
- Geofencing (200-meter radius validation)
- High-accuracy GPS capture (5-50 meters)
- Offline mode with local storage
- Automatic sync when online

✅ **Security & Compliance**
- Secure token storage (encrypted)
- HIPAA-compliant data handling
- Role-based access control
- OAuth 2.0 authentication

✅ **User Experience**
- Real-time shift list
- Location permission handling
- Network status monitoring
- Pull-to-refresh
- Error handling with user-friendly messages

## Tech Stack

- **Framework:** React Native 0.73 + Expo 50
- **Language:** TypeScript
- **Navigation:** React Navigation 6
- **HTTP Client:** Axios
- **Location:** expo-location
- **Storage:** expo-secure-store + async-storage
- **Date Handling:** date-fns

## Prerequisites

- Node.js 18+ and npm/yarn
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio + JDK 11+ (for Android development)
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`

## Installation

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start
```

## Development

### Run on iOS Simulator
```bash
npm run ios
```

### Run on Android Emulator
```bash
npm run android
```

### Run on Physical Device
1. Install "Expo Go" app from App Store/Play Store
2. Scan QR code from `npm start`

## Building for Production

### iOS Build
```bash
# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android Build
```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## Configuration

### Environment Variables
Create `.env` file:
```
API_BASE_URL=https://api.serenitycarepartners.com/api
```

### GPS Configuration
Edit `src/utils/constants.ts`:
```typescript
export const GPS_CONFIG = {
  GEOFENCE_RADIUS_METERS: 200, // Adjust geofence radius
  HIGH_ACCURACY: true,
  TIMEOUT_MS: 10000,
};
```

## Testing

### Test User
- **Email:** caregiver@example.com
- **Password:** (set in backend)

### Test GPS Spoofing
iOS Simulator: Features → Location → Custom Location
Android Emulator: Extended Controls → Location

### Test Offline Mode
1. Enable Airplane Mode
2. Clock in (saves locally)
3. Disable Airplane Mode
4. Visit syncs automatically

## Architecture

```
mobile/
├── App.tsx                 # Main entry point with navigation
├── src/
│   ├── screens/           # UI screens
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── ClockInScreen.tsx
│   ├── services/          # Business logic
│   │   ├── api.service.ts         # Backend API
│   │   ├── location.service.ts    # GPS handling
│   │   └── storage.service.ts     # Local persistence
│   ├── types/             # TypeScript types
│   └── utils/             # Constants & helpers
└── app.json              # Expo configuration
```

## Key Services

### API Service (`api.service.ts`)
- RESTful API client with Axios
- Token refresh interceptor
- Network status monitoring
- Offline queue management

### Location Service (`location.service.ts`)
- GPS permission handling
- High-accuracy location capture
- Geofence validation (Haversine formula)
- Distance calculation
- Reverse geocoding

### Storage Service (`storage.service.ts`)
- Secure token storage (expo-secure-store)
- Offline visit queue
- User profile caching
- Last sync tracking

## EVV Compliance

### Federal EVV Requirements (All 6 Elements)
1. ✅ Type of service
2. ✅ Individual receiving service (patientId)
3. ✅ Individual providing service (caregiverId)
4. ✅ Date of service
5. ✅ Location (GPS lat/lon with geofencing)
6. ✅ Time clock in/out

### Ohio Medicaid Sandata Integration
- Visits automatically submit to Sandata aggregator
- Offline visits sync when connection restored
- Geofence violations flagged for review

## Deployment Timeline

### Week 1: MVP Testing (Nov 11-15)
- Deploy TestFlight (iOS) beta
- Deploy Google Play internal testing
- Test with 2-3 caregivers
- Gather feedback

### Week 2: Production Release (Nov 18-22)
- Fix critical bugs from testing
- Submit to App Store (2-3 day review)
- Submit to Play Store (1-2 day review)
- Train all caregivers
- Go live for first patient

## Troubleshooting

### GPS Not Working
- Check location permissions in device settings
- Ensure location services enabled
- Try outdoor location (better GPS signal)
- Check GPS accuracy < 50 meters

### Offline Sync Not Working
- Check network connection
- Check pending visit count on home screen
- Force sync: Pull to refresh
- Check backend API logs

### Login Failed
- Verify backend API is running
- Check API_BASE_URL in constants
- Verify user credentials
- Check network connectivity

## Support

- **Technical Issues:** dev@serenitycarepartners.com
- **User Support:** hr@serenitycarepartners.com
- **Emergency:** Contact Pod Lead

## License

Proprietary - Serenity Care Partners © 2025
