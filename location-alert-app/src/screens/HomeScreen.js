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
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [destinationName, setDestinationName] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [destinationReached, setDestinationReached] = useState(false);
  const [isSavedLocation, setIsSavedLocation] = useState(false);

  useEffect(() => {
    // Request permissions and start location tracking when component mounts
    const startTracking = async () => {
      const success = await locationService.startLocationTracking(locationData => {
        setCurrentLocation(locationData.currentLocation);
        setDistance(locationData.distance);
        
        // Check if we've reached the destination (within 50 meters)
        if (locationData.distance !== null && locationData.distance <= 0.05) {
          setDestinationReached(true);
        } else {
          setDestinationReached(false);
        }
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
        checkIfDestinationIsSaved();
      }
      setIsAlarmActive(locationService.isAlarmPlaying);
    });

    // Initialize on first load
    if (locationService.destinationLocation) {
      setDestinationLocation(locationService.destinationLocation);
      setDestinationName(locationService.destinationName);
      checkIfDestinationIsSaved();
    }

    return unsubscribe;
  }, [navigation]);

  const checkIfDestinationIsSaved = () => {
    if (!locationService.destinationLocation) {
      setIsSavedLocation(false);
      return;
    }

    const savedLocations = locationService.getSavedLocations();
    const isAlreadySaved = savedLocations.some(loc => 
      Math.abs(loc.latitude - locationService.destinationLocation.latitude) < 0.0001 && 
      Math.abs(loc.longitude - locationService.destinationLocation.longitude) < 0.0001
    );
    
    setIsSavedLocation(isAlreadySaved);
  };

  const handleSetDestination = () => {
    navigation.navigate('SetDestination');
  };

  const handleClearDestination = () => {
    locationService.clearDestination();
    setDestinationLocation(null);
    setDestinationName(null);
    setDistance(null);
    setDestinationReached(false);
    setIsSavedLocation(false);
  };

  const handleSaveDestination = async () => {
    if (!destinationLocation) return;
    
    try {
      await locationService.saveLocation(destinationLocation, destinationName);
      setIsSavedLocation(true);
      Alert.alert("Success", "Location saved to your favorites!");
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location. Please try again.");
    }
  };

  const handleMarkAsReached = () => {
    Alert.alert(
      "Destination Reached",
      `You've reached ${destinationName}! Would you like to clear this destination?`,
      [
        {
          text: "Keep Tracking",
          style: "cancel"
        },
        {
          text: "Clear Destination",
          onPress: async () => {
            await locationService.markDestinationReached();
            handleClearDestination();
          }
        }
      ]
    );
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
            {!isSavedLocation && (
              <TouchableOpacity
                style={styles.saveLocationButton}
                onPress={handleSaveDestination}
              >
                <Ionicons name="bookmark-outline" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={[styles.statusContainer, isAlarmActive && styles.alarmActiveContainer, 
          destinationReached && styles.destinationReachedContainer]}>
          <Text style={[styles.statusText, { 
            color: isAlarmActive ? '#fff' : destinationReached ? '#fff' : getStatusColor() 
          }]}>
            {destinationReached ? `You've reached ${destinationName}!` : getStatusText()}
          </Text>
          
          {isAlarmActive && (
            <TouchableOpacity 
              style={styles.stopAlarmButton}
              onPress={stopAlarm}
            >
              <Text style={styles.stopAlarmText}>STOP ALARM</Text>
            </TouchableOpacity>
          )}

          {destinationReached && (
            <TouchableOpacity 
              style={styles.markReachedButton}
              onPress={handleMarkAsReached}
            >
              <Text style={styles.markReachedText}>MARK AS REACHED</Text>
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

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.mainActionButton}
            onPress={handleSetDestination}
          >
            <Ionicons 
              name={destinationLocation ? "location" : "location-outline"} 
              size={22} 
              color="white" 
            />
            <Text style={styles.mainActionText}>
              {destinationLocation ? 'Change Destination' : 'Set Destination'}
            </Text>
          </TouchableOpacity>

          {destinationLocation && (
            <TouchableOpacity
              style={[styles.mainActionButton, styles.clearButton]}
              onPress={handleClearDestination}
            >
              <Ionicons name="close-circle-outline" size={22} color="white" />
              <Text style={styles.mainActionText}>Clear Destination</Text>
            </TouchableOpacity>
          )}
        </View>

        {destinationLocation && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Alert Information</Text>
            <View style={styles.infoContent}>
              <View style={styles.infoItem}>
                <View style={[styles.infoIconCircle, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="notifications-outline" size={16} color="white" />
                </View>
                <Text style={styles.infoText}>
                  First alerts at {locationService.notificationThresholds.far.threshold}km
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={[styles.infoIconCircle, { backgroundColor: '#FFC107' }]}>
                  <Ionicons name="notifications-outline" size={16} color="white" />
                </View>
                <Text style={styles.infoText}>
                  Medium alerts at {locationService.notificationThresholds.mid.threshold}km
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={[styles.infoIconCircle, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="notifications-outline" size={16} color="white" />
                </View>
                <Text style={styles.infoText}>
                  Close alerts at {locationService.notificationThresholds.near.threshold}km
                </Text>
              </View>
              
              {locationService.alarmEnabled && (
                <View style={styles.infoItem}>
                  <View style={[styles.infoIconCircle, { backgroundColor: '#F44336' }]}>
                    <Ionicons name="alarm-outline" size={16} color="white" />
                  </View>
                  <Text style={styles.alarmInfoText}>
                    Continuous alarm at {locationService.alarmDistance}km
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  destinationNameContainer: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  destinationNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  saveLocationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alarmActiveContainer: {
    backgroundColor: '#f44336',
  },
  destinationReachedContainer: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stopAlarmButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 12,
    elevation: 2,
  },
  stopAlarmText: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 14,
  },
  markReachedButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 12,
    elevation: 2,
  },
  markReachedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapContainer: {
    height: 350,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  actionButtonsContainer: {
    marginBottom: 16,
  },
  mainActionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
  },
  mainActionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  settingsButton: {
    backgroundColor: '#FF9800',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoContent: {
    
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  alarmInfoText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
  },
});

export default HomeScreen; 