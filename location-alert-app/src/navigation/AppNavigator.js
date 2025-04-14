import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, LogBox, View, Text } from 'react-native';
import { enableScreens } from 'react-native-screens';

import HomeScreen from '../screens/HomeScreen';
import SetDestinationScreen from '../screens/SetDestinationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SavedLocationsScreen from '../screens/SavedLocationsScreen';
import TripHistoryScreen from '../screens/TripHistoryScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

// Enable screens for better performance
enableScreens();

// Ignore specific warnings that might not be relevant
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Overwriting fontFamily style attribute preprocessor',
]);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// Common stack navigation options
const screenOptions = ({ navigation }) => ({
  headerStyle: {
    backgroundColor: '#2196F3',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerBackTitleVisible: false,
  headerLeftContainerStyle: {
    paddingLeft: 10,
  },
  headerLeft: (props) => 
    props.canGoBack ? (
      <TouchableOpacity
        {...props}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
    ) : null
});

// Home Stack
const HomeStack = () => {
  return (
    <Stack.Navigator 
      initialRouteName="HomeScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ 
          title: 'Location Alert',
          headerLeft: null,
        }}
      />
      <Stack.Screen 
        name="SetDestination" 
        component={SetDestinationScreen} 
        options={{ title: 'Set Destination' }}
      />
    </Stack.Navigator>
  );
};

// Saved Locations Stack
const SavedLocationsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="SavedLocationsScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="SavedLocationsScreen" 
        component={SavedLocationsScreen} 
        options={{ 
          title: 'Saved Locations',
          headerLeft: null,
        }}
      />
    </Stack.Navigator>
  );
};

// Trip History Stack
const TripHistoryStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="TripHistoryScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="TripHistoryScreen" 
        component={TripHistoryScreen} 
        options={{ 
          title: 'Trip History',
          headerLeft: null,
        }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack
const SettingsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="SettingsScreen"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="SettingsScreen" 
        component={SettingsScreen} 
        options={{ 
          title: 'Alert Settings',
          headerLeft: null,
        }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigation
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Saved" component={SavedLocationsStack} />
      <Tab.Screen name="History" component={TripHistoryStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

// Root Navigator with Welcome Screen and Main App
const AppNavigator = () => {
  return (
    <NavigationContainer
      fallback={<SplashScreen />}
      onReady={() => {
        console.log('Navigation container is ready');
      }}
      onStateChange={(state) => {
        // You could log navigation state changes here for debugging
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="Welcome"
      >
        <RootStack.Screen name="Welcome" component={WelcomeScreen} />
        <RootStack.Screen name="MainApp" component={TabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Simple splash screen component for fallback during loading
const SplashScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text>Loading...</Text>
    </View>
  );
};

export default AppNavigator; 