import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';

export default function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: Math.max(insets.top + 10, 50), backgroundColor: colors.background }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.emptyBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Ionicons name="cart-outline" size={80} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Cart is Empty</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add items to get started</Text>
        <TouchableOpacity
          style={[styles.browseBtn, { backgroundColor: colors.primaryFaded }]}
          onPress={() => navigation.navigate('Main', { screen: 'Explore' })}
        >
          <Text style={[styles.browseBtnText, { color: colors.primary }]}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <View style={styles.headerLeft}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.text }]}>Cart 🛒</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
          { text: 'Cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={[styles.clearText, { color: colors.error }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id + item.size}
        contentContainerStyle={{ padding: Spacing.lg }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <Image source={{ uri: item.product.imageUrl || 'https://via.placeholder.com/80' }} style={styles.image} />
            <View style={styles.info}>
              <Text style={[styles.brand, { color: colors.textMuted }]}>{item.product.brand}</Text>
              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.product.title}</Text>
              <Text style={[styles.size, { color: colors.textSecondary }]}>Size: {item.size}</Text>
              <View style={styles.bottomRow}>
                <Text style={[styles.price, { color: colors.primary }]}>${(item.product.price * item.quantity).toFixed(2)}</Text>
                <View style={styles.qtyControl}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <Ionicons name="remove-circle-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={[styles.qty, { color: colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.product.id)}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Checkout bar */}
      <View style={[styles.checkoutBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) + Spacing.md }]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: colors.text }]}>${totalPrice.toFixed(2)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.lg }}>
          <Button title="Checkout" onPress={() => navigation.navigate('Checkout')} size="lg" fullWidth />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: Spacing.md, padding: 4 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  clearText: { fontSize: FontSize.sm },
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
    position: 'relative',
  },
  image: { width: 100, height: 120 },
  info: { flex: 1, padding: Spacing.md },
  brand: { fontSize: FontSize.xs, textTransform: 'uppercase' },
  itemTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 2 },
  size: { fontSize: FontSize.xs, marginTop: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  price: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qty: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, minWidth: 20, textAlign: 'center' },
  removeBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: FontSize.sm },
  totalPrice: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, position: 'relative' },
  emptyBackBtn: { position: 'absolute', top: 50, left: Spacing.lg, padding: 8 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.sm },
  browseBtn: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  browseBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
