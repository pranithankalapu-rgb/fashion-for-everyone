import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function CheckoutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');

  const handlePlaceOrder = async () => {
    if (!name || !email || !address) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add items to your cart first');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone || '',
        shippingAddress: address,
        paymentMethod: 'COD',
        items: items.map((i) => ({
          productId: i.product.id,
          title: i.product.title,
          brand: i.product.brand,
          imageUrl: i.product.imageUrl,
          price: i.product.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
      };
      await api.createOrder(orderData);
      clearCart();
      Alert.alert('Order Placed! 🎉', 'Your order has been placed successfully.', [
        { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
        { text: 'Continue Shopping', onPress: () => navigation.navigate('Main', { screen: 'Home' }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + 10, 44), paddingBottom: 60 + insets.bottom }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.text }]}>Checkout</Text>
        </View>

        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.product.id + item.size} style={styles.summaryItem}>
              <Text style={[styles.summaryName, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.product.title} × {item.quantity}
              </Text>
              <Text style={[styles.summaryPrice, { color: colors.text }]}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Shipping Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Information</Text>
          <Input label="Full Name *" icon="person-outline" value={name} onChangeText={setName} />
          <Input label="Email *" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Shipping Address *" icon="location-outline" value={address} onChangeText={setAddress} multiline numberOfLines={3} />
        </View>

        {/* Payment */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.paymentOption}>
            <View style={[styles.radioActive, { borderColor: colors.primary, backgroundColor: colors.primaryFaded }]} />
            <Text style={[styles.paymentText, { color: colors.text }]}>Cash on Delivery</Text>
          </View>
        </View>

        <Button
          title={loading ? 'Placing Order...' : `Place Order — $${totalPrice.toFixed(2)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.xl }}
        />
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  backBtn: { marginRight: Spacing.md, padding: 4 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: Spacing.lg },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryName: { fontSize: FontSize.md, flex: 1, marginRight: Spacing.md },
  summaryPrice: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  divider: { height: 1, marginVertical: Spacing.md },
  totalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  totalValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  radioActive: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  paymentText: { fontSize: FontSize.md },
});
