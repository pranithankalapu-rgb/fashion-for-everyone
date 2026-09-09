import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';

export default function WishlistScreen({ navigation }: any) {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={80} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
        <Text style={styles.emptyText}>Save items you love to find them later</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.browseBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist ❤️</Text>
        <Text style={styles.subtitle}>{items.length} items saved</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.brand}>{item.brand}</Text>
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.addCartBtn}
                  onPress={() => {
                    addToCart(item, item.sizes?.[0] || 'M');
                    navigation.navigate('Cart');
                  }}
                >
                  <Ionicons name="cart-outline" size={16} color={Colors.white} />
                  <Text style={styles.addCartText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => toggleWishlist(item)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  image: { width: 110, height: 140 },
  info: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  brand: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase' },
  itemTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 2 },
  price: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addCartText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  removeBtn: { padding: Spacing.xs },
  emptyContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
  browseBtn: {
    marginTop: Spacing.xxl,
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  browseBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
