import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import type { RetailProduct } from '../types/fashion';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { productId } = route.params;
  const [product, setProduct] = useState<RetailProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getProductById(productId);
        setProduct(data);
        if (data.sizes?.length) setSelectedSize(data.sizes[0]);
      } catch {
        Alert.alert('Error', 'Failed to load product');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (loading || !product) return <Loading />;

  const handleAddToCart = () => {
    if (!selectedSize) {
      Alert.alert('Select Size', 'Please select a size before adding to cart');
      return;
    }
    addToCart(product, selectedSize);
    Alert.alert('Added to Cart', `${product.title} (${selectedSize}) added to your cart!`);
  };

  const topInset = Math.max(insets.top + 8, 44);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/400' }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity style={[styles.backBtn, { top: topInset }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heartBtn, { top: topInset }]}
            onPress={() => toggleWishlist(product)}
          >
            <Ionicons
              name={isWishlisted(product.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isWishlisted(product.id) ? colors.accent : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <Text style={[styles.brand, { color: colors.textMuted }]}>{product.brand}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <Text style={[styles.originalPrice, { color: colors.textMuted }]}>${product.originalPrice.toFixed(2)}</Text>
                <View style={[styles.discountBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.discountText}>
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {product.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Colors</Text>
              <View style={styles.colorRow}>
                {product.colors.map((color, i) => (
                  <View key={i} style={[styles.colorDot, { backgroundColor: color, borderColor: colors.border }]} />
                ))}
              </View>
            </View>
          )}

          {/* Sizes */}
          {product.sizes?.length ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Size</Text>
              <View style={styles.sizeRow}>
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizePill,
                        {
                          backgroundColor: isSelected ? colors.primaryFaded : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedSize(size)}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          {
                            color: isSelected ? colors.primary : colors.textMuted,
                            fontWeight: isSelected ? FontWeight.semibold : FontWeight.medium,
                          },
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Info */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Ionicons name="shirt-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Category</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{product.category}</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Ionicons name="body-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Silhouette</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{product.silhouette}</Text>
            </View>
            {product.stockQuantity !== undefined && (
              <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="cube-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Stock</Text>
                <Text style={[styles.infoValue, { color: colors.text }, product.stockQuantity < 5 && { color: colors.warning }]}>
                  {product.stockQuantity} left
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.cartIconBtn, { backgroundColor: colors.primaryFaded }]}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Button title="Add to Cart" onPress={handleAddToCart} size="lg" fullWidth />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { width, height: width * 1.1, position: 'relative' },
  image: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { padding: Spacing.xl },
  brand: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  price: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  originalPrice: { fontSize: FontSize.lg, textDecorationLine: 'line-through' },
  discountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  discountText: { color: '#FFFFFF', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  description: { fontSize: FontSize.md, marginTop: Spacing.lg, lineHeight: 22 },
  section: { marginTop: Spacing.xl },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', gap: Spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  sizeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  sizePill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sizeText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  infoGrid: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xxl, flexWrap: 'wrap' },
  infoItem: {
    flex: 1,
    minWidth: 90,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: { fontSize: FontSize.xs },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  cartIconBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
