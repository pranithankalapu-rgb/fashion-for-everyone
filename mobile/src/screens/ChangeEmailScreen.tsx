import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, updateUser, refreshUser } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.sm : Spacing.lg;

  const handleSave = async () => {
    setError(null);
    const trimmed = newEmail.trim().toLowerCase();

    if (!trimmed) {
      setError('Please enter a new email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email format (e.g. name@example.com).');
      return;
    }

    if (trimmed === user?.email?.toLowerCase()) {
      setError('New email must be different from your current email.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateEmail(trimmed);
      updateUser({ email: res.email });
      await refreshUser().catch(() => {});

      Alert.alert(
        'Email Updated! 🎉',
        `Your account email has been successfully changed to ${res.email}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const message = err.message || 'Failed to update email. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Set Mail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Current Email Card */}
        <View style={[styles.currentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.currentIconBox, { backgroundColor: colors.primaryFaded }]}>
            <Ionicons name="mail" size={22} color={colors.primary} />
          </View>
          <View style={styles.currentTextContainer}>
            <Text style={[styles.currentLabel, { color: colors.textMuted }]}>Current Email Address</Text>
            <Text style={[styles.currentValue, { color: colors.text }]} numberOfLines={1}>
              {user?.email || 'No email registered'}
            </Text>
          </View>
        </View>

        {/* New Email Input Section */}
        <View style={styles.inputSection}>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Enter the new email address you would like to use for login, receipts, and order notifications.
          </Text>

          <Input
            label="New Email Address"
            icon="mail-outline"
            value={newEmail}
            onChangeText={(text) => {
              setNewEmail(text);
              if (error) setError(null);
            }}
            placeholder="e.g. sophia.laurent@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={error || undefined}
          />
        </View>

        {/* Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your email is securely stored and never shared with third parties. Updating your email immediately applies to all devices.
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title={loading ? 'Updating Email...' : 'Set Mail'}
            onPress={handleSave}
            loading={loading}
            disabled={loading || !newEmail.trim()}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xxl,
    ...Shadows.sm,
  },
  currentIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  currentTextContainer: {
    flex: 1,
  },
  currentLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  currentValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xxl,
  },
  securityText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});
