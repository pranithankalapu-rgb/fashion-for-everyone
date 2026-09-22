import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import type { UserProfile } from '../types/fashion';

import StyleProfileModal, { StyleCategory } from '../components/StyleProfileModal';

const SKIN_TONE_SWATCH_MAP: Record<string, string> = {
  'very fair': '#FCEFE6',
  fair: '#F5D7C2',
  light: '#E6B998',
  medium: '#C98C5D',
  tan: '#A46338',
  deep: '#6E3C22',
  'very deep': '#3D2012',
  'warm golden': '#C98C5D',
  'cool rose': '#E8A5B8',
  'deep rich': '#6E3C22',
  'olive neutral': '#A89F68',
  'fair porcelain': '#FCEFE6',
};

const UNDERTONE_SWATCH_MAP: Record<string, string> = {
  warm: '#E8A87C',
  cool: '#E8A5B8',
  neutral: '#D7BAA2',
  olive: '#A89F68',
};

function getSkinToneSwatch(tone?: string) {
  if (!tone) return undefined;
  return SKIN_TONE_SWATCH_MAP[tone.toLowerCase().trim()];
}

function getUndertoneSwatch(tone?: string) {
  if (!tone) return undefined;
  return UNDERTONE_SWATCH_MAP[tone.toLowerCase().trim()];
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, role, logout, switchRole, isAuthenticated, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Style Profile Modal state
  const [activeModalCategory, setActiveModalCategory] = useState<StyleCategory | null>(null);
  const [isSavingStyle, setIsSavingStyle] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        api.getProfile().then(setProfile).catch(() => {});
      } else {
        setProfile(null);
      }
    }, [isAuthenticated])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setProfile(null);
          await logout();
          (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const displayProfile = isAuthenticated ? (profile || user) : null;

  const handleSaveStyleOption = async (category: StyleCategory, value: string) => {
    setIsSavingStyle(true);
    try {
      const updated = await api.updateProfile({ [category]: value });
      setProfile(updated);
      updateUser({ [category]: value });
      setActiveModalCategory(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not save your selection. Please try again.';
      Alert.alert('Save Failed', msg);
    } finally {
      setIsSavingStyle(false);
    }
  };

  const menuItems = [
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
    { icon: 'receipt-outline', label: 'My Orders', screen: 'Orders' },
    { icon: 'heart-outline', label: 'Wishlist', screen: 'Wishlist' },
    { icon: 'cart-outline', label: 'Cart', screen: 'Cart' },
    { icon: 'color-palette-outline', label: 'Color Voting', screen: 'ColorVoting' },
    { icon: 'brush-outline', label: 'Designer Showcase', screen: 'DesignerShowcase' },
    { icon: 'videocam-outline', label: 'Style Feed', screen: 'SocialFeed' },
  ];

  if (role === 'designer') {
    menuItems.push({ icon: 'brush-outline', label: 'Designer Studio & Upload', screen: 'DesignerShowcase' });
  }

  if (role === 'retailer') {
    menuItems.push({ icon: 'storefront-outline', label: 'Retailer Dashboard', screen: 'RetailerDashboard' });
  }

  const roles: Array<{ key: 'customer' | 'designer' | 'retailer'; label: string; icon: string }> = [
    { key: 'customer', label: 'Customer', icon: '🛍️' },
    { key: 'designer', label: 'Designer', icon: '🎨' },
    { key: 'retailer', label: 'Retailer', icon: '🏪' },
  ];

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.lg : 60;
  const gradientTop = isDark ? '#1a103d' : '#e0e7ff';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <LinearGradient
        colors={[gradientTop, colors.background]}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            uri={displayProfile?.avatar}
            name={displayProfile?.name}
            size={96}
            borderColor={colors.primary}
            borderWidth={3}
            showCameraBadge
            onPress={() => navigation.navigate('ChangeProfilePicture')}
            accessibilityLabel="Change profile picture"
          />
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{displayProfile?.name || 'Guest User'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{displayProfile?.email || 'Not signed in'}</Text>
        {displayProfile?.role && (
          <View style={[styles.roleBadge, { backgroundColor: colors.primaryFaded }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>{displayProfile.role.toUpperCase()}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Role Switcher */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Switch Role</Text>
        <View style={styles.roleRow}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.roleBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                role === r.key && { borderColor: colors.primary, backgroundColor: colors.primaryFaded },
              ]}
              onPress={() => switchRole(r.key)}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text
                style={[
                  styles.roleLabel,
                  { color: colors.textMuted },
                  role === r.key && { color: colors.primary, fontWeight: FontWeight.bold },
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Style Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Style Profile</Text>
          <Text style={[styles.sectionSubtitleHint, { color: colors.primary }]}>Tap to edit ✦</Text>
        </View>
        <View style={styles.infoGrid}>
          <InfoTile
            icon="body-outline"
            label="Body Shape"
            value={displayProfile?.bodyShape || 'Hourglass'}
            colors={colors}
            onPress={() => setActiveModalCategory('bodyShape')}
          />
          <InfoTile
            icon="color-fill-outline"
            label="Skin Tone"
            value={displayProfile?.skinTone || 'Warm Golden'}
            swatch={getSkinToneSwatch(displayProfile?.skinTone)}
            colors={colors}
            onPress={() => setActiveModalCategory('skinTone')}
          />
          <InfoTile
            icon="water-outline"
            label="Undertone"
            value={displayProfile?.undertone || 'Warm'}
            swatch={getUndertoneSwatch(displayProfile?.undertone)}
            colors={colors}
            onPress={() => setActiveModalCategory('undertone')}
          />
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Links</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen + item.label}
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon as any} size={22} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Auth action */}
      <View style={styles.section}>
        {isAuthenticated ? (
          <Button title="Sign Out" variant="outline" onPress={handleLogout} fullWidth />
        ) : (
          <Button title="Sign In or Register" onPress={() => navigation.navigate('Login')} fullWidth />
        )}
      </View>
      <View style={{ height: 100 }} />

      {/* Style Profile Selection Modal */}
      <StyleProfileModal
        visible={activeModalCategory !== null}
        category={activeModalCategory}
        currentValue={
          activeModalCategory === 'bodyShape'
            ? displayProfile?.bodyShape || 'Hourglass'
            : activeModalCategory === 'skinTone'
            ? displayProfile?.skinTone || 'Medium'
            : activeModalCategory === 'undertone'
            ? displayProfile?.undertone || 'Warm'
            : ''
        }
        isLoading={isSavingStyle}
        onClose={() => setActiveModalCategory(null)}
        onSave={handleSaveStyleOption}
      />
    </ScrollView>
  );
}

function InfoTile({
  icon,
  label,
  value,
  swatch,
  colors,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  swatch?: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[tileStyles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label}, currently ${value}`}
    >
      <View style={tileStyles.topRow}>
        {swatch ? (
          <View style={[tileStyles.swatch, { backgroundColor: swatch, borderColor: colors.borderLight }]} />
        ) : (
          <Ionicons name={icon as any} size={20} color={colors.primary} />
        )}
        <View style={[tileStyles.editBadge, { backgroundColor: colors.primaryFaded }]}>
          <Ionicons name="pencil" size={10} color={colors.primary} />
        </View>
      </View>
      <Text style={[tileStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[tileStyles.value, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
    minWidth: 95,
    ...Shadows.sm,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  editBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: FontSize.xs, marginTop: 2 },
  value: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xxl },
  avatarContainer: { marginBottom: Spacing.md, position: 'relative' },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3 },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  email: { fontSize: FontSize.md, marginTop: 2 },
  roleBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  roleText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  sectionSubtitleHint: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  roleRow: { flexDirection: 'row', gap: Spacing.md },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  roleIcon: { fontSize: 20, marginBottom: 4 },
  roleLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  infoGrid: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  menuLabel: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium },
});
