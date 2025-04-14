import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('MainApp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      
      <View style={styles.header}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <Ionicons name="navigate-circle" size={80} color="#2196F3" />
          <Text style={styles.appName}>Location Alert</Text>
          <Text style={styles.tagline}>Never miss your destination again</Text>
        </Animated.View>
      </View>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="notifications-outline" size={24} color="#2196F3" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Smart Notifications</Text>
            <Text style={styles.featureDescription}>
              Get timely alerts as you approach your destination
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="alarm-outline" size={24} color="#2196F3" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Alarm Feature</Text>
            <Text style={styles.featureDescription}>
              Continuous alarm when you're close to arriving
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="bookmark-outline" size={24} color="#2196F3" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Save Locations</Text>
            <Text style={styles.featureDescription}>
              Store your favorite places for quick access
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="time-outline" size={24} color="#2196F3" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Trip History</Text>
            <Text style={styles.featureDescription}>
              Keep track of your past destinations
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
  },
  getStartedButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default WelcomeScreen; 