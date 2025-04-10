import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import locationService from '../services/LocationService';

const HomeScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [destinationName, setDestinationName] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  useEffect(() => {
    // Request permissions and start location tracking when component mounts
    const startTracking = async () => {
      const success = await locationService.startLocationTracking(locationData => {
        setCurrentLocation(locationData.currentLocation);
        setDistance(locationData.distance);
      });
      setIsTracking(success);
    };

    startTracking();

    // Check alarm status every second
    const alarmCheckInterval = setInterval(() => {
      setIsAlarmActive(locationService.isAlarmPlaying);
    }, 1000);

    // Clean up when component unmounts
    return () => {
      locationService.stopLocationTracking();
      clearInterval(alarmCheckInterval);
    };
  }, []);

  // Check if destination is set from locationService
  useEffect(() => {
    // Update when coming back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      if (locationService.destinationLocation) {
        setDestinationLocation(locationService.destinationLocation);
        setDestinationName(locationService.destinationName);
      }
      setIsAlarmActive(locationService.isAlarmPlaying);
    });

    // Initialize on first load
    if (locationService.destinationLocation) {
      setDestinationLocation(locationService.destinationLocation);
      setDestinationName(locationService.destinationName);
    }

    return unsubscribe;
  }, [navigation]);

  const handleSetDestination = () => {
    navigation.navigate('SetDestination');
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const getStatusColor = () => {
    if (!distance || !destinationLocation) return '#777';
    if (distance <= locationService.notificationThresholds.near.threshold) return '#4CAF50';
    if (distance <= locationService.notificationThresholds.mid.threshold) return '#FFC107';
    return '#2196F3';
  };

  const getStatusText = () => {
    if (!destinationLocation) return 'No destination set';
    if (!distance) return 'Calculating distance...';
    if (distance <= locationService.alarmDistance && locationService.alarmEnabled) {
      return `ALARM ZONE: ${distance.toFixed(1)} km from destination`;
    }
    if (distance <= locationService.notificationThresholds.near.threshold) {
      return `Very close! Only ${distance.toFixed(1)} km away`;
    }
    if (distance <= locationService.notificationThresholds.mid.threshold) {
      return `Getting closer! ${distance.toFixed(1)} km away`;
    }
    return `${distance.toFixed(1)} km away from destination`;
  };

  const stopAlarm = () => {
    locationService.stopAlarm();
    setIsAlarmActive(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {destinationName && (
          <View style={styles.destinationNameContainer}>
            <Text style={styles.destinationNameText}>
              {destinationName}
            </Text>
          </View>
        )}
        
        <View style={[styles.statusContainer, isAlarmActive && styles.alarmActiveContainer]}>
          <Text style={[styles.statusText, { color: isAlarmActive ? '#fff' : getStatusColor() }]}>
            {getStatusText()}
          </Text>
          
          {isAlarmActive && (
            <TouchableOpacity 
              style={styles.stopAlarmButton}
              onPress={stopAlarm}
            >
              <Text style={styles.stopAlarmText}>STOP ALARM</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.mapContainer}>
          {currentLocation ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* Current location marker */}
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                pinColor="#2196F3"
              />

              {/* Destination marker */}
              {destinationLocation && (
                <>
                  <Marker
                    coordinate={destinationLocation}
                    title={destinationName || "Destination"}
                    pinColor="#FF5722"
                  />
                  {/* Alert radius circle */}
                  <Circle
                    center={destinationLocation}
                    radius={locationService.notificationThresholds.far.threshold * 1000} // convert km to meters
                    strokeWidth={1}
                    strokeColor="rgba(33, 150, 243, 0.3)"
                    fillColor="rgba(33, 150, 243, 0.1)"
                  />
                  
                  {/* Add circles for each threshold */}
                  <Circle
                    center={destinationLocation}
                    radius={locationService.notificationThresholds.mid.threshold * 1000}
                    strokeWidth={1}
                    strokeColor="rgba(255, 193, 7, 0.5)"
                    fillColor="rgba(255, 193, 7, 0.1)"
                  />
                  
                  <Circle
                    center={destinationLocation}
                    radius={locationService.notificationThresholds.near.threshold * 1000}
                    strokeWidth={1}
                    strokeColor="rgba(76, 175, 80, 0.5)"
                    fillColor="rgba(76, 175, 80, 0.1)"
                  />
                  
                  {/* Alarm radius circle */}
                  {locationService.alarmEnabled && (
                    <Circle
                      center={destinationLocation}
                      radius={locationService.alarmDistance * 1000}
                      strokeWidth={2}
                      strokeColor="rgba(244, 67, 54, 0.8)"
                      fillColor="rgba(244, 67, 54, 0.2)"
                    />
                  )}
                </>
              )}
            </MapView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text>Loading map...</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSetDestination}
          >
            <Text style={styles.buttonText}>
              {destinationLocation ? 'Change Destination' : 'Set Destination'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.settingsButton]}
            onPress={handleOpenSettings}
          >
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {destinationLocation && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Destination coordinates: {destinationLocation.latitude.toFixed(4)}, {destinationLocation.longitude.toFixed(4)}
            </Text>
            <Text style={styles.infoText}>
              Alert thresholds:
            </Text>
            <Text style={styles.infoText}>
              • First alerts at {locationService.notificationThresholds.far.threshold}km (every 500m)
            </Text>
            <Text style={styles.infoText}>
              • Medium alerts at {locationService.notificationThresholds.mid.threshold}km (every 200m)
            </Text>
            <Text style={styles.infoText}>
              • Close alerts at {locationService.notificationThresholds.near.threshold}km (every 100m)
            </Text>
            {locationService.alarmEnabled && (
              <Text style={styles.alarmInfoText}>
                • Continuous alarm at {locationService.alarmDistance}km
              </Text>
            )}
          </View>
        )}
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
    flexGrow: 1,
    padding: 16,
  },
  destinationNameContainer: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  destinationNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  alarmActiveContainer: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopAlarmButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginTop: 10,
  },
  stopAlarmText: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapContainer: {
    height: 350,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  alarmInfoText: {
    fontSize: 14,
    color: '#f44336',
    marginBottom: 6,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 