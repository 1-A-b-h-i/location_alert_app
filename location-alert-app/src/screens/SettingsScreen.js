import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  TextInput,
  Alert
} from 'react-native';
import locationService from '../services/LocationService';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

const SettingsScreen = ({ navigation }) => {
  const [initialThreshold, setInitialThreshold] = useState(
    locationService.notificationThresholds.far.threshold.toString()
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  
  // New alarm settings
  const [alarmEnabled, setAlarmEnabled] = useState(
    locationService.alarmEnabled
  );
  const [alarmDistance, setAlarmDistance] = useState(
    locationService.alarmDistance.toString()
  );

  const handleSaveSettings = async () => {
    const thresholdValue = parseFloat(initialThreshold);
    const alarmDistanceValue = parseFloat(alarmDistance);
    
    if (isNaN(thresholdValue) || thresholdValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid initial alert distance greater than zero.');
      return;
    }
    
    if (isNaN(alarmDistanceValue) || alarmDistanceValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid alarm distance greater than zero.');
      return;
    }

    // Save the initial threshold to location service
    locationService.notificationThresholds.far.threshold = thresholdValue;
    
    // Update the other thresholds proportionally (maintain the original ratios)
    const proportion = thresholdValue / 10; // 10 was the original far threshold
    locationService.notificationThresholds.mid.threshold = Math.max(2 * proportion, 1);  // at least 1km
    locationService.notificationThresholds.near.threshold = Math.max(1 * proportion, 0.5); // at least 0.5km
    
    // Save alarm settings
    locationService.setAlarmSettings(alarmEnabled, alarmDistanceValue);
    
    // Reset the notification flag so it can notify again with new settings
    locationService.lastNotificationDistance = null;
    
    // Restart location tracking with new settings
    await locationService.restartLocationTracking();
    
    Alert.alert('Settings Saved', 'Your alert settings have been updated successfully.');
    navigation.goBack();
  };

  const handleToggleSound = (value) => {
    setSoundEnabled(value);
    // In a real app, we would update the notification settings here
  };

  const handleRequestBackgroundPermission = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status === 'granted') {
        setBackgroundTracking(true);
        Alert.alert('Background Location', 'Background location tracking is now enabled.');
      } else {
        setBackgroundTracking(false);
        Alert.alert('Permission Denied', 'Background location permission was denied.');
      }
    } catch (error) {
      console.error('Error requesting background location permission:', error);
      Alert.alert('Error', 'Failed to request background location permission.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Alert Settings</Text>
          
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Initial Alert Distance (km)</Text>
            <TextInput
              style={styles.distanceInput}
              value={initialThreshold}
              onChangeText={setInitialThreshold}
              keyboardType="numeric"
              placeholder="Enter distance in km"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Graduated Alert System</Text>
            <Text style={styles.infoText}>
              • First alerts begin at the distance above
            </Text>
            <Text style={styles.infoText}>
              • From initial distance to 2 km: alerts every 500 m
            </Text>
            <Text style={styles.infoText}>
              • From 2 km to 1 km: alerts every 200 m
            </Text>
            <Text style={styles.infoText}>
              • Under 1 km: alerts every 100 m
            </Text>
          </View>
          
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Sound Notifications</Text>
            <Switch
              value={soundEnabled}
              onValueChange={handleToggleSound}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={soundEnabled ? '#2196F3' : '#f4f3f4'}
            />
          </View>
        </View>
        
        {/* New Alarm Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Continuous Alarm</Text>
          
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Enable Alarm</Text>
            <Switch
              value={alarmEnabled}
              onValueChange={setAlarmEnabled}
              trackColor={{ false: '#767577', true: '#f08080' }}
              thumbColor={alarmEnabled ? '#f44336' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Alarm Distance (km)</Text>
            <TextInput
              style={[styles.distanceInput, alarmEnabled ? null : styles.inputDisabled]}
              value={alarmDistance}
              onChangeText={setAlarmDistance}
              keyboardType="numeric"
              placeholder="Enter distance in km"
              editable={alarmEnabled}
            />
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How The Alarm Works</Text>
            <Text style={styles.infoText}>
              When you get within the specified distance of your destination, a continuous alarm sound will play until:
            </Text>
            <Text style={styles.infoText}>
              • You move outside the alarm radius
            </Text>
            <Text style={styles.infoText}>
              • You change your destination
            </Text>
            <Text style={styles.infoText}>
              • You disable the alarm in settings
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Location Settings</Text>
          
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Background Tracking</Text>
            <Switch
              value={backgroundTracking}
              onValueChange={(value) => {
                if (value) {
                  handleRequestBackgroundPermission();
                } else {
                  setBackgroundTracking(false);
                }
              }}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={backgroundTracking ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          
          <Text style={styles.settingDescription}>
            Background tracking allows the app to monitor your location even when the app is not open,
            ensuring you'll always receive alerts when approaching your destination.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
          >
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#555',
  },
  distanceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    color: '#999',
  },
  infoBox: {
    backgroundColor: '#e1f5fe',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0277bd',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SettingsScreen; 