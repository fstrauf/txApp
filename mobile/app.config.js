export default {
  name: 'TX App',
  slug: 'tx-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.txapp',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.yourcompany.txapp',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || (
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000'
        : 'https://tx-app.vercel.app/api'
    ),
    eas: {
      projectId: "your-project-id"
    }
  },
  plugins: [
    'expo-secure-store',
  ],
}; 