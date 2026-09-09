import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';
import { useCart } from '../hooks/useCart';

export default function CartScreen({ navigation }: any) {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptyText}>Add items to get started</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.browseBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart 🛒</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
          { text: 'Cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id + item.size}
        contentContainerStyle={{ padding: Spacing.lg }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.product.imageUrl || 'https://via.placeholder.com/80' }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.brand}>{item.product.brand}</Text>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.product.title}</Text>
              <Text style={styles.size}>Size: {item.size}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.price}>${(item.product.price * item.quantity).toFixed(2)}</Text>
                <View style={styles.qtyControl}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <Ionicons name="remove-circle-outline" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.product.id)}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Checkout bar */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.lg }}>
          <Button title="Checkout" onPress={() => navigation.navigate('Checkout')} size="lg" fullWidth />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  clearText: { color: Colors.error, fontSize: FontSize.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
    position: 'relative',
  },
  image: { width: 100, height: 120 },
  info: { flex: 1, padding: Spacing.md },
  brand: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase' },
  itemTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 2 },
  size: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  price: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qty: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold, minWidth: 20, textAlign: 'center' },
  removeBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  totalPrice: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  emptyContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm },
  browseBtn: {
    marginTop: Spacing.xxl,
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  browseBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
