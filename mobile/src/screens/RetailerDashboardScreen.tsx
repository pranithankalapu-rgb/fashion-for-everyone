import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Loading from '../components/Loading';
import api from '../services/api';
import type { RetailProduct, CustomerOrder, RetailerCustomer } from '../types/fashion';

export default function RetailerDashboardScreen({ navigation }: any) {
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

  if (loading) return <Loading message="Loading dashboard..." />;

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
    <View style={styles.container}>
      <LinearGradient colors={['#1a103d', Colors.background]} style={styles.header}>
        <Text style={styles.title}>Retailer Dashboard 🏪</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon as any} size={16} color={tab === t.key ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
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
                <Text style={styles.alertText}>{lowStockProducts} product(s) with low stock</Text>
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
              <View style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listSub}>{item.brand} · ${item.price.toFixed(2)}</Text>
                </View>
                <View style={[styles.stockBadge, (item.stockQuantity || 0) < 10 && { backgroundColor: Colors.warning + '20' }]}>
                  <Text style={[styles.stockText, (item.stockQuantity || 0) < 10 && { color: Colors.warning }]}>
                    {item.stockQuantity ?? '—'} in stock
                  </Text>
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
              <View style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>#{item.orderNumber}</Text>
                  <Text style={styles.listSub}>{item.customerName} · {item.items.length} items</Text>
                </View>
                <Text style={[styles.statusText, { color: item.status === 'Delivered' ? Colors.success : Colors.warning }]}>
                  {item.status}
                </Text>
              </View>
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
              <View style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.name}</Text>
                  <Text style={styles.listSub}>{item.email} · {item.ordersCount} orders</Text>
                </View>
                <Text style={styles.custSpent}>${item.totalSpent.toFixed(0)}</Text>
              </View>
            )}
          />
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
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
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
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
  tabLabelActive: { color: Colors.primary },
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
  stockBadge: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  stockText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  custSpent: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
