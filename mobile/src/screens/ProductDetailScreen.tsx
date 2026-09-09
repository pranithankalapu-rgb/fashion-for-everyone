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
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';
import Loading from '../components/Loading';
import api from '../services/api';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import type { RetailProduct } from '../types/fashion';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/400' }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => toggleWishlist(product)}
          >
            <Ionicons
              name={isWishlisted(product.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isWishlisted(product.id) ? Colors.accent : Colors.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Colors</Text>
              <View style={styles.colorRow}>
                {product.colors.map((color, i) => (
                  <View key={i} style={[styles.colorDot, { backgroundColor: color }]} />
                ))}
              </View>
            </View>
          )}

          {/* Sizes */}
          {product.sizes?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Size</Text>
              <View style={styles.sizeRow}>
                {product.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizePill, selectedSize === size && styles.sizePillActive]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="shirt-outline" size={18} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{product.category}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="body-outline" size={18} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Silhouette</Text>
              <Text style={styles.infoValue}>{product.silhouette}</Text>
            </View>
            {product.stockQuantity !== undefined && (
              <View style={styles.infoItem}>
                <Ionicons name="cube-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>Stock</Text>
                <Text style={[styles.infoValue, product.stockQuantity < 5 && { color: Colors.warning }]}>
                  {product.stockQuantity} left
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cartIconBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Button title="Add to Cart" onPress={handleAddToCart} size="lg" fullWidth />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  imageContainer: { width, height: width * 1.1, position: 'relative' },
  image: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    top: 50,
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
    top: 50,
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
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  price: { color: Colors.primary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  originalPrice: { color: Colors.textMuted, fontSize: FontSize.lg, textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  discountText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.lg, lineHeight: 22 },
  section: { marginTop: Spacing.xl },
  sectionLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', gap: Spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border },
  sizeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  sizePill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sizePillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  sizeText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  sizeTextActive: { color: Colors.primary },
  infoGrid: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xxl, flexWrap: 'wrap' },
  infoItem: {
    flex: 1,
    minWidth: 90,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  infoValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartIconBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
