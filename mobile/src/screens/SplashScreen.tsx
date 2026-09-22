import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontSize, FontWeight } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function SplashScreen({ navigation }: any) {
  const { isAuthenticated, role } = useAuth();
  const { colors, isDark } = useTheme();

  const authStateRef = useRef({ isAuthenticated, role });
  authStateRef.current = { isAuthenticated, role };

  useEffect(() => {
    const timer = setTimeout(() => {
      const { isAuthenticated: isAuth, role: currentRole } = authStateRef.current;
      if (isAuth) {
        if (currentRole === 'retailer') {
          navigation.replace('RetailerDashboard');
        } else if (currentRole === 'designer') {
          navigation.replace('DesignerShowcase');
        } else {
          navigation.replace('Main');
        }
      } else {
        navigation.replace('Login');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const gradientMid = isDark ? '#1a103d' : '#e0e7ff';

  return (
    <LinearGradient colors={[colors.background, gradientMid, colors.background]} style={styles.container}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={styles.logoCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoIcon}>✦</Text>
        </LinearGradient>
        <Text style={[styles.title, { color: colors.text }]}>Fashion</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>for Everyone</Text>
      </View>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>AI-Powered Style, Inclusive Fashion</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 36,
    color: '#FFFFFF',
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  tagline: {
    fontSize: FontSize.md,
  },
});
