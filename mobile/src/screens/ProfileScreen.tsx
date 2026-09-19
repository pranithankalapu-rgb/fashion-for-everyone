import React, { useEffect, useState } from 'react';
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
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import type { UserProfile } from '../types/fashion';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, role, logout, switchRole, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.getProfile().then(setProfile).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const displayProfile = profile || user;

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
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('ChangeProfilePicture')}
          activeOpacity={0.8}
        >
          {displayProfile?.avatar ? (
            <Image source={{ uri: displayProfile.avatar }} style={[styles.avatar, { borderColor: colors.primary }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={40} color={colors.textMuted} />
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

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

      {/* Body shape & skin info */}
      {displayProfile?.bodyShape && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Style Profile</Text>
          <View style={styles.infoGrid}>
            <InfoTile icon="body-outline" label="Body Shape" value={displayProfile.bodyShape} colors={colors} />
            <InfoTile icon="color-fill-outline" label="Skin Tone" value={displayProfile.skinTone} colors={colors} />
            <InfoTile icon="water-outline" label="Undertone" value={displayProfile.undertone} colors={colors} />
          </View>
        </View>
      )}

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
    </ScrollView>
  );
}

function InfoTile({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={[tileStyles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <Text style={[tileStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[tileStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
    ...Shadows.sm,
  },
  label: { fontSize: FontSize.xs },
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
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.md },
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
