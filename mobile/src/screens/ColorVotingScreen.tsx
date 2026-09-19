import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Loading from '../components/Loading';
import api from '../services/api';
import type { ColorCombo } from '../types/fashion';
import { OCCASIONS } from '../constants/config';

function decodeHtml(str?: string) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export default function ColorVotingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [combos, setCombos] = useState<ColorCombo[]>([]);
  const [occasion, setOccasion] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (occ?: string) => {
    try {
      const data = await api.getColorCombos(occ === 'All' ? undefined : occ);
      setCombos(data);
    } catch {
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(occasion);
  }, [occasion]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(occasion);
    setRefreshing(false);
  };

  const handleSelectCombo = (combo: ColorCombo) => {
    navigation.navigate('AiStylist', {
      colorCombo: combo,
      occasion: combo.occasion,
    });
  };

  const handleVote = async (comboId: string, direction: 'up' | 'down') => {
    try {
      const updated = await api.voteColorCombo(comboId, direction);
      setCombos((prev) => prev.map((c) => (c.id === comboId ? updated : c)));
    } catch {
      // Optimistic update
      setCombos((prev) =>
        prev.map((c) =>
          c.id === comboId
            ? {
                ...c,
                votesCount: c.votesCount + (direction === 'up' ? 1 : -1),
                rating: Math.min(5, Math.max(1, c.rating + (direction === 'up' ? 0.1 : -0.1))),
              }
            : c
        )
      );
    }
  };

  if (loading) return <Loading message="Loading color combos..." />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <View style={styles.headerRow}>
          {navigation?.canGoBack?.() && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Color Voting 🎨</Text>
            <Text style={styles.subtitle}>Vote on the best color combinations</Text>
          </View>
        </View>
      </View>

      {/* Filter */}
      <FlatList
        data={['All', ...OCCASIONS]}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, occasion === item && styles.pillActive]}
            onPress={() => setOccasion(item)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.pillText, occasion === item && styles.pillTextActive]}
              numberOfLines={1}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={combos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 50 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="color-palette-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No color combinations found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleSelectCombo(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{decodeHtml(item.title)}</Text>
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
            </TouchableOpacity>

            <View style={styles.cardFooter}>
              <View style={styles.voteRow}>
                <TouchableOpacity
                  style={styles.voteBtn}
                  onPress={() => handleVote(item.id, 'up')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="arrow-up-circle" size={28} color={Colors.success} />
                </TouchableOpacity>
                <Text style={styles.voteCount}>{item.votesCount}</Text>
                <TouchableOpacity
                  style={styles.voteBtn}
                  onPress={() => handleVote(item.id, 'down')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="arrow-down-circle" size={28} color={Colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.styleHint}
                  onPress={() => handleSelectCombo(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.styleHintText}>AI Stylist</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
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
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: Spacing.md, padding: 4 },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  filterList: { height: 48, flexGrow: 0, marginTop: Spacing.xs, marginBottom: Spacing.xs },
  filterContent: { paddingHorizontal: Spacing.lg, alignItems: 'center', paddingRight: Spacing.xl },
  pill: {
    height: 36,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    marginRight: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primary,
  },
  pillText: {
    color: '#E0E0F0',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  pillTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  voteBtn: { padding: 4 },
  voteCount: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, minWidth: 26, textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  styleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  styleHintText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
});
