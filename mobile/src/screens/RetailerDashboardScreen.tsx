import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { RetailProduct, CustomerOrder, RetailerCustomer } from '../types/fashion';

export default function RetailerDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { role } = useAuth();
  const isRetailer = role === 'retailer' || role === 'admin';

  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview');

  const loadData = async () => {
    try {
      const [prods, ords, custs] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getOrders().catch(() => []),
        api.getRetailerCustomers().catch(() => []),
      ]);
      setProducts(prods);
      setOrders(ords);
      setCustomers(custs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateStock = async (product: RetailProduct, delta: number) => {
    const current = product.stockQuantity || 0;
    const nextVal = Math.max(0, current + delta);
    try {
      const updated = await api.updateProductStock(product.id, nextVal);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stockQuantity: updated.stockQuantity } : p))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update product stock');
    }
  };

  const handleUpdateOrderStatus = async (order: CustomerOrder) => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = statuses.indexOf(order.status);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];
    try {
      const updated = await api.updateOrderStatus(order.id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update order status');
    }
  };

  if (loading) return <Loading message="Loading dashboard..." />;

  const paddingTop = insets.top > 0 ? insets.top + Spacing.md : 60;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const lowStockProducts = products.filter((p) => (p.stockQuantity || 0) < 10).length;

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: 'grid-outline' },
    { key: 'products' as const, label: 'Products', icon: 'cube-outline' },
    { key: 'orders' as const, label: 'Orders', icon: 'receipt-outline' },
    { key: 'customers' as const, label: 'Customers', icon: 'people-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#1a103d', colors.background] : ['#EEF2FF', colors.background]} style={[styles.header, { paddingTop }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Retailer Dashboard 🏪</Text>
        </View>

        {isRetailer && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, { backgroundColor: colors.surface }, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
              >
                <Ionicons name={t.icon as any} size={16} color={tab === t.key ? colors.primary : colors.textMuted} />
                <Text style={[styles.tabLabel, { color: colors.textMuted }, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      {!isRetailer ? (
        <View style={styles.guardContainer}>
          <Ionicons name="shield-outline" size={64} color={colors.warning} />
          <Text style={[styles.guardTitle, { color: colors.text }]}>Retailer Access Required</Text>
          <Text style={[styles.guardSubtitle, { color: colors.textSecondary }]}>
            This dashboard is reserved for retailers to manage store inventory, stock quantities, and customer orders.
          </Text>
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.switchRoleBtnText}>Sign In as Retailer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.goBackBtnText, { color: colors.textMuted }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {tab === 'overview' && (
            <View style={styles.content}>
              <View style={styles.statsRow}>
                <StatCard label="Revenue" value={`$${totalRevenue.toFixed(0)}`} icon="cash-outline" color={Colors.success} />
                <StatCard label="Orders" value={String(orders.length)} icon="receipt-outline" color={Colors.primary} />
              </View>
              <View style={styles.statsRow}>
                <StatCard label="Products" value={String(products.length)} icon="cube-outline" color={Colors.info} />
                <StatCard label="Pending" value={String(pendingOrders)} icon="time-outline" color={Colors.warning} />
              </View>
              {lowStockProducts > 0 && (
                <View style={styles.alertCard}>
                  <Ionicons name="warning" size={20} color={Colors.warning} />
                  <Text style={styles.alertText}>{lowStockProducts} product(s) with low stock (&lt;10 items)</Text>
                </View>
              )}
            </View>
          )}

          {tab === 'products' && (
            <FlatList
              data={products}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.content}
              renderItem={({ item }) => (
                <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.listSub, { color: colors.textMuted }]}>{item.brand} · ${item.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.stockControl}>
                    <TouchableOpacity
                      style={styles.stockBtn}
                      onPress={() => handleUpdateStock(item, -1)}
                    >
                      <Ionicons name="remove" size={16} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={[styles.stockBadge, { backgroundColor: colors.surfaceLight }, (item.stockQuantity || 0) < 10 && { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.stockText, { color: colors.text }, (item.stockQuantity || 0) < 10 && { color: colors.warning }]}>
                        {item.stockQuantity ?? '0'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.stockBtn}
                      onPress={() => handleUpdateStock(item, 1)}
                    >
                      <Ionicons name="add" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {tab === 'orders' && (
            <FlatList
              data={orders}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.content}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.listCard, { backgroundColor: colors.surface }]}
                  activeOpacity={0.8}
                  onPress={() => handleUpdateOrderStatus(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>#{item.orderNumber}</Text>
                    <Text style={[styles.listSub, { color: colors.textMuted }]}>{item.customerName} · {item.items.length} items</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.statusText, { color: item.status === 'Delivered' ? colors.success : colors.warning }]}>
                      {item.status}
                    </Text>
                    <Text style={[styles.tapToChange, { color: colors.textMuted }]}>Tap to advance</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {tab === 'customers' && (
            <FlatList
              data={customers}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.content}
              renderItem={({ item }) => (
                <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.listSub, { color: colors.textMuted }]}>{item.email} · {item.ordersCount} orders</Text>
                  </View>
                  <Text style={[styles.custSpent, { color: colors.primary }]}>${item.totalSpent.toFixed(0)}</Text>
                </View>
              )}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[statStyles.card, { backgroundColor: colors.surface }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  value: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.sm },
  label: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  tabBar: { marginTop: Spacing.md },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  tabBtnActive: { backgroundColor: Colors.primaryFaded },
  tabLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  tabLabelActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  content: { padding: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  alertText: { color: Colors.warning, fontSize: FontSize.sm },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  listTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  listSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  stockControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm },
  stockText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tapToChange: { color: Colors.textMuted, fontSize: 10 },
  custSpent: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  guardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  guardTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.lg },
  guardSubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  switchRoleBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  switchRoleBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  goBackBtn: { marginTop: Spacing.md, padding: Spacing.sm },
  goBackBtnText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
