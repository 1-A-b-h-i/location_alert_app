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
import { Ionicons } from '@expo/vector-icons';

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
  const [savedLocations, setSavedLocations] = useState([]);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [saveToFavorites, setSaveToFavorites] = useState(false);

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
    loadSavedLocations();
  }, []);

  const loadSavedLocations = () => {
    const locations = locationService.getSavedLocations();
    setSavedLocations(locations);
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    setDestinationName('Selected Location'); // Default name for manually selected locations
  };

  const handleSaveDestination = () => {
    if (selectedLocation) {
      // Show modal to let user name the destination
      setSaveToFavorites(false);
      setShowNameModal(true);
    } else {
      Alert.alert('No Destination', 'Please select a destination on the map first.');
    }
  };

  const handleConfirmDestination = async () => {
    // Save destination with name
    locationService.setDestination(
      selectedLocation.latitude, 
      selectedLocation.longitude,
      destinationName || 'Selected Location'
    );
    
    // If user wants to save to favorites, do that too
    if (saveToFavorites) {
      await locationService.saveLocation(
        selectedLocation,
        destinationName || 'Selected Location'
      );
    }
    
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

  const handleSelectSavedLocation = (location) => {
    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude
    });
    setDestinationName(location.name);
    setShowSavedLocations(false);
    
    // Animate map to the selected location
    if (mapRef && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
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
          <Ionicons name="search" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: '#4CAF50' }]} 
          onPress={() => setShowSavedLocations(!showSavedLocations)}
        >
          <Ionicons name="bookmark" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Results Panel */}
      {showSearchResults && (
        <View style={styles.resultsPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderText}>Search Results</Text>
            <TouchableOpacity onPress={() => setShowSearchResults(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `location-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.resultItem}
                onPress={() => handleSelectSearchResult(item)}
              >
                <Ionicons name="location-outline" size={20} color="#2196F3" style={styles.resultIcon} />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultCoords}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Saved Locations Panel */}
      {showSavedLocations && (
        <View style={styles.resultsPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderText}>Saved Locations</Text>
            <TouchableOpacity onPress={() => setShowSavedLocations(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {savedLocations.length > 0 ? (
            <FlatList
              data={savedLocations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.resultItem}
                  onPress={() => handleSelectSavedLocation(item)}
                >
                  <Ionicons name="bookmark" size={20} color="#4CAF50" style={styles.resultIcon} />
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultCoords}>
                      {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyResultsContainer}>
              <Ionicons name="bookmark-outline" size={40} color="#ccc" />
              <Text style={styles.emptyResultsText}>No saved locations</Text>
            </View>
          )}
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
        <Ionicons name="information-circle-outline" size={20} color="#666" style={styles.instructionIcon} />
        <Text style={styles.instructionText}>
          Tap on the map to select your destination. You can also search for locations or use your saved favorites.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !selectedLocation && styles.buttonDisabled]}
          onPress={handleSaveDestination}
          disabled={!selectedLocation}
        >
          <Ionicons name="navigate" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Set as Destination</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close-circle-outline" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {selectedLocation && (
        <View style={styles.coordinatesContainer}>
          <Ionicons name="location" size={16} color="#FF5722" style={styles.coordsIcon} />
          <Text style={styles.coordinatesText}>
            {destinationName || 'Selected Location'} ({selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)})
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
            
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setSaveToFavorites(!saveToFavorites)}
              >
                <View style={[styles.checkboxInner, saveToFavorites && styles.checkboxChecked]}>
                  {saveToFavorites && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Save to Favorites</Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleConfirmDestination}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
  resultsPanel: {
    position: 'absolute',
    top: 70,
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
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  panelHeaderText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIcon: {
    marginRight: 10,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  resultCoords: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyResultsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultsText: {
    fontSize: 15,
    color: '#666',
    marginTop: 10,
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
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  instructionContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  instructionIcon: {
    marginRight: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  cancelButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  coordsIcon: {
    marginRight: 8,
  },
  coordinatesText: {
    fontSize: 13,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2196F3',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  saveModalButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SetDestinationScreen; 