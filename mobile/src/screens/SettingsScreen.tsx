import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, themeMode } = useTheme();
  const { user } = useAuth();

  const themeLabel =
    themeMode === 'system'
      ? 'System Default'
      : themeMode === 'light'
      ? 'Light'
      : 'Dark';

  const themeIcon =
    themeMode === 'system'
      ? 'phone-portrait-outline'
      : themeMode === 'light'
      ? 'sunny-outline'
      : 'moon-outline';

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.sm : Spacing.lg;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Mini Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="person" size={28} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {user?.name || 'Fashion Member'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email || 'No email associated'}
            </Text>
          </View>
        </View>

        {/* ACCOUNT SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
          <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Change Profile Picture */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('ChangeProfilePicture')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryFaded }]}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Change Profile Picture</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  Update avatar or pick a photo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Change Email */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('ChangeEmail')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryFaded }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Change Email</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {user?.email || 'Set your email address'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Change Mobile Number */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('ChangeMobile')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryFaded }]}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Change Mobile Number</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {user?.phone || 'Not set'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
          <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Theme */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('ThemeSettings')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryFaded }]}>
                <Ionicons name={themeIcon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  Light, Dark, System Default
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{themeLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  userEmail: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  cardGroup: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  rowSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 38 + Spacing.md,
  },
});
