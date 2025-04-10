# Location Alert App - User Instructions

## Getting Started

1. **Launch the App**
   - Open the Expo Go app on your Android device
   - Scan the QR code provided by the developer
   - Wait for the app to load

2. **Grant Permissions**
   - When prompted, allow the app to access your location
   - Allow notification permissions to receive alerts
   - These permissions are essential for the app's core functionality

## Setting a Destination

1. **From the Home Screen**
   - Tap the "Set Destination" button

2. **On the Map Screen**
   - You'll see your current location marked with a blue pin
   - You can set a destination in two ways:
     * Search for a location using the search bar at the top
     * Tap directly on the map to place a destination marker
   - You can drag the red destination marker to adjust its position

3. **Name Your Destination**
   - After selecting a location, tap "Set as Destination"
   - A dialog will appear asking you to name your destination
   - Enter a meaningful name that will help you recognize the destination
   - Tap "Save" to confirm

4. **View on Home Screen**
   - You'll return to the home screen where your destination name, distance, and map will be displayed

## Main Screen Features

- **Destination Name**: Shows prominently at the top of the screen
- **Status Bar**: Shows your current distance from the destination
- **Map View**: Displays your current location, destination, and the alert radius
- **Destination Info**: Shows coordinates and alert thresholds
- **Settings Button**: Access to customize the app

## Notification System

The app uses a graduated notification system that increases in frequency as you get closer to your destination:

1. **Initial Distance (default 10km)** 
   - Notifications every 500m

2. **Medium Distance (2km)** 
   - Notifications every 200m

3. **Close Range (1km)** 
   - Notifications every 100m

This ensures you get timely updates without being overwhelmed with notifications when far away, but receive more frequent alerts as you approach your destination.

## Customizing Settings

1. **Open Settings**
   - Tap the orange "Settings" button on the home screen

2. **Adjust Alert Distances**
   - Set the initial alert distance
   - The app will automatically adjust the graduated thresholds proportionally

3. **Sound and Background Options**
   - Enable/disable sound notifications
   - Toggle background tracking (requires additional permissions)

4. **Save Settings**
   - Tap "Save Settings" to apply your changes

## How Alerts Work

- As you approach your destination, the app will:
  - Display notifications at graduated intervals (more frequent as you get closer)
  - Play a sound alert with each notification
  - Show the distance to your destination in real-time
  - Change the status color on the home screen to green when very close

## Tips for Best Experience

- Keep the app running in the foreground for most reliable tracking
- Enable background tracking for continuous monitoring
- Make sure your device's location services are set to "High Accuracy" mode
- Keep your device charged, as constant location tracking uses more battery
- If traveling internationally, ensure you have data connectivity for maps

## Troubleshooting

- **No Location Data**: Go to your device settings and ensure location permissions are granted
- **No Alerts**: Check notification permissions and sound settings
- **Map Not Loading**: Verify internet connectivity
- **Inaccurate Location**: Wait a moment for GPS to improve accuracy, or move to an area with better GPS reception
- **Search Not Working**: The app includes a limited mock search database. Try searching for major cities (e.g., "New York", "Los Angeles")

For additional help, contact the app developer.

## Notification System

The app uses a graduated notification system to alert you as you approach your destination:

1. **Initial Alerts**: Starting at 10km from your destination, you'll receive notifications every 500m.
2. **Medium Distance Alerts**: Within 2km of your destination, you'll receive more frequent notifications (every 200m).
3. **Close Proximity Alerts**: Within 1km of your destination, you'll receive notifications every 100m.
4. **Continuous Alarm**: When you reach your specified alarm distance, a continuous alarm sound will play until you stop it or move outside the alarm zone.

## Customizing Alert Settings

You can customize the distance at which alerts begin and the alarm settings:

1. Tap on "Settings" from the home screen.
2. Under "Alert Settings", you can:
   - Adjust the initial alert distance (default is 10km)
   - This changes when you start receiving notifications
3. Under "Continuous Alarm Settings", you can:
   - Enable or disable the alarm feature
   - Set the distance at which the continuous alarm should sound (e.g., 0.5km)
4. Tap "Save Settings" to apply your changes.

## Using the Alarm Feature

The continuous alarm feature provides an audible alert when you're very close to your destination:

1. **Enable the Alarm**: Go to Settings and toggle on "Enable Continuous Alarm".
2. **Set Alarm Distance**: Enter the distance (in kilometers) at which you want the alarm to sound.
3. **Approaching Destination**: When you reach the specified distance, a loud, continuous alarm will sound.
4. **Stopping the Alarm**: You can stop the alarm by:
   - Tapping the "STOP ALARM" button that appears on the home screen
   - Moving outside the alarm distance zone
   - Disabling the alarm feature in Settings

## Map Display

The map on the home screen displays:
- Your current location (blue pin)
- Your destination (orange pin)
- Alert zones (colored circles):
  - Blue circle: Initial alert zone (10km by default)
  - Yellow circle: Medium distance zone (2km)
  - Green circle: Close proximity zone (1km)
  - Red circle: Alarm zone (your custom setting) 