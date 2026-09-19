import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';

export default function WishlistScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const canGoBack = navigation.canGoBack();
  const paddingTop = insets.top > 0 ? insets.top + Spacing.md : 60;

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop, backgroundColor: colors.background }]}>
        {canGoBack && (
          <TouchableOpacity
            style={[styles.backBtnAbsolute, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Ionicons name="heart-outline" size={80} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Wishlist is Empty</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Save items you love to find them later</Text>
        <TouchableOpacity
          style={[styles.browseBtn, { backgroundColor: colors.primaryFaded }]}
          onPress={() => navigation.navigate('Explore')}
        >
          <Text style={[styles.browseBtnText, { color: colors.primary }]}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop }]}>
        {canGoBack && (
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Wishlist ❤️</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{items.length} items saved</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 + insets.bottom }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          >
            <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.info}>
              <Text style={[styles.brand, { color: colors.textMuted }]}>{item.brand}</Text>
              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.price, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.addCartBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    addToCart(item, item.sizes?.[0] || 'M');
                    navigation.navigate('Cart');
                  }}
                >
                  <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.addCartText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => toggleWishlist(item)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backBtnAbsolute: { position: 'absolute', top: 50, left: Spacing.lg, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.md, marginTop: 2 },
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  image: { width: 110, height: 140 },
  info: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  brand: { fontSize: FontSize.xs, textTransform: 'uppercase' },
  itemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 2 },
  price: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addCartText: { color: '#FFFFFF', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  removeBtn: { padding: Spacing.xs },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
  browseBtn: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  browseBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
