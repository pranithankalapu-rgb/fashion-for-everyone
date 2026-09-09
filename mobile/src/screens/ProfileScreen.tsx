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
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { UserProfile } from '../types/fashion';

export default function ProfileScreen({ navigation }: any) {
  const { user, role, logout, switchRole, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.getProfile().then(setProfile).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); navigation.replace('Login'); } },
    ]);
  };

  const displayProfile = profile || user;

  const menuItems = [
    { icon: 'receipt-outline', label: 'My Orders', screen: 'Orders' },
    { icon: 'heart-outline', label: 'Wishlist', screen: 'Wishlist' },
    { icon: 'cart-outline', label: 'Cart', screen: 'Cart' },
    { icon: 'color-palette-outline', label: 'Color Voting', screen: 'ColorVoting' },
    { icon: 'brush-outline', label: 'Designer Showcase', screen: 'DesignerShowcase' },
    { icon: 'people-outline', label: 'Social Feed', screen: 'SocialFeed' },
  ];

  if (role === 'retailer') {
    menuItems.push({ icon: 'storefront-outline', label: 'Retailer Dashboard', screen: 'RetailerDashboard' });
  }

  const roles: Array<{ key: 'customer' | 'designer' | 'retailer'; label: string; icon: string }> = [
    { key: 'customer', label: 'Customer', icon: '🛍️' },
    { key: 'designer', label: 'Designer', icon: '🎨' },
    { key: 'retailer', label: 'Retailer', icon: '🏪' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <LinearGradient colors={['#1a103d', Colors.background]} style={styles.header}>
        <View style={styles.avatarContainer}>
          {displayProfile?.avatar ? (
            <Image source={{ uri: displayProfile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={Colors.textMuted} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{displayProfile?.name || 'Guest User'}</Text>
        <Text style={styles.email}>{displayProfile?.email || 'Not signed in'}</Text>
        {displayProfile?.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{displayProfile.role.toUpperCase()}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Role Switcher */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Switch Role</Text>
        <View style={styles.roleRow}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
              onPress={() => switchRole(r.key)}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body shape & skin info */}
      {displayProfile?.bodyShape && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style Profile</Text>
          <View style={styles.infoGrid}>
            <InfoTile icon="body-outline" label="Body Shape" value={displayProfile.bodyShape} />
            <InfoTile icon="color-fill-outline" label="Skin Tone" value={displayProfile.skinTone} />
            <InfoTile icon="water-outline" label="Undertone" value={displayProfile.undertone} />
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon as any} size={22} color={Colors.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Button title="Sign Out" variant="outline" onPress={handleLogout} fullWidth />
        </View>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={tileStyles.tile}>
      <Ionicons name={icon as any} size={20} color={Colors.primary} />
      <Text style={tileStyles.label}>{label}</Text>
      <Text style={tileStyles.value}>{value}</Text>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
  },
  label: { color: Colors.textMuted, fontSize: FontSize.xs },
  value: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xxl },
  avatarContainer: { marginBottom: Spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.primary },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  email: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  roleBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  roleText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.md },
  roleRow: { flexDirection: 'row', gap: Spacing.md },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  roleIcon: { fontSize: 20, marginBottom: 4 },
  roleLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  roleLabelActive: { color: Colors.primary },
  infoGrid: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  menuLabel: { flex: 1, color: Colors.text, fontSize: FontSize.md },
});
