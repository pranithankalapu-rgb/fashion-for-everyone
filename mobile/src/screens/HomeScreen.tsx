import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { RetailProduct, OutfitLook } from '../types/fashion';

export default function HomeScreen({ navigation }: any) {
  const { user, role } = useAuth();
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [socialFeed, setSocialFeed] = useState<OutfitLook[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [prods, feed] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getSocialFeed().catch(() => []),
      ]);
      setProducts(prods.slice(0, 6));
      setSocialFeed(feed.slice(0, 4));
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const quickActions = [
    { icon: 'sparkles', label: 'AI Stylist', screen: 'AiStylist', color: Colors.primary },
    { icon: 'color-palette', label: 'Colors', screen: 'ColorVoting', color: Colors.accent },
    { icon: 'brush', label: 'Designers', screen: 'DesignerShowcase', color: '#4ADE80' },
    { icon: 'people', label: 'Social', screen: 'SocialFeed', color: '#FBBF24' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={['#1a103d', Colors.background]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello{user?.name ? `, ${user.name}` : ''}! 👋</Text>
            <Text style={styles.headerSubtitle}>Discover your perfect style</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={36} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Explore')}
        >
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search products, brands...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate(action.screen)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trending Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now 🔥</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={products}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.trendingCard}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            >
              <Image
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                style={styles.trendingImage}
              />
              <Text style={styles.trendingBrand}>{item.brand}</Text>
              <Text style={styles.trendingTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.trendingPrice}>${item.price.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Social Feed Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Style Feed ✨</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SocialFeed')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {socialFeed.map((look) => (
          <View key={look.id} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <Image source={{ uri: look.creatorAvatar }} style={styles.feedAvatar} />
              <View>
                <Text style={styles.feedCreator}>{look.creatorName}</Text>
                <Text style={styles.feedHandle}>@{look.creatorHandle}</Text>
              </View>
            </View>
            <Image
              source={{ uri: look.videoThumbnail || 'https://via.placeholder.com/400x200' }}
              style={styles.feedImage}
            />
            <Text style={styles.feedTitle}>{look.title}</Text>
            <View style={styles.feedActions}>
              <View style={styles.feedStat}>
                <Ionicons name="heart" size={16} color={Colors.accent} />
                <Text style={styles.feedStatText}>{look.likes}</Text>
              </View>
              <View style={styles.feedStat}>
                <Ionicons name="share-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.feedStatText}>{look.reshares}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Retailer Banner */}
      {role === 'retailer' && (
        <TouchableOpacity
          style={styles.retailerBanner}
          onPress={() => navigation.navigate('RetailerDashboard')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retailerBannerGradient}
          >
            <Ionicons name="storefront" size={28} color={Colors.white} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.retailerBannerTitle}>Retailer Dashboard</Text>
              <Text style={styles.retailerBannerSub}>Manage products, orders & customers</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerSubtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  notifBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: { color: Colors.textMuted, fontSize: FontSize.md },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  quickActionBtn: { flex: 1, alignItems: 'center' },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  section: { marginTop: Spacing.xxxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  seeAll: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  trendingCard: {
    width: 150,
    marginRight: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  trendingImage: { width: '100%', height: 180 },
  trendingBrand: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    textTransform: 'uppercase',
  },
  trendingTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    paddingHorizontal: Spacing.sm,
    marginTop: 2,
  },
  trendingPrice: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    marginTop: 4,
  },
  feedCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  feedAvatar: { width: 36, height: 36, borderRadius: 18 },
  feedCreator: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  feedHandle: { color: Colors.textMuted, fontSize: FontSize.xs },
  feedImage: { width: '100%', height: 200 },
  feedTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    padding: Spacing.md,
  },
  feedActions: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.xl },
  feedStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedStatText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  retailerBanner: { marginHorizontal: Spacing.lg, marginTop: Spacing.xxxl },
  retailerBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  retailerBannerTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  retailerBannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm },
});
