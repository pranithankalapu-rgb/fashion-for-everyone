import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Text } from 'react-native';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export default function Input({ label, icon, error, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceLight,
            borderColor: error ? colors.error : colors.border,
          },
          props.multiline && styles.containerMultiline,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.textMuted}
            style={[styles.icon, props.multiline && styles.iconMultiline]}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            props.multiline && styles.inputMultiline,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          textAlignVertical={props.multiline ? 'top' : 'center'}
          {...props}
        />
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  containerMultiline: {
    alignItems: 'flex-start',
    minHeight: 80,
  },
  icon: { marginRight: Spacing.sm },
  iconMultiline: {
    marginTop: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  inputMultiline: {
    minHeight: 60,
  },
  error: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
