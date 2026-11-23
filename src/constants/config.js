import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDevApiUrl = () => {
  // If running on Web
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const h = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      return `http://${h}:5000/api`;
    }
    return 'http://127.0.0.1:5000/api';
  }

  // If running on mobile via Expo Go
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000/api`;
  }

  return 'http://192.168.1.37:5000/api';
};

export const Config = {
  API_BASE_URL: getDevApiUrl(),
  APP_NAME: 'Paal-Note Dairy',
  APP_TAGLINE: 'Daily Milk Collection & Distribution System',
  APP_VERSION: '1.0.0',
  DEFAULT_CURRENCY: '₹',
};
