import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadows } from '../constants/theme';
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
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imageUrl || 'https://via.placeholder.com/200' }}
          style={styles.image}
          resizeMode="cover"
        />
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
        {onWishlistToggle && (
          <TouchableOpacity style={styles.wishlistBtn} onPress={onWishlistToggle}>
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={isWishlisted ? Colors.accent : Colors.white}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>${product.originalPrice!.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    color: Colors.white,
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
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.text,
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
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  originalPrice: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textDecorationLine: 'line-through',
  },
});
