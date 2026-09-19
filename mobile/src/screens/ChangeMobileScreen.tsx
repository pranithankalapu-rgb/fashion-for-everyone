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

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

export default function ChangeMobileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, updateUser, refreshUser } = useAuth();

  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.sm : Spacing.lg;

  const handleSave = async () => {
    setError(null);
    const trimmed = newPhone.trim();

    if (!trimmed) {
      setError('Please enter a mobile phone number.');
      return;
    }

    if (!PHONE_REGEX.test(trimmed)) {
      setError('Please enter a valid phone number (7-15 digits, optional + prefix).');
      return;
    }

    if (trimmed === user?.phone?.trim()) {
      setError('New mobile number must be different from your current number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateMobile(trimmed);
      updateUser({ phone: res.phone });
      await refreshUser().catch(() => {});

      Alert.alert(
        'Mobile Number Updated! 🎉',
        `Your contact number has been updated to ${res.phone}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const message = err.message || 'Failed to update mobile number. Please try again.';
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Mobile Number</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Current Phone Card */}
        <View style={[styles.currentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.currentIconBox, { backgroundColor: colors.primaryFaded }]}>
            <Ionicons name="call" size={22} color={colors.primary} />
          </View>
          <View style={styles.currentTextContainer}>
            <Text style={[styles.currentLabel, { color: colors.textMuted }]}>Current Mobile Number</Text>
            <Text style={[styles.currentValue, { color: colors.text }]} numberOfLines={1}>
              {user?.phone || 'Not set'}
            </Text>
          </View>
        </View>

        {/* New Mobile Input Section */}
        <View style={styles.inputSection}>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Enter your updated mobile number for order dispatch alerts, in-store pickup reservations, and delivery coordination.
          </Text>

          <Input
            label="New Mobile Number"
            icon="call-outline"
            value={newPhone}
            onChangeText={(text) => {
              setNewPhone(text);
              if (error) setError(null);
            }}
            placeholder="e.g. +1 555-019-2834"
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            error={error || undefined}
          />
        </View>

        {/* Informative Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your phone number is encrypted and used exclusively for delivery notifications and store pickups.
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title={loading ? 'Updating Mobile...' : 'Save Mobile Number'}
            onPress={handleSave}
            loading={loading}
            disabled={loading || !newPhone.trim()}
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
