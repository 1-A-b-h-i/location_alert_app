# Location Alert App

A React Native application built with Expo that alerts you when you're approaching a destination. Perfect for travelers who want to be notified when they're getting close to their target location.

## Features

- Set a destination on a map with name and search functionality
- Real-time location tracking
- Graduated notification system that increases frequency as you get closer
- Customizable alert distances
- Notification and sound alerts when approaching destination
- Background tracking support
- Clean and intuitive user interface

## Notification System

The app uses a graduated notification system:
- Initial alerts begin at a customizable distance (default 10km)
- From initial distance to 2km: alerts every 500m
- From 2km to 1km: alerts every 200m
- Under 1km: alerts every 100m

This ensures you get timely updates as you approach your destination, with more frequent alerts the closer you get.

## Screenshots

(Screenshots will be added once the app is deployed)

## Prerequisites

- Node.js
- npm or yarn
- Expo Go app on your Android device

## Installation

1. Clone the repository:

```
git clone https://github.com/yourusername/location-alert-app.git
cd location-alert-app
```

2. Install dependencies:

```
npm install
```

3. Start the Expo development server:

```
npm start
```

4. Scan the QR code with your Expo Go app on your Android device to launch the app.

## Usage

1. Open the app and grant location and notification permissions when prompted.
2. Tap "Set Destination" to select your target location.
3. Search for a location or tap directly on the map to set your destination.
4. Name your destination when prompted.
5. The app will track your current location and show the distance to your destination.
6. You'll receive graduated notifications as you get closer to your destination.
7. You can adjust the alert distances and other settings in the Settings screen.

## Technologies Used

- React Native
- Expo
- React Navigation
- Expo Location
- React Native Maps
- Expo Notifications

## Known Limitations

- The app currently does not support iOS devices due to background location restrictions.
- The search functionality uses a mock implementation. In a production version, it would use a real geocoding API like Google Places or MapBox.

## Future Enhancements

- Integration with real geocoding APIs
- Support for multiple saved destinations
- Trip history
- Custom notification sounds
- ETA calculations
- Integration with navigation apps

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Expo and React Native
- Uses the Haversine formula for distance calculations 