import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import locationService from '../services/LocationService';

const TripHistoryScreen = ({ navigation }) => {
  const [tripHistory, setTripHistory] = useState([]);

  useEffect(() => {
    loadTripHistory();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadTripHistory();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTripHistory = () => {
    const history = locationService.getTripHistory();
    setTripHistory(history);
  };

  const handleSetAsDestination = (trip) => {
    locationService.setDestination(
      trip.latitude,
      trip.longitude,
      trip.destinationName
    );
    navigation.navigate('Home');
  };

  const handleClearHistory = () => {
    if (tripHistory.length === 0) return;
    
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear your entire trip history?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear",
          onPress: async () => {
            await locationService.clearTripHistory();
            setTripHistory([]);
          },
          style: "destructive"
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    // Convert to minutes
    const minutes = Math.floor(durationMs / 60000);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} min`;
    }
  };

  const renderTripItem = ({ item }) => (
    <View style={styles.tripItem}>
      <View style={styles.tripHeader}>
        <Text style={styles.destinationName}>{item.destinationName}</Text>
        <View style={[
          styles.statusBadge, 
          item.completed ? styles.completedBadge : styles.canceledBadge
        ]}>
          <Text style={styles.statusText}>
            {item.completed ? 'Completed' : 'Canceled'}
          </Text>
        </View>
      </View>
      
      <View style={styles.tripDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" style={styles.icon} />
          <Text style={styles.detailText}>
            {formatDate(item.startTime)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="hourglass-outline" size={16} color="#666" style={styles.icon} />
          <Text style={styles.detailText}>
            Duration: {calculateDuration(item.startTime, item.endTime)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color="#666" style={styles.icon} />
          <Text style={styles.detailText}>
            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => handleSetAsDestination(item)}
      >
        <Ionicons name="navigate" size={18} color="white" />
        <Text style={styles.navigateText}>Navigate Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
        <TouchableOpacity
          style={[styles.clearButton, tripHistory.length === 0 && styles.disabledButton]}
          onPress={handleClearHistory}
          disabled={tripHistory.length === 0}
        >
          <Ionicons name="trash-outline" size={18} color={tripHistory.length === 0 ? "#bbb" : "#FF5722"} />
          <Text style={[styles.clearButtonText, tripHistory.length === 0 && styles.disabledButtonText]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {tripHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            No trip history yet
          </Text>
          <Text style={styles.emptySubtext}>
            Your trip history will appear here after you complete or cancel a trip
          </Text>
        </View>
      ) : (
        <FlatList
          data={tripHistory}
          renderItem={renderTripItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF5722',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#bbb',
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
    padding: 12,
  },
  tripItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  canceledBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  navigateButton: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navigateText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  }
});

export default TripHistoryScreen; 