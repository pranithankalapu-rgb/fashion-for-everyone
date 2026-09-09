import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function CheckoutScreen({ navigation }: any) {
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
        { text: 'Continue Shopping', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Checkout</Text>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.product.id + item.size} style={styles.summaryItem}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {item.product.title} × {item.quantity}
              </Text>
              <Text style={styles.summaryPrice}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <Input label="Full Name *" icon="person-outline" value={name} onChangeText={setName} />
          <Input label="Email *" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Shipping Address *" icon="location-outline" value={address} onChangeText={setAddress} multiline numberOfLines={3} />
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOption}>
            <View style={styles.radioActive} />
            <Text style={styles.paymentText}>Cash on Delivery</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingTop: 20 },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.xxl },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: Spacing.lg },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryName: { color: Colors.textSecondary, fontSize: FontSize.md, flex: 1, marginRight: Spacing.md },
  summaryPrice: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  totalLabel: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  totalValue: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  radioActive: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  paymentText: { color: Colors.text, fontSize: FontSize.md },
});
