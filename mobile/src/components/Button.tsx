import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, fontSize: FontSize.sm },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, fontSize: FontSize.md },
    lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, fontSize: FontSize.lg },
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            {
              paddingVertical: sizeStyles[size].paddingVertical,
              paddingHorizontal: sizeStyles[size].paddingHorizontal,
            },
            Shadows.glow,
            disabled && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, ViewStyle> = {
    secondary: { backgroundColor: Colors.surfaceLight },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
    ghost: { backgroundColor: 'transparent' },
  };

  const variantTextColors: Record<string, string> = {
    secondary: Colors.text,
    outline: Colors.primary,
    ghost: Colors.primary,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyles[variant],
        {
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        },
        disabled && styles.disabled,
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantTextColors[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyles[size].fontSize, color: variantTextColors[variant] },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  text: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
