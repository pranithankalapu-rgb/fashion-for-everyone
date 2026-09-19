import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function LoginScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { login, register, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'designer' | 'retailer'>('customer');

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        await register(name.trim(), email.trim(), password, selectedRole);
      } else {
        if (!email.trim() || !password.trim()) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        await login(email.trim(), password, selectedRole);
      }
      navigation.replace('Main');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Authentication failed');
    }
  };

  const roles = [
    { key: 'customer' as const, label: 'Customer', icon: '🛍️' },
    { key: 'designer' as const, label: 'Designer', icon: '🎨' },
    { key: 'retailer' as const, label: 'Retailer', icon: '🏪' },
  ];

  const gradientBottom = isDark ? '#1a103d' : '#e0e7ff';

  return (
    <LinearGradient colors={[colors.background, gradientBottom]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isRegister ? 'Join the fashion community' : 'Sign in to continue'}
            </Text>
          </View>

          {/* Role Selector */}
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.roleBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedRole === role.key && { borderColor: colors.primary, backgroundColor: colors.primaryFaded },
                ]}
                onPress={() => setSelectedRole(role.key)}
              >
                <Text style={styles.roleIcon}>{role.icon}</Text>
                <Text
                  style={[
                    styles.roleLabel,
                    { color: colors.textMuted },
                    selectedRole === role.key && { color: colors.primary, fontWeight: FontWeight.bold },
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isRegister && (
              <Input
                label="Full Name"
                icon="person-outline"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              icon="lock-closed-outline"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button
              title={isRegister ? 'Create Account' : 'Sign In'}
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(!isRegister)}>
            <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={[styles.toggleLink, { color: colors.primary }]}>{isRegister ? 'Sign In' : 'Register'}</Text>
            </Text>
          </TouchableOpacity>

          {/* Skip for dev */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Main')}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Continue as Guest →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
  },
  subtitle: {
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  roleIcon: { fontSize: 22, marginBottom: 4 },
  roleLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  form: { gap: 0 },
  toggleBtn: { alignItems: 'center', marginTop: Spacing.xl },
  toggleText: { fontSize: FontSize.md },
  toggleLink: { fontWeight: FontWeight.semibold },
  skipBtn: { alignItems: 'center', marginTop: Spacing.xxl },
  skipText: { fontSize: FontSize.sm },
});
