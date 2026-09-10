import { Platform } from 'react-native';

// API base URL configuration
// Android emulator uses 10.0.2.2 to reach host machine's localhost
// Physical device should use the computer's LAN IP
// In production, use the deployed backend URL

function getDefaultApiUrl(): string {
  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:5000/api'
      : 'http://localhost:5000/api';
  }
  // Production URL — deployed backend API
  return 'https://fashion-for-everyone-backend.onrender.com/api';
}

// Expo env variable takes precedence if set
export const API_BASE_URL: string =
  (process.env.EXPO_PUBLIC_API_URL as string) || getDefaultApiUrl();

export const APP_NAME = 'Fashion For Everyone';

export const OCCASIONS = [
  'Work',
  'Casual',
  'Date night',
  'Formal',
  'Athletic',
  'Party',
  'Travel',
] as const;

export const STYLE_VIBES = [
  'Classic',
  'Streetwear',
  'Minimalist',
  'Bold',
  'Boho',
  'Smart casual',
] as const;
