import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, FontSize, FontWeight, Spacing, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { RetailProduct } from '../types/fashion';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

interface ProductCardProps {
  product: RetailProduct;
  onPress: () => void;
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
}

export default function ProductCard({ product, onPress, onWishlistToggle, isWishlisted }: ProductCardProps) {
  const { colors } = useTheme();
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imageUrl || 'https://via.placeholder.com/200' }}
          style={styles.image}
          resizeMode="cover"
        />
        {hasDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
        {onWishlistToggle && (
          <TouchableOpacity style={styles.wishlistBtn} onPress={onWishlistToggle}>
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={isWishlisted ? colors.accent : '#FFFFFF'}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.brand, { color: colors.textMuted }]}>{product.brand}</Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>${product.price.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
              ${product.originalPrice!.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.25,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  wishlistBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.md,
  },
  brand: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  originalPrice: {
    fontSize: FontSize.sm,
    textDecorationLine: 'line-through',
  },
});
