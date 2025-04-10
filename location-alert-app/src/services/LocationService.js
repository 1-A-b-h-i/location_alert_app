import * as Location from 'expo-location';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

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
    return this.destinationLocation;
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