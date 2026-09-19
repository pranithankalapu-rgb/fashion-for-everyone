import { Platform } from 'react-native';

// API base URL configuration
// Deployed production Render backend API

// Deployed production Render backend API
export const PRODUCTION_API_URL = 'https://fashion-for-everyone-backend.onrender.com/api';
// Reliable edge proxy fallback for networks/ISPs with Render DNS issues
export const FALLBACK_API_URL = 'https://fashion-for-everyone.vercel.app/api';

function getDefaultApiUrl(): string {
  // Production URL — deployed backend API
  return PRODUCTION_API_URL;
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
