import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { resolveMediaUrl, getInitials } from '../utils/media';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  cacheBust?: boolean | string | number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  showCameraBadge?: boolean;
  showSelectedBadge?: boolean;
  badgeColor?: string;
  accessibilityLabel?: string;
}

export default function Avatar({
  uri,
  name,
  size = 48,
  borderColor,
  borderWidth = 0,
  cacheBust,
  style,
  onPress,
  showCameraBadge = false,
  showSelectedBadge = false,
  badgeColor,
  accessibilityLabel,
}: AvatarProps) {
  const { colors } = useTheme();
  const [loadError, setLoadError] = useState(false);

  const resolvedUri = resolveMediaUrl(uri, cacheBust);
  const hasValidUri = Boolean(resolvedUri && !loadError);

  const borderRadius = size / 2;
  const badgeSize = Math.max(20, Math.round(size * 0.28));
  const badgeRadius = badgeSize / 2;
  const iconSize = Math.round(size * 0.48);
  const fontSize = Math.round(size * 0.38);

  const content = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.surfaceLight,
          borderColor: borderColor || colors.border,
          borderWidth,
        },
        style,
      ]}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel || (name ? `${name}'s avatar` : 'User profile picture')}
    >
      {hasValidUri ? (
        <Image
          source={{ uri: resolvedUri }}
          style={[styles.image, { borderRadius }]}
          contentFit="cover"
          transition={150}
          cachePolicy="disk"
          onError={() => {
            setLoadError(true);
          }}
          onLoad={() => {
            if (loadError) setLoadError(false);
          }}
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius, backgroundColor: colors.surfaceLight }]}>
          {name ? (
            <Text style={[styles.initials, { fontSize, color: colors.textSecondary }]}>
              {getInitials(name)}
            </Text>
          ) : (
            <Ionicons name="person" size={iconSize} color={colors.textMuted} />
          )}
        </View>
      )}

      {showCameraBadge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeRadius,
              backgroundColor: badgeColor || colors.primary,
              borderColor: colors.surface,
            },
          ]}
        >
          <Ionicons name="camera" size={Math.round(badgeSize * 0.58)} color="#FFFFFF" />
        </View>
      )}

      {showSelectedBadge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeRadius,
              backgroundColor: badgeColor || colors.accent,
              borderColor: colors.surface,
            },
          ]}
        >
          <Ionicons name="checkmark" size={Math.round(badgeSize * 0.65)} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
