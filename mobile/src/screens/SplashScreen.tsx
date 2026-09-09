import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function SplashScreen({ navigation }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <LinearGradient colors={[Colors.background, '#1a103d', Colors.background]} style={styles.container}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.accent]}
          style={styles.logoCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoIcon}>✦</Text>
        </LinearGradient>
        <Text style={styles.title}>Fashion</Text>
        <Text style={styles.subtitle}>for Everyone</Text>
      </View>
      <Text style={styles.tagline}>AI-Powered Style, Inclusive Fashion</Text>
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
    color: Colors.white,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
    color: Colors.primaryLight,
    marginTop: -4,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
});
