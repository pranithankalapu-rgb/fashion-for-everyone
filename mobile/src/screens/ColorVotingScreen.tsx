import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Loading from '../components/Loading';
import api from '../services/api';
import type { ColorCombo } from '../types/fashion';
import { OCCASIONS } from '../constants/config';

export default function ColorVotingScreen() {
  const [combos, setCombos] = useState<ColorCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCombos = async () => {
    try {
      const data = await api.getColorCombos(occasion === 'All' ? undefined : occasion);
      setCombos(data);
    } catch {
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCombos(); }, [occasion]);

  const handleVote = async (id: string, direction: 'up' | 'down') => {
    try {
      const updated = await api.voteColorCombo(id, direction);
      setCombos((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCombos();
    setRefreshing(false);
  };

  if (loading) return <Loading message="Loading color combos..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Color Voting 🎨</Text>
        <Text style={styles.subtitle}>Vote on the best color combinations</Text>
      </View>

      {/* Filter */}
      <FlatList
        data={['All', ...OCCASIONS]}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, occasion === item && styles.pillActive]}
            onPress={() => setOccasion(item)}
          >
            <Text style={[styles.pillText, occasion === item && styles.pillTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={combos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="color-palette-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No color combinations found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.occasion}</Text>
              </View>
            </View>
            <View style={styles.colorRow}>
              {item.colors.map((c, i) => (
                <View key={i} style={styles.colorItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: c.hex }]} />
                  <Text style={styles.colorName}>{c.name}</Text>
                </View>
              ))}
            </View>
            <View style={styles.voteRow}>
              <TouchableOpacity style={styles.voteBtn} onPress={() => handleVote(item.id, 'up')}>
                <Ionicons name="arrow-up-circle" size={28} color={Colors.success} />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{item.votesCount}</Text>
              <TouchableOpacity style={styles.voteBtn} onPress={() => handleVote(item.id, 'down')}>
                <Ionicons name="arrow-down-circle" size={28} color={Colors.error} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
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
  filterList: { maxHeight: 44, marginTop: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  pillText: { color: Colors.textMuted, fontSize: FontSize.sm },
  pillTextActive: { color: Colors.primary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, flex: 1 },
  badge: { backgroundColor: Colors.primaryFaded, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  colorRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  colorItem: { alignItems: 'center' },
  colorSwatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.border, marginBottom: 4 },
  colorName: { color: Colors.textMuted, fontSize: FontSize.xs },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  voteBtn: { padding: 4 },
  voteCount: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, minWidth: 30, textAlign: 'center' },
  rating: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
});
