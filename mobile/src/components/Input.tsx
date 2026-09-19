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
      <View
        style={[
          styles.container,
          props.multiline && styles.containerMultiline,
          error ? styles.containerError : null,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={Colors.textMuted}
            style={[styles.icon, props.multiline && styles.iconMultiline]}
          />
        )}
        <TextInput
          style={[
            styles.input,
            props.multiline && styles.inputMultiline,
            style,
          ]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          textAlignVertical={props.multiline ? 'top' : 'center'}
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
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  inputMultiline: {
    minHeight: 60,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
