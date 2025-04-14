import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, LogBox, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible until we're ready to render
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  'Non-serializable values were found in the navigation state',
]);

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Perform any pre-loading steps here if needed
        await new Promise(resolve => setTimeout(resolve, 1000)); // Artificial delay for smoother startup
        
        // Mark app as ready
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error preparing app:', e);
        setError(e);
        setAppIsReady(true); // Still mark as ready so we can show error UI
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // SplashScreen is still visible
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong!</Text>
        <Text style={styles.errorDetails}>{error.message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red',
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
