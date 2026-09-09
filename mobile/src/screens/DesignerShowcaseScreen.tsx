import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Loading from '../components/Loading';
import api from '../services/api';
import type { Designer, Design } from '../types/fashion';

export default function DesignerShowcaseScreen() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'designers' | 'designs'>('designers');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [d, des] = await Promise.all([
        api.getDesigners().catch(() => []),
        api.getDesigns().catch(() => []),
      ]);
      setDesigners(d);
      setDesigns(des);
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

  const handleVote = async (id: string, rating: number) => {
    try {
      const updated = await api.voteDesign(id, rating);
      setDesigns((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch {}
  };

  if (loading) return <Loading message="Loading designers..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Designer Showcase 🎨</Text>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'designers' && styles.tabActive]} onPress={() => setTab('designers')}>
            <Text style={[styles.tabText, tab === 'designers' && styles.tabTextActive]}>Designers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'designs' && styles.tabActive]} onPress={() => setTab('designs')}>
            <Text style={[styles.tabText, tab === 'designs' && styles.tabTextActive]}>Designs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'designers' ? (
        <FlatList
          data={designers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.designerCard}>
              <Image source={{ uri: item.avatar }} style={styles.designerAvatar} />
              <View style={styles.designerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.designerName}>{item.name}</Text>
                  {item.verified && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                </View>
                <Text style={styles.designerHandle}>@{item.handle}</Text>
                <Text style={styles.designerBio} numberOfLines={2}>{item.bio}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.followers}</Text>
                    <Text style={styles.statLabel}>followers</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.statValue}>{item.avgRating.toFixed(1)}</Text>
                  </View>
                  {item.badges.map((badge, i) => (
                    <View key={i} style={styles.badgePill}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={designs}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg }}
          columnWrapperStyle={{ gap: Spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.designCard}>
              <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }} style={styles.designImage} />
              <View style={styles.designInfo}>
                <Text style={styles.designTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.designDesigner}>{item.designerName}</Text>
                <View style={styles.designBottom}>
                  <Text style={styles.designPrice}>${item.price.toFixed(0)}</Text>
                  <TouchableOpacity onPress={() => handleVote(item.id, 5)} style={styles.miniVoteBtn}>
                    <Ionicons name="star" size={14} color={Colors.warning} />
                    <Text style={styles.miniVoteText}>{item.rating.toFixed(1)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primaryFaded },
  tabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary },
  designerCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  designerAvatar: { width: 60, height: 60, borderRadius: 30 },
  designerInfo: { flex: 1, marginLeft: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  designerName: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  designerHandle: { color: Colors.textMuted, fontSize: FontSize.sm },
  designerBio: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4, lineHeight: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  badgePill: { backgroundColor: Colors.primaryFaded, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: Colors.primary, fontSize: FontSize.xs },
  designCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  designImage: { width: '100%', height: 180 },
  designInfo: { padding: Spacing.sm },
  designTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  designDesigner: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  designBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  designPrice: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  miniVoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  miniVoteText: { color: Colors.warning, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});
