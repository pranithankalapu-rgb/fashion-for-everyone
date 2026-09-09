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
import type { OutfitLook } from '../types/fashion';

export default function SocialFeedScreen({ navigation }: any) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Style Feed ✨</Text>
        <Text style={styles.subtitle}>Community outfit inspiration</Text>
      </View>

      <FlatList
        data={looks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No outfits yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Creator header */}
            <View style={styles.creatorRow}>
              <Image source={{ uri: item.creatorAvatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorName}>{item.creatorName}</Text>
                <Text style={styles.creatorHandle}>@{item.creatorHandle}</Text>
              </View>
              <View style={styles.occasionBadge}>
                <Text style={styles.occasionText}>{item.occasion}</Text>
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
              <Text style={styles.lookTitle}>{item.title}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
                  <Ionicons
                    name={item.userLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={item.userLiked ? Colors.accent : Colors.textSecondary}
                  />
                  <Text style={styles.actionText}>{item.likes}</Text>
                </TouchableOpacity>
                <View style={styles.actionBtn}>
                  <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
                  <Text style={styles.actionText}>{item.reshares}</Text>
                </View>
              </View>

              {/* Tagged Products */}
              {item.taggedProducts?.length > 0 && (
                <View style={styles.taggedSection}>
                  <Text style={styles.taggedLabel}>Shop this look</Text>
                  <FlatList
                    data={item.taggedProducts}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(p) => p.id}
                    renderItem={({ item: prod }) => (
                      <TouchableOpacity
                        style={styles.taggedProduct}
                        onPress={() => navigation.navigate('ProductDetail', { productId: prod.id })}
                      >
                        <Image source={{ uri: prod.imageUrl }} style={styles.taggedImage} />
                        <Text style={styles.taggedTitle} numberOfLines={1}>{prod.title}</Text>
                        <Text style={styles.taggedPrice}>${prod.price.toFixed(0)}</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  creatorName: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  creatorHandle: { color: Colors.textMuted, fontSize: FontSize.sm },
  occasionBadge: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  occasionText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  image: { width: '100%', height: 300 },
  content: { padding: Spacing.md },
  lookTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  actions: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  taggedSection: { marginTop: Spacing.lg },
  taggedLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  taggedProduct: {
    width: 100,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  taggedImage: { width: '100%', height: 100 },
  taggedTitle: { color: Colors.text, fontSize: FontSize.xs, padding: 4 },
  taggedPrice: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, paddingHorizontal: 4, paddingBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
});
