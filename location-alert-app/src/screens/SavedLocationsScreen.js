import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import locationService from '../services/LocationService';

const SavedLocationsScreen = ({ navigation }) => {
  const [savedLocations, setSavedLocations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedLocations();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedLocations();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSavedLocations = async () => {
    setIsLoading(true);
    const locations = locationService.getSavedLocations();
    setSavedLocations(locations);
    setIsLoading(false);
  };

  const handleSetAsDestination = (location) => {
    locationService.setDestination(
      location.latitude,
      location.longitude,
      location.name
    );
    navigation.navigate('Home');
  };

  const handleDeleteLocation = (locationId) => {
    Alert.alert(
      "Delete Location",
      "Are you sure you want to delete this saved location?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            await locationService.removeSavedLocation(locationId);
            loadSavedLocations();
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleAddCurrentLocation = async () => {
    if (!locationService.currentLocation) {
      Alert.alert("Error", "Current location not available");
      return;
    }

    setShowAddModal(true);
  };

  const saveCurrentLocation = async () => {
    if (!newLocationName.trim()) {
      Alert.alert("Error", "Please enter a name for this location");
      return;
    }

    await locationService.saveLocation(
      locationService.currentLocation,
      newLocationName.trim()
    );
    
    setShowAddModal(false);
    setNewLocationName('');
    loadSavedLocations();
  };

  const renderLocationItem = ({ item }) => (
    <View style={styles.locationItem}>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationCoords}>
          {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
        </Text>
        <Text style={styles.locationDate}>
          Saved on {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.locationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSetAsDestination(item)}
        >
          <Ionicons name="navigate" size={22} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteLocation(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCurrentLocation}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {savedLocations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            You don't have any saved locations yet
          </Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to save your current location
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add Location Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Current Location</Text>
            
            <TextInput
              style={styles.nameInput}
              value={newLocationName}
              onChangeText={setNewLocationName}
              placeholder="Enter a name for this location"
              autoFocus
            />
            
            {locationService.currentLocation && (
              <Text style={styles.coordsText}>
                Coordinates: {locationService.currentLocation.latitude.toFixed(5)}, 
                {locationService.currentLocation.longitude.toFixed(5)}
              </Text>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewLocationName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={saveCurrentLocation}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 10,
  },
  locationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  locationDate: {
    fontSize: 12,
    color: '#888',
  },
  locationActions: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 5,
  },
  actionButton: {
    padding: 5,
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
    borderRadius: 8,
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
    marginBottom: 12,
  },
  coordsText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
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

export default SavedLocationsScreen; 