import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors, FontSize } from '../constants/theme';

interface LoadingProps {
  message?: string;
}

export default function Loading({ message }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 12,
  },
});
