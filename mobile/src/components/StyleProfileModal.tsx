import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadows,
} from '../constants/theme';
import Button from './Button';

export type StyleCategory = 'bodyShape' | 'skinTone' | 'undertone';

export interface StyleOptionItem {
  value: string;
  label: string;
  subtitle?: string;
  swatch?: string;
  iconName?: string;
}

export const BODY_SHAPE_OPTIONS: StyleOptionItem[] = [
  {
    value: 'Hourglass',
    label: 'Hourglass',
    subtitle: 'Balanced bust and hips with a clearly defined waistline',
    iconName: 'hourglass-outline',
  },
  {
    value: 'Pear (Triangle)',
    label: 'Pear (Triangle)',
    subtitle: 'Hips and thighs broader than shoulders with a tapered waist',
    iconName: 'triangle-outline',
  },
  {
    value: 'Apple (Oval)',
    label: 'Apple (Oval)',
    subtitle: 'Weight concentrated around midsection with softer curves',
    iconName: 'ellipse-outline',
  },
  {
    value: 'Rectangle (Straight)',
    label: 'Rectangle (Straight)',
    subtitle: 'Uniform width across shoulders, waist, and hips; athletic silhouette',
    iconName: 'square-outline',
  },
  {
    value: 'Inverted Triangle',
    label: 'Inverted Triangle',
    subtitle: 'Broad shoulders and bust tapering to narrower hips and legs',
    iconName: 'caret-down-outline',
  },
];

export const SKIN_TONE_OPTIONS: StyleOptionItem[] = [
  {
    value: 'Very Fair',
    label: 'Very Fair',
    subtitle: 'Porcelain or alabaster complexion; burns very easily in the sun',
    swatch: '#FCEFE6',
  },
  {
    value: 'Fair',
    label: 'Fair',
    subtitle: 'Light complexion with subtle ivory or peach undertones',
    swatch: '#F5D7C2',
  },
  {
    value: 'Light',
    label: 'Light',
    subtitle: 'Light-to-medium complexion that tans gradually',
    swatch: '#E6B998',
  },
  {
    value: 'Medium',
    label: 'Medium',
    subtitle: 'Natural honey or golden-beige complexion that tans easily',
    swatch: '#C98C5D',
  },
  {
    value: 'Tan',
    label: 'Tan',
    subtitle: 'Rich bronze or caramel complexion with warm radiance',
    swatch: '#A46338',
  },
  {
    value: 'Deep',
    label: 'Deep',
    subtitle: 'Warm or cool espresso complexion with rich natural pigment',
    swatch: '#6E3C22',
  },
  {
    value: 'Very Deep',
    label: 'Very Deep',
    subtitle: 'Deepest ebony or chocolate complexion with lustrous depth',
    swatch: '#3D2012',
  },
];

export const UNDERTONE_OPTIONS: StyleOptionItem[] = [
  {
    value: 'Warm',
    label: 'Warm',
    subtitle: 'Peachy, golden, or yellow undertones • Flattered by gold jewelry & earth tones',
    swatch: '#E8A87C',
    iconName: 'sunny-outline',
  },
  {
    value: 'Cool',
    label: 'Cool',
    subtitle: 'Pink, red, or bluish undertones • Flattered by silver jewelry & jewel tones',
    swatch: '#E8A5B8',
    iconName: 'snow-outline',
  },
  {
    value: 'Neutral',
    label: 'Neutral',
    subtitle: 'Balanced warm and cool undertones • Versatile with both gold & silver metals',
    swatch: '#D7BAA2',
    iconName: 'color-filter-outline',
  },
  {
    value: 'Olive',
    label: 'Olive',
    subtitle: 'Subtle greenish or greyish hue • Stunning with bronze, cream & terracotta',
    swatch: '#A89F68',
    iconName: 'leaf-outline',
  },
];

interface StyleProfileModalProps {
  visible: boolean;
  category: StyleCategory | null;
  currentValue: string;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (category: StyleCategory, value: string) => Promise<void>;
}

export default function StyleProfileModal({
  visible,
  category,
  currentValue,
  isLoading = false,
  onClose,
  onSave,
}: StyleProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Helper to map saved legacy or variant strings to current options
  const matchOptionValue = (options: StyleOptionItem[], val: string | undefined): string => {
    if (!val) return options[0]?.value || '';
    const exact = options.find((o) => o.value.toLowerCase() === val.toLowerCase());
    if (exact) return exact.value;

    // Fuzzy matching for legacy values (e.g., "Rectangle" -> "Rectangle (Straight)", "Warm Golden" -> "Medium")
    const simplified = val.toLowerCase().replace(/[^a-z]/g, '');
    const partial = options.find((o) => {
      const optSimplified = o.label.toLowerCase().replace(/[^a-z]/g, '');
      return optSimplified.includes(simplified) || simplified.includes(optSimplified);
    });
    return partial ? partial.value : options[0]?.value || '';
  };

  const [selectedValue, setSelectedValue] = useState<string>('');

  const getCategoryDetails = () => {
    switch (category) {
      case 'bodyShape':
        return {
          title: 'Select Body Shape',
          subtitle: 'Choose the silhouette that best represents your natural body proportions.',
          icon: 'body-outline',
          options: BODY_SHAPE_OPTIONS,
        };
      case 'skinTone':
        return {
          title: 'Select Skin Tone',
          subtitle: 'Select your skin shade for tailored color palettes and outfit contrast.',
          icon: 'color-fill-outline',
          options: SKIN_TONE_OPTIONS,
        };
      case 'undertone':
        return {
          title: 'Select Undertone',
          subtitle: 'Identify your skin undertone to optimize jewelry and clothing harmony.',
          icon: 'water-outline',
          options: UNDERTONE_OPTIONS,
        };
      default:
        return {
          title: 'Select Style Profile',
          subtitle: '',
          icon: 'sparkles-outline',
          options: [],
        };
    }
  };

  const { title, subtitle, icon, options } = getCategoryDetails();

  // Reset selected value when modal opens or category/currentValue changes
  useEffect(() => {
    if (visible && category) {
      const matched = matchOptionValue(options, currentValue);
      setSelectedValue(matched);
    }
  }, [visible, category, currentValue]);

  if (!category) return null;

  const handleSave = async () => {
    if (!selectedValue || isLoading) return;
    await onSave(category, selectedValue);
  };

  const bottomInset = Math.max(insets.bottom, Spacing.lg);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => !isLoading && onClose()}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: bottomInset,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primaryFaded }]}>
                <Ionicons name={icon as any} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <ScrollView
            style={styles.optionsScrollView}
            contentContainerStyle={styles.optionsList}
            showsVerticalScrollIndicator={false}
          >
            {options.map((item) => {
              const isSelected = selectedValue === item.value;
              const isSavedOriginal = matchOptionValue(options, currentValue) === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected ? colors.primaryFaded : colors.surfaceElevated || colors.surfaceLight,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedValue(item.value)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  {/* Swatch or Icon Indicator */}
                  {item.swatch ? (
                    <View
                      style={[
                        styles.swatchCircle,
                        {
                          backgroundColor: item.swatch,
                          borderColor: isSelected ? colors.primary : colors.borderLight,
                        },
                      ]}
                    />
                  ) : item.iconName ? (
                    <View
                      style={[
                        styles.iconBadge,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.iconName as any}
                        size={18}
                        color={isSelected ? colors.white : colors.textMuted}
                      />
                    </View>
                  ) : null}

                  {/* Text details */}
                  <View style={styles.optionTextContainer}>
                    <View style={styles.labelRow}>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? colors.primaryLight : colors.text,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.medium,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSavedOriginal && (
                        <View style={[styles.savedTag, { backgroundColor: colors.primaryFaded }]}>
                          <Text style={[styles.savedTagText, { color: colors.primary }]}>
                            Current
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.subtitle ? (
                      <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.borderLight,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceLight,
                },
              ]}
              onPress={onClose}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Cancel selection"
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Button
                title={isLoading ? 'Saving...' : 'Save Selection'}
                onPress={handleSave}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheetContainer: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsScrollView: {
    paddingHorizontal: Spacing.xl,
  },
  optionsList: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  swatchCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    ...Shadows.sm,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionLabel: {
    fontSize: FontSize.md,
  },
  savedTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  savedTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  optionSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
    lineHeight: 15,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
