import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Loading from '../components/Loading';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import type { CustomerOrder } from '../types/fashion';

export default function OrdersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusColors: Record<string, string> = {
    Pending: colors.warning,
    Processing: colors.info,
    Shipped: colors.primary,
    Delivered: colors.success,
    Cancelled: colors.error,
    Returned: colors.textMuted,
  };

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <View style={styles.headerRow}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.text }]}>My Orders 📦</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 50 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = statusColors[item.status] || colors.textMuted;
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.orderNum, { color: colors.text }]}>#{item.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={[styles.date, { color: colors.textMuted }]}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={[styles.itemCount, { color: colors.textSecondary }]}>{item.items.length} item{item.items.length !== 1 ? 's' : ''}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.total, { color: colors.primary }]}>{item.currency} ${item.totalAmount.toFixed(2)}</Text>
                {item.trackingNumber && (
                  <Text style={[styles.tracking, { color: colors.textMuted }]}>Tracking: {item.trackingNumber}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: Spacing.md, padding: 4 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  date: { fontSize: FontSize.sm, marginTop: 4 },
  itemCount: { fontSize: FontSize.sm, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  total: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  tracking: { fontSize: FontSize.xs },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
});
