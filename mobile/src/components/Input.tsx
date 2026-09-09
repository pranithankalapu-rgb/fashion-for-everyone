import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Text } from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export default function Input({ label, icon, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.containerError : null]}>
        {icon && <Ionicons name={icon} size={20} color={Colors.textMuted} style={styles.icon} />}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.lg },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  containerError: {
    borderColor: Colors.error,
  },
  icon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
