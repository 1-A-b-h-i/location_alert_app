import * as Location from 'expo-location';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationService {
  constructor() {
    this.destinationLocation = null;
    this.destinationName = "Selected Destination"; // Default name for destination
    this.currentLocation = null;
    this.distanceThreshold = 15; // 15 kilometers
    this.locationSubscription = null;
    this.onLocationUpdateCallback = null;
    
    // Graduated notification thresholds
    this.notificationThresholds = {
      far: { threshold: 10, interval: 0.5 }, // > 2km: every 500m
      mid: { threshold: 2, interval: 0.2 },  // 1-2km: every 200m
      near: { threshold: 1, interval: 0.1 }  // < 1km: every 100m
    };
    
    // Alarm settings
    this.alarmEnabled = true;
    this.alarmDistance = 0.5; // 500 meters
    this.alarmSound = null;
    this.isAlarmPlaying = false;
    
    // Keep track of last notification distance to prevent duplicate notifications
    this.lastNotificationDistance = null;

    // Saved locations
    this.savedLocations = [];
    
    // Trip history
    this.tripHistory = [];
    
    // Load saved data
    this._initializeData();
  }

  // Initialize data with better error handling
  async _initializeData() {
    try {
      await this.loadSavedData();
      console.log('LocationService initialized successfully');
    } catch (error) {
      console.error('Error initializing LocationService:', error);
      // Use default values if loading fails
      this.savedLocations = [];
      this.tripHistory = [];
    }
  }

  // Save all persistent data
  async saveData() {
    try {
      const dataToSave = {
        savedLocations: this.savedLocations,
        tripHistory: this.tripHistory,
        notificationThresholds: this.notificationThresholds,
        alarmEnabled: this.alarmEnabled,
        alarmDistance: this.alarmDistance
      };
      
      await AsyncStorage.setItem('locationServiceData', JSON.stringify(dataToSave));
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      // Avoid crashing the app, just log the error
    }
  }

  // Load saved data with better error handling
  async loadSavedData() {
    try {
      const savedData = await AsyncStorage.getItem('locationServiceData');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        if (parsedData.savedLocations) this.savedLocations = parsedData.savedLocations;
        if (parsedData.tripHistory) this.tripHistory = parsedData.tripHistory;
        if (parsedData.notificationThresholds) this.notificationThresholds = parsedData.notificationThresholds;
        if (parsedData.alarmEnabled !== undefined) this.alarmEnabled = parsedData.alarmEnabled;
        if (parsedData.alarmDistance !== undefined) this.alarmDistance = parsedData.alarmDistance;
        
        console.log('Loaded saved data:', { 
          locationsCount: this.savedLocations.length,
          tripsCount: this.tripHistory.length
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      throw error; // Re-throw to be handled by _initializeData
    }
  }

  // Save a location to favorites
  async saveLocation(location, name) {
    const newLocation = {
      id: Date.now().toString(),
      name: name || 'Saved Location',
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString()
    };
    
    this.savedLocations = [...this.savedLocations, newLocation];
    await this.saveData();
    return newLocation;
  }

  // Remove a location from favorites
  async removeSavedLocation(locationId) {
    this.savedLocations = this.savedLocations.filter(loc => loc.id !== locationId);
    await this.saveData();
  }

  // Get all saved locations
  getSavedLocations() {
    return this.savedLocations;
  }

  // Add to trip history
  async addToTripHistory(destination, startTime, endTime, completed = true) {
    const trip = {
      id: Date.now().toString(),
      destinationName: destination.name,
      latitude: destination.latitude,
      longitude: destination.longitude,
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date().toISOString(),
      completed: completed
    };
    
    this.tripHistory = [trip, ...this.tripHistory].slice(0, 20); // Keep only last 20 trips
    await this.saveData();
    return trip;
  }

  // Get trip history
  getTripHistory() {
    return this.tripHistory;
  }

  // Clear trip history
  async clearTripHistory() {
    this.tripHistory = [];
    await this.saveData();
  }

  async requestPermissions() {
    try {
      // Request location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for this app to work.');
        return false;
      }

      // Request notification permissions
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Notification permission is required for alerting you.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  setDestination(latitude, longitude, name = "Selected Destination") {
    this.destinationLocation = { latitude, longitude };
    this.destinationName = name;
    this.lastNotificationDistance = null; // Reset notification tracking
    this.stopAlarm(); // Stop any playing alarm
    this.tripStartTime = new Date().toISOString(); // Record trip start time
    return this.destinationLocation;
  }

  async clearDestination() {
    // If we had a destination, add to trip history before clearing
    if (this.destinationLocation) {
      await this.addToTripHistory(
        {
          name: this.destinationName,
          latitude: this.destinationLocation.latitude,
          longitude: this.destinationLocation.longitude
        },
        this.tripStartTime,
        new Date().toISOString(),
        false // Mark as incomplete if manually cleared
      );
    }
    
    this.destinationLocation = null;
    this.destinationName = "Selected Destination"; // Reset to default name
    this.lastNotificationDistance = null; // Reset notification tracking
    this.stopAlarm(); // Stop any playing alarm
    return null;
  }

  async markDestinationReached() {
    // Add completed trip to history
    if (this.destinationLocation) {
      await this.addToTripHistory(
        {
          name: this.destinationName,
          latitude: this.destinationLocation.latitude,
          longitude: this.destinationLocation.longitude
        },
        this.tripStartTime,
        new Date().toISOString(),
        true // Mark as completed
      );
    }
    
    this.destinationLocation = null;
    this.destinationName = "Selected Destination";
    this.lastNotificationDistance = null;
    this.stopAlarm();
    return null;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Implementation of the Haversine formula to calculate distance between two coordinates
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  async startLocationTracking(onLocationUpdate) {
    try {
      if (!await this.requestPermissions()) {
        return false;
      }

      // Store callback for potential restarts
      this.onLocationUpdateCallback = onLocationUpdate;

      // Configure notifications
      await this.configureNotifications();

      // Start watching position
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50, // Reduced to 50m for more frequent updates
          timeInterval: 3000 // Reduced to 3s for more responsive tracking
        },
        location => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          };

          // Check if destination is set
          if (this.destinationLocation) {
            const distance = this.calculateDistance(
              this.currentLocation.latitude,
              this.currentLocation.longitude,
              this.destinationLocation.latitude,
              this.destinationLocation.longitude
            );

            // Check for graduated notifications
            this.checkGraduatedNotifications(distance);
            
            // Check for alarm condition
            this.checkAlarmCondition(distance);
          }

          // Call the callback with current location and distance
          if (onLocationUpdate) {
            onLocationUpdate({
              currentLocation: this.currentLocation,
              distance: this.destinationLocation
                ? this.calculateDistance(
                    this.currentLocation.latitude,
                    this.currentLocation.longitude,
                    this.destinationLocation.latitude,
                    this.destinationLocation.longitude
                  )
                : null
            });
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  // New method to handle alarm based on distance
  async checkAlarmCondition(distance) {
    if (!this.alarmEnabled || !this.destinationLocation) return;
    
    if (distance <= this.alarmDistance) {
      // If within alarm distance and alarm not already playing, start alarm
      if (!this.isAlarmPlaying) {
        this.startAlarm();
      }
    } else if (this.isAlarmPlaying) {
      // If outside alarm distance and alarm is playing, stop it
      this.stopAlarm();
    }
  }
  
  async startAlarm() {
    try {
      if (this.isAlarmPlaying) return;
      
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/alarm.mp3'),
        { 
          isLooping: true,
          volume: 1.0 
        }
      );
      
      this.alarmSound = sound;
      await this.alarmSound.playAsync();
      this.isAlarmPlaying = true;
      
      // Add notification for alarm
      this.triggerNotification(
        this.alarmDistance, 
        `ALARM ACTIVATED! You are now within ${this.alarmDistance} km of ${this.destinationName}`
      );
      
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }
  
  async stopAlarm() {
    try {
      if (this.alarmSound) {
        await this.alarmSound.stopAsync();
        await this.alarmSound.unloadAsync();
        this.alarmSound = null;
      }
      this.isAlarmPlaying = false;
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  }
  
  // Method to set alarm settings
  setAlarmSettings(enabled, distance) {
    this.alarmEnabled = enabled;
    if (distance !== undefined) {
      this.alarmDistance = distance;
    }
    
    // If alarm is disabled, stop any playing alarm
    if (!enabled && this.isAlarmPlaying) {
      this.stopAlarm();
    }
  }

  // New method to handle graduated notifications
  checkGraduatedNotifications(distance) {
    if (!this.destinationLocation) return;
    
    let interval;
    let notificationMessage;
    
    // Determine which threshold we're in
    if (distance <= this.notificationThresholds.near.threshold) {
      // Within 1km
      interval = this.notificationThresholds.near.interval;
      notificationMessage = `You're very close! Only ${distance.toFixed(1)} km to ${this.destinationName}`;
    } else if (distance <= this.notificationThresholds.mid.threshold) {
      // Within 2km
      interval = this.notificationThresholds.mid.interval;
      notificationMessage = `Getting closer! ${distance.toFixed(1)} km to ${this.destinationName}`;
    } else if (distance <= this.notificationThresholds.far.threshold) {
      // Within initial threshold (10km)
      interval = this.notificationThresholds.far.interval;
      notificationMessage = `Approaching destination! ${distance.toFixed(1)} km to ${this.destinationName}`;
    } else {
      // Beyond all thresholds
      return;
    }
    
    // Check if we should send a notification based on intervals
    const shouldNotify = this.shouldSendNotification(distance, interval);
    
    if (shouldNotify) {
      this.triggerNotification(distance, notificationMessage);
      this.lastNotificationDistance = distance;
    }
  }
  
  // Helper method to determine if notification should be sent
  shouldSendNotification(currentDistance, interval) {
    // Always send first notification when entering a threshold zone
    if (this.lastNotificationDistance === null) {
      return true;
    }
    
    // Calculate how many intervals we've moved
    const intervalsPassed = Math.floor(this.lastNotificationDistance / interval) - 
                           Math.floor(currentDistance / interval);
    
    // Send notification if we've passed at least one interval boundary
    return intervalsPassed > 0;
  }

  stopLocationTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.stopAlarm();
  }

  // Restart tracking after settings change
  async restartLocationTracking() {
    this.stopLocationTracking();
    this.lastNotificationDistance = null; // Reset notification tracking
    
    if (this.onLocationUpdateCallback) {
      return await this.startLocationTracking(this.onLocationUpdateCallback);
    }
    
    return false;
  }

  async configureNotifications() {
    // Configure notifications
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  async triggerNotification(distance, message) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Approaching Destination!',
        body: message || `You are now ${distance.toFixed(1)} km away from your destination.`,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }
}

// Create a singleton instance
const locationService = new LocationService();
export default locationService; 