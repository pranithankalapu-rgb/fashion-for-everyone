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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';
import Loading from '../components/Loading';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import type { OutfitLook } from '../types/fashion';

export default function SocialFeedScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [looks, setLooks] = useState<OutfitLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const data = await api.getSocialFeed();
      setLooks(data);
    } catch {
      setLooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeed(); }, []);

  const handleLike = async (id: string) => {
    try {
      const updated = await api.toggleLikeOutfitLook(id);
      setLooks((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  if (loading) return <Loading message="Loading feed..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <View style={styles.headerRow}>
          {navigation?.canGoBack?.() && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Style Feed ✨</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Community outfit inspiration</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={looks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 50 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No outfits yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            {/* Creator header */}
            <View style={styles.creatorRow}>
              <Image source={{ uri: item.creatorAvatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.creatorName, { color: colors.text }]}>{item.creatorName}</Text>
                <Text style={[styles.creatorHandle, { color: colors.textMuted }]}>@{item.creatorHandle}</Text>
              </View>
              <View style={[styles.occasionBadge, { backgroundColor: colors.primaryFaded }]}>
                <Text style={[styles.occasionText, { color: colors.primary }]}>{item.occasion}</Text>
              </View>
            </View>

            {/* Image */}
            <Image
              source={{ uri: item.videoThumbnail || 'https://via.placeholder.com/400x300' }}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Title & Actions */}
            <View style={styles.content}>
              <Text style={[styles.lookTitle, { color: colors.text }]}>{item.title}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
                  <Ionicons
                    name={item.userLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={item.userLiked ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.likes}</Text>
                </TouchableOpacity>
                <View style={styles.actionBtn}>
                  <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.reshares}</Text>
                </View>
              </View>

              {/* Tagged Products */}
              {item.taggedProducts?.length > 0 && (
                <View style={styles.taggedSection}>
                  <Text style={[styles.taggedLabel, { color: colors.textMuted }]}>Shop this look</Text>
                  <FlatList
                    data={item.taggedProducts}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(p) => p.id}
                    renderItem={({ item: prod }) => (
                      <TouchableOpacity
                        style={[styles.taggedProduct, { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 }]}
                        onPress={() => navigation.navigate('ProductDetail', { productId: prod.id })}
                      >
                        <Image source={{ uri: prod.imageUrl }} style={styles.taggedImage} />
                        <Text style={[styles.taggedTitle, { color: colors.text }]} numberOfLines={1}>{prod.title}</Text>
                        <Text style={[styles.taggedPrice, { color: colors.primary }]}>${prod.price.toFixed(0)}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>
        )}
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
  subtitle: { fontSize: FontSize.md, marginTop: 2 },
  card: {
    marginBottom: Spacing.md,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  creatorName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  creatorHandle: { fontSize: FontSize.sm },
  occasionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  occasionText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  image: { width: '100%', height: 300 },
  content: { padding: Spacing.md },
  lookTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  actions: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: FontSize.sm },
  taggedSection: { marginTop: Spacing.lg },
  taggedLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  taggedProduct: {
    width: 100,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  taggedImage: { width: '100%', height: 100 },
  taggedTitle: { fontSize: FontSize.xs, padding: 4 },
  taggedPrice: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, paddingHorizontal: 4, paddingBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
});
