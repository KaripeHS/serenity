
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import 'react-native-reanimated';
import '../global.css';
import { AuthService } from '../services/auth.service';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutes
const SESSION_TIMESTAMP_KEY = 'session_last_active';

export default function RootLayout() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  const [loaded, error] = useFonts({
    // Load standard fonts if needed
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Session Timeout Handling
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        const lastActiveStr = await SecureStore.getItemAsync(SESSION_TIMESTAMP_KEY);
        if (lastActiveStr) {
          const lastActive = parseInt(lastActiveStr, 10);
          const now = Date.now();
          if (now - lastActive > INACTIVITY_LIMIT_MS) {
            console.log('[Security] Session timed out. Logging out...');
            await AuthService.logout();
            router.replace('/login');
          } else {
            // Refresh session timestamp
            await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, now.toString());
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background
        await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, Date.now().toString());
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Note: Push notifications are disabled in Expo Go (SDK 53+)
  // They will work in development builds with: npx eas build --profile development

  if (!loaded) {
    return null;
  }

  return (
    <Stack>
      {/* Role-based route groups */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(executive)" options={{ headerShown: false }} />
      <Stack.Screen name="(finance)" options={{ headerShown: false }} />
      <Stack.Screen name="(operations)" options={{ headerShown: false }} />
      <Stack.Screen name="(hr)" options={{ headerShown: false }} />
      <Stack.Screen name="(clinical)" options={{ headerShown: false }} />
      <Stack.Screen name="(patient)" options={{ headerShown: false }} />
      <Stack.Screen name="(family)" options={{ headerShown: false }} />

      {/* Visit Screens */}
      <Stack.Screen name="visit/[id]/details" options={{ headerShown: false }} />
      <Stack.Screen name="visit/[id]/complete" options={{ headerShown: false }} />

      {/* Messaging */}
      <Stack.Screen name="messaging" options={{ headerShown: false }} />

      {/* Auth & other screens */}
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="settings/password" options={{ title: 'Change Password', headerShown: true }} />
      <Stack.Screen name="settings/notifications" options={{ title: 'Notifications', headerShown: true }} />
      <Stack.Screen name="settings/profile" options={{ title: 'Edit Profile', headerShown: true }} />
    </Stack>
  );
}
