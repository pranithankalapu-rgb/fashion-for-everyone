import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme, type ThemeMode } from '../hooks/useTheme';

interface ThemeOption {
  key: ThemeMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function ThemeSettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, themeMode, resolvedTheme, setThemeMode } = useTheme();

  const options: ThemeOption[] = [
    {
      key: 'light',
      title: 'Light',
      subtitle: 'Force the entire app into bright, clean light appearance.',
      icon: 'sunny-outline',
      color: '#F59E0B',
    },
    {
      key: 'dark',
      title: 'Dark',
      subtitle: 'Force the entire app into deep obsidian night mode.',
      icon: 'moon-outline',
      color: colors.primary,
    },
    {
      key: 'system',
      title: 'System Default',
      subtitle: `Automatically follow your Android system appearance (${resolvedTheme === 'dark' ? 'currently Dark' : 'currently Light'}).`,
      icon: 'phone-portrait-outline',
      color: '#3B82F6',
    },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Theme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Choose your preferred app appearance. Your selection is automatically saved and remembered across reloads and logins.
        </Text>

        <View style={styles.optionsList}>
          {options.map((opt) => {
            const isSelected = themeMode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setThemeMode(opt.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceLight }]}>
                  <Ionicons name={opt.icon} size={24} color={opt.color} />
                </View>

                <View style={styles.optionInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>{opt.title}</Text>
                    {isSelected && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primaryFaded }]}>
                        <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                    {opt.subtitle}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: isSelected ? colors.primary : colors.textMuted },
                  ]}
                >
                  {isSelected && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Informational tip */}
        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            When set to System Default, the app seamlessly transitions between Light and Dark mode whenever Android toggles appearance (e.g. via system Dark Theme switch or schedule).
          </Text>
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
  description: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  optionsList: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  optionSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.xxl,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
