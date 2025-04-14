// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Use more performant sourcemap format for Android
config.transformer.minifierConfig = {
  compress: {
    drop_console: true, // Remove console.log statements
  },
};

// Added resolver for resolving module conflicts
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config; 