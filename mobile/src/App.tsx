/**
 * Serenity ERP - Caregiver Field Companion Mobile App
 * React Native app for caregivers in the field
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  BackHandler,
  AppState,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import EVVScreen from './screens/EVVScreen';
import ClientsScreen from './screens/ClientsScreen';
import ProfileScreen from './screens/ProfileScreen';
import OfflineScreen from './screens/OfflineScreen';

// Services
import { AuthService } from './services/AuthService';
import { EVVService } from './services/EVVService';
import { OfflineStorageService } from './services/OfflineStorageService';
import { LocationService } from './services/LocationService';
import { mobileLogger } from './services/LoggerService';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

interface AppContextType {
  user: User | null;
  isOffline: boolean;
  currentLocation: Location.LocationObject | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clockIn: (shiftId: string) => Promise<void>;
  clockOut: (evvRecordId: string, notes?: string) => Promise<void>;
}

// Context
const AppContext = React.createContext<AppContextType | null>(null);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        // Icon implementation based on route name
        return <Text style={{ color, fontSize: size }}>{route.name[0]}</Text>;
      },
      tabBarActiveTintColor: '#10B981',
      tabBarInactiveTintColor: 'gray',
      headerStyle: {
        backgroundColor: '#10B981',
      },
      headerTintColor: 'white',
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} />
    <Tab.Screen name="EVV" component={EVVScreen} />
    <Tab.Screen name="Clients" component={ClientsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  // Services
  const authService = new AuthService();
  const evvService = new EVVService();
  const offlineStorage = new OfflineStorageService();
  const locationService = new LocationService();

  useEffect(() => {
    initializeApp();
    setupNetworkListener();
    setupLocationTracking();
    setupAppStateListener();
    setupBackHandler();
  }, []);

  const initializeApp = async () => {
    try {
      // Check for stored authentication
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Initialize offline storage
      await offlineStorage.initialize();

      // Request permissions
      await requestPermissions();

      setIsLoading(false);
    } catch (error) {
      mobileLogger.error('App initialization error', { error: error.message });
      setIsLoading(false);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(offline);
      
      if (offline) {
        Alert.alert(
          'No Internet Connection',
          'You are now in offline mode. EVV data will be synced when connection is restored.',
          [{ text: 'OK' }]
        );
      } else {
        // Sync offline data when back online
        syncOfflineData();
      }
    });

    return unsubscribe;
  };

  const setupLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setCurrentLocation(location);

      // Start watching location for EVV purposes
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          setCurrentLocation(location);
        }
      );
    }
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground, check for pending authentication
        handleAppForeground();
      }
      setAppState(nextAppState);
    });

    return () => subscription?.remove();
  };

  const setupBackHandler = () => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to exit the app?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const requestPermissions = async () => {
    // Location permission
    await Location.requestForegroundPermissionsAsync();
    
    // Biometric authentication permission
    if (await LocalAuthentication.hasHardwareAsync()) {
      await LocalAuthentication.supportedAuthenticationTypesAsync();
    }
  };

  const handleAppForeground = async () => {
    if (user && await LocalAuthentication.hasHardwareAsync()) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use PIN',
      });

      if (!result.success) {
        logout();
      }
    }
  };

  const syncOfflineData = async () => {
    try {
      const offlineEVVRecords = await offlineStorage.getPendingEVVRecords();
      
      for (const record of offlineEVVRecords) {
        try {
          await evvService.submitEVVRecord(record);
          await offlineStorage.markEVVRecordSynced(record.id);
        } catch (error) {
          mobileLogger.error('Failed to sync EVV record', { recordId: record.id, error: error.message });
        }
      }
    } catch (error) {
      mobileLogger.error('Offline sync error', { error: error.message });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      const userData = response.user;
      
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', response.token);
    } catch (error) {
      throw new Error('Login failed: ' + error.message);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      await AsyncStorage.multiRemove(['user', 'token']);
    } catch (error) {
      mobileLogger.error('Logout error', { error: error.message });
    }
  };

  const clockIn = async (shiftId: string) => {
    try {
      if (!currentLocation) {
        throw new Error('Location is required for clock-in');
      }

      const evvRecord = {
        shiftId,
        servicePerformed: 'Personal Care Services', // Would be dynamic
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
        },
        verificationMethod: 'gps' as const,
        deviceInfo: {
          deviceId: 'mobile-device-id',
          deviceType: 'mobile' as const,
          os: Platform.OS,
          appVersion: '1.0.0',
          ipAddress: '0.0.0.0', // Would get actual IP
          userAgent: `Serenity-Mobile/${Platform.OS}`,
        },
      };

      if (isOffline) {
        // Store for later sync
        await offlineStorage.storeEVVRecord(evvRecord);
        Alert.alert('Offline Mode', 'Clock-in recorded offline. Will sync when connection is restored.');
      } else {
        await evvService.clockIn(evvRecord);
        Alert.alert('Success', 'Successfully clocked in!');
      }
    } catch (error) {
      Alert.alert('Clock-in Failed', error.message);
      throw error;
    }
  };

  const clockOut = async (evvRecordId: string, notes?: string) => {
    try {
      if (!currentLocation) {
        throw new Error('Location is required for clock-out');
      }

      const clockOutData = {
        evvRecordId,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
        },
        notes,
      };

      if (isOffline) {
        await offlineStorage.storeClockOut(clockOutData);
        Alert.alert('Offline Mode', 'Clock-out recorded offline. Will sync when connection is restored.');
      } else {
        await evvService.clockOut(clockOutData);
        Alert.alert('Success', 'Successfully clocked out!');
      }
    } catch (error) {
      Alert.alert('Clock-out Failed', error.message);
      throw error;
    }
  };

  const contextValue: AppContextType = {
    user,
    isOffline,
    currentLocation,
    login,
    logout,
    clockIn,
    clockOut,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Serenity ERP...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <AppContext.Provider value={contextValue}>
        <NavigationContainer>
          {user ? (
            isOffline ? (
              <Stack.Navigator>
                <Stack.Screen 
                  name="Offline" 
                  component={OfflineScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            ) : (
              <MainTabs />
            )
          ) : (
            <Stack.Navigator>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </AppContext.Provider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export { AppContext };
export type { AppContextType, User };