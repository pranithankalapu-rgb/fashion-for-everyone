import React, { useState, useEffect, useRef } from 'react';
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

  // Step management: 'input' | 'verify'
  const [step, setStep] = useState<'input' | 'verify'>('input');

  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.sm : Spacing.lg;

  // -------------------------------------------------------------
  // Step 1: Request Mobile Verification Code
  // -------------------------------------------------------------
  const handleRequestCode = async () => {
    setError(null);
    setInfoMessage(null);
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
      const res = await api.requestMobileVerification(trimmed);
      setStep('verify');
      setCooldown(res.resendCooldown || 60);
      setInfoMessage(`A 6-digit verification code was sent to ${trimmed}.`);
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'Failed to request verification code. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Resend Code
  // -------------------------------------------------------------
  const handleResendCode = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setInfoMessage(null);
    setResending(true);

    const trimmed = newPhone.trim();
    try {
      const res = await api.requestMobileVerification(trimmed);
      setCooldown(res.resendCooldown || 60);
      setInfoMessage('A new verification code has been dispatched.');
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'Failed to resend verification code. Please try again.';
      setError(message);
    } finally {
      setResending(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2: Verify Code and Update Mobile Number
  // -------------------------------------------------------------
  const handleVerifyAndUpdate = async () => {
    setError(null);
    setInfoMessage(null);
    const trimmedCode = otpCode.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    const trimmedPhone = newPhone.trim();

    try {
      const res = await api.verifyAndUpdateMobile(trimmedPhone, trimmedCode);
      updateUser({ phone: res.phone });
      await refreshUser().catch(() => {});

      Alert.alert(
        'Mobile Number Updated! 🎉',
        `Your contact number has been successfully updated to ${res.phone}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'Verification failed. Please check the code and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => {
            if (step === 'verify') {
              setStep('input');
              setError(null);
              setInfoMessage(null);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {step === 'input' ? 'Set Phone Number' : 'Verify Mobile'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + Spacing.xxxl },
        ]}
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

        {/* STEP 1: Enter New Phone */}
        {step === 'input' && (
          <View>
            <View style={styles.inputSection}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Enter your updated mobile number. A one-time verification code will be sent to confirm your number before updating your profile.
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
                Your contact details are encrypted and used for order dispatch, pickup reservations, and delivery coordination.
              </Text>
            </View>

            {/* Action Button */}
            <View style={styles.actionContainer}>
              <Button
                title={loading ? 'Sending Code...' : 'Send Verification Code'}
                onPress={handleRequestCode}
                loading={loading}
                disabled={loading || !newPhone.trim()}
                fullWidth
              />
            </View>
          </View>
        )}

        {/* STEP 2: Verify Code */}
        {step === 'verify' && (
          <View>
            <View style={[styles.infoBanner, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <View style={styles.infoBannerHeader}>
                <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoBannerTitle, { color: colors.text }]}>Code Sent</Text>
              </View>
              <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
                We sent a 6-digit verification code to{' '}
                <Text style={{ fontWeight: FontWeight.bold, color: colors.text }}>{newPhone}</Text>.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setStep('input');
                  setError(null);
                  setInfoMessage(null);
                }}
                style={styles.editTargetButton}
              >
                <Text style={[styles.editTargetText, { color: colors.primary }]}>Change phone number</Text>
              </TouchableOpacity>
            </View>

            {infoMessage && (
              <View style={[styles.messageBanner, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.messageText, { color: colors.text }]}>{infoMessage}</Text>
              </View>
            )}

            <View style={styles.inputSection}>
              <Input
                label="Enter 6-Digit Verification Code"
                icon="key-outline"
                value={otpCode}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setOtpCode(filtered);
                  if (error) setError(null);
                }}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                error={error || undefined}
              />

              {/* Resend Cooldown Section */}
              <View style={styles.resendContainer}>
                {cooldown > 0 ? (
                  <Text style={[styles.cooldownText, { color: colors.textMuted }]}>
                    Resend code in <Text style={{ fontWeight: FontWeight.bold }}>{cooldown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resending}
                    style={styles.resendButton}
                  >
                    <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                    <Text style={[styles.resendButtonText, { color: colors.primary }]}>
                      {resending ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Action Button */}
            <View style={styles.actionContainer}>
              <Button
                title={loading ? 'Verifying...' : 'Verify & Update Phone Number'}
                onPress={handleVerifyAndUpdate}
                loading={loading}
                disabled={loading || otpCode.trim().length !== 6}
                fullWidth
              />
            </View>
          </View>
        )}
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
  infoBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  infoBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  infoBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  infoBannerText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  editTargetButton: {
    marginTop: Spacing.sm,
  },
  editTargetText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  messageText: {
    fontSize: FontSize.xs,
    flex: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  cooldownText: {
    fontSize: FontSize.xs,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendButtonText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});
