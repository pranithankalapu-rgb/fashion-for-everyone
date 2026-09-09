import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Loading from '../components/Loading';
import api from '../services/api';
import type { CustomerOrder } from '../types/fashion';

const STATUS_COLORS: Record<string, string> = {
  Pending: Colors.warning,
  Processing: Colors.info,
  Shipped: Colors.primary,
  Delivered: Colors.success,
  Cancelled: Colors.error,
  Returned: Colors.textMuted,
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) return <Loading message="Loading orders..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders 📦</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderNum}>#{item.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || Colors.textMuted) + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || Colors.textMuted }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.itemCount}>{item.items.length} item{item.items.length !== 1 ? 's' : ''}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.total}>{item.currency} ${item.totalAmount.toFixed(2)}</Text>
              {item.trackingNumber && (
                <Text style={styles.tracking}>Tracking: {item.trackingNumber}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  date: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
  itemCount: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  total: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  tracking: { color: Colors.textMuted, fontSize: FontSize.xs },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
});
