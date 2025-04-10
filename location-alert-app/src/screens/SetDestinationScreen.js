import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import locationService from '../services/LocationService';

// Simplified mock geocoding service since we don't have a real API key
// In a real app, you would use Google Places API, Mapbox Geocoding, etc.
const mockGeocodeSearch = async (query) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock locations based on search queries
  const mockLocations = [
    { name: 'New York City', latitude: 40.7128, longitude: -74.0060 },
    { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 },
    { name: 'Chicago', latitude: 41.8781, longitude: -87.6298 },
    { name: 'Houston', latitude: 29.7604, longitude: -95.3698 },
    { name: 'Phoenix', latitude: 33.4484, longitude: -112.0740 },
    { name: 'Philadelphia', latitude: 39.9526, longitude: -75.1652 },
    { name: 'San Antonio', latitude: 29.4241, longitude: -98.4936 },
    { name: 'San Diego', latitude: 32.7157, longitude: -117.1611 },
    { name: 'Dallas', latitude: 32.7767, longitude: -96.7970 },
    { name: 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
  ];
  
  // Filter locations based on query
  const results = mockLocations.filter(location => 
    location.name.toLowerCase().includes(query.toLowerCase())
  );
  
  return results;
};

const SetDestinationScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [destinationName, setDestinationName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    // Get initial current location
    const getInitialLocation = async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for this app to work.');
          setLoading(false);
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        // If destination is already set, initialize it as selected
        if (locationService.destinationLocation) {
          setSelectedLocation(locationService.destinationLocation);
          setDestinationName(locationService.destinationName);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Failed to get your location. Please try again.');
        setLoading(false);
      }
    };

    getInitialLocation();
  }, []);

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    setDestinationName('Selected Location'); // Default name for manually selected locations
  };

  const handleSaveDestination = () => {
    if (selectedLocation) {
      // Show modal to let user name the destination
      setShowNameModal(true);
    } else {
      Alert.alert('No Destination', 'Please select a destination on the map first.');
    }
  };

  const handleConfirmDestination = () => {
    // Save destination with name
    locationService.setDestination(
      selectedLocation.latitude, 
      selectedLocation.longitude,
      destinationName || 'Selected Location'
    );
    setShowNameModal(false);
    navigation.goBack();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty Search', 'Please enter a location to search.');
      return;
    }

    try {
      setLoading(true);
      // Use our mock geocoding service
      const results = await mockGeocodeSearch(searchQuery);
      
      if (results.length === 0) {
        Alert.alert('No Results', 'No locations found matching your search.');
      } else {
        setSearchResults(results);
        setShowSearchResults(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Search Failed', 'Failed to search for the location. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    setSelectedLocation({
      latitude: item.latitude,
      longitude: item.longitude
    });
    setDestinationName(item.name);
    setShowSearchResults(false);
    setSearchQuery(item.name);
    
    // Animate map to the selected location
    if (mapRef && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const mapRef = React.useRef(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results Modal */}
      {showSearchResults && (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `location-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => handleSelectSearchResult(item)}
              >
                <Text style={styles.searchResultText}>{item.name}</Text>
                <Text style={styles.searchResultCoords}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              </TouchableOpacity>
            )}
            ListHeaderComponent={
              <View style={styles.searchResultHeader}>
                <Text style={styles.searchResultHeaderText}>Search Results</Text>
                <TouchableOpacity onPress={() => setShowSearchResults(false)}>
                  <Text style={styles.closeButton}>Close</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      )}

      <View style={styles.mapContainer}>
        {currentLocation && !loading ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: selectedLocation ? selectedLocation.latitude : currentLocation.latitude,
              longitude: selectedLocation ? selectedLocation.longitude : currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={handleMapPress}
          >
            {/* Current location marker */}
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              pinColor="#2196F3"
            />

            {/* Selected location marker */}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title={destinationName || "Selected Destination"}
                pinColor="#FF5722"
                draggable
                onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Tap on the map to select your destination. You can also search for locations or drag the marker to adjust.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !selectedLocation && styles.buttonDisabled]}
          onPress={handleSaveDestination}
          disabled={!selectedLocation}
        >
          <Text style={styles.buttonText}>Set as Destination</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {selectedLocation && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesText}>
            Selected: {destinationName || 'Unnamed Location'} ({selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)})
          </Text>
        </View>
      )}

      {/* Name Destination Modal */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Destination</Text>
            
            <TextInput
              style={styles.nameInput}
              value={destinationName}
              onChangeText={setDestinationName}
              placeholder="Enter a name for this location"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleConfirmDestination}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 1000,
    elevation: 5,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  searchResultHeaderText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    fontSize: 16,
  },
  searchResultCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    height: 300,
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
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  instructionContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  coordinatesContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelModalButton: {
    backgroundColor: '#F44336',
  },
  saveModalButton: {
    backgroundColor: '#4CAF50',
  },
});

export default SetDestinationScreen; 