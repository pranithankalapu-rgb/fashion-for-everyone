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
import type { UserRole } from '../types/fashion';

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
      let authResult: { user: any; role: UserRole };
      if (isRegister) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        authResult = await register(name.trim(), email.trim().toLowerCase(), password, selectedRole);
      } else {
        if (!email.trim() || !password.trim()) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        authResult = await login(email.trim().toLowerCase(), password);
      }

      // Role-Specific Redirect
      const userRole = authResult.role;
      if (userRole === 'retailer') {
        navigation.replace('RetailerDashboard');
      } else if (userRole === 'designer') {
        navigation.replace('DesignerShowcase');
      } else {
        navigation.replace('Main');
      }
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Invalid credentials. Please try again.');
    }
  };

  const roles = [
    { key: 'customer' as const, label: 'Customer', icon: '🛍️', subtitle: 'Style & Shop' },
    { key: 'designer' as const, label: 'Designer', icon: '🎨', subtitle: 'Studio & Creations' },
    { key: 'retailer' as const, label: 'Retailer', icon: '🏪', subtitle: 'Store & Inventory' },
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
            <Text style={[styles.title, { color: colors.text }]}>
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isRegister ? 'Select your role and join the community' : 'Sign in to access your role dashboard'}
            </Text>
          </View>

          {/* Role Selector (Prominent in Register Mode) */}
          {isRegister && (
            <View style={styles.roleSection}>
              <Text style={[styles.roleSectionTitle, { color: colors.textSecondary }]}>
                Register as:
              </Text>
              <View style={styles.roleContainer}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.key}
                    style={[
                      styles.roleBtn,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      selectedRole === role.key && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryFaded,
                      },
                    ]}
                    onPress={() => setSelectedRole(role.key)}
                  >
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                    <Text
                      style={[
                        styles.roleLabel,
                        { color: colors.textMuted },
                        selectedRole === role.key && {
                          color: colors.primary,
                          fontWeight: FontWeight.bold,
                        },
                      ]}
                    >
                      {role.label}
                    </Text>
                    <Text style={[styles.roleSub, { color: colors.textMuted }]}>
                      {role.subtitle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

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
              title={isRegister ? 'Complete Registration' : 'Sign In'}
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(!isRegister)}>
            <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={[styles.toggleLink, { color: colors.primary }]}>
                {isRegister ? 'Sign In' : 'Register as New Member'}
              </Text>
            </Text>
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
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  roleSection: {
    marginBottom: Spacing.xxl,
  },
  roleSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  roleIcon: { fontSize: 24, marginBottom: 4 },
  roleLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  roleSub: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  form: { gap: 0 },
  toggleBtn: { alignItems: 'center', marginTop: Spacing.xl },
  toggleText: { fontSize: FontSize.sm },
  toggleLink: { fontWeight: FontWeight.bold },
});
