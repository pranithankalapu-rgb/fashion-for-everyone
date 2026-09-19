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
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useWishlist } from '../hooks/useWishlist';
import api from '../services/api';
import type { RetailProduct, OutfitLook } from '../types/fashion';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear'];

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, role } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [socialFeed, setSocialFeed] = useState<OutfitLook[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [prods, feed] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getSocialFeed().catch(() => []),
      ]);
      setProducts(prods.slice(0, 12));
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
    { icon: 'sparkles', label: 'AI Stylist', screen: 'AiStylist', color: colors.primary },
    { icon: 'color-palette', label: 'Colors', screen: 'ColorVoting', color: colors.accent },
    { icon: 'brush', label: 'Designers', screen: 'DesignerShowcase', color: '#4ADE80' },
    { icon: 'videocam', label: 'Style Feed', screen: 'SocialFeed', color: '#FBBF24' },
  ];

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.lg : 60;
  const gradientTop = isDark ? '#1a103d' : '#e0e7ff';

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={[gradientTop, colors.background]} style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Hello{user?.name ? `, ${user.name}` : ''}! 👋</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Discover your perfect style</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Explore')}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search products, brands...</Text>
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
            <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Pills */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isActive ? colors.primaryFaded : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  if (cat !== 'All') {
                    navigation.navigate('Explore', { category: cat });
                  }
                }}
              >
                <Text
                  style={[
                    styles.catText,
                    {
                      color: isActive ? colors.primary : colors.textMuted,
                      fontWeight: isActive ? FontWeight.semibold : FontWeight.medium,
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Trending Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Now 🔥</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explore', { category: selectedCategory })}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.trendingCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            >
              <View style={styles.trendingImageContainer}>
                <Image
                  source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                  style={styles.trendingImage}
                />
                <TouchableOpacity
                  style={styles.trendingWishlistBtn}
                  onPress={() => toggleWishlist(item)}
                >
                  <Ionicons
                    name={isWishlisted(item.id) ? 'heart' : 'heart-outline'}
                    size={16}
                    color={isWishlisted(item.id) ? colors.accent : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
              <View style={{ padding: Spacing.sm }}>
                <Text style={[styles.trendingBrand, { color: colors.textMuted }]}>{item.brand}</Text>
                <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.trendingPrice, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Social Feed Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Style Feed ✨</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SocialFeed')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        {socialFeed.map((look) => (
          <View key={look.id} style={[styles.feedCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.feedHeader}>
              <Image source={{ uri: look.creatorAvatar }} style={styles.feedAvatar} />
              <View>
                <Text style={[styles.feedCreator, { color: colors.text }]}>{look.creatorName}</Text>
                <Text style={[styles.feedHandle, { color: colors.textMuted }]}>@{look.creatorHandle}</Text>
              </View>
            </View>
            <Image
              source={{ uri: look.videoThumbnail || 'https://via.placeholder.com/400x200' }}
              style={styles.feedImage}
            />
            <Text style={[styles.feedTitle, { color: colors.text }]}>{look.title}</Text>
            <View style={styles.feedActions}>
              <View style={styles.feedStat}>
                <Ionicons name="heart" size={16} color={colors.accent} />
                <Text style={[styles.feedStatText, { color: colors.textSecondary }]}>{look.likes}</Text>
              </View>
              <View style={styles.feedStat}>
                <Ionicons name="share-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.feedStatText, { color: colors.textSecondary }]}>{look.reshares}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Designer Banner */}
      {role === 'designer' && (
        <TouchableOpacity
          style={styles.retailerBanner}
          onPress={() => navigation.navigate('DesignerShowcase')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retailerBannerGradient}
          >
            <Ionicons name="brush" size={28} color="#FFFFFF" />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.retailerBannerTitle}>Designer Studio</Text>
              <Text style={styles.retailerBannerSub}>Upload designs & track ratings</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Retailer Banner */}
      {role === 'retailer' && (
        <TouchableOpacity
          style={styles.retailerBanner}
          onPress={() => navigation.navigate('RetailerDashboard')}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retailerBannerGradient}
          >
            <Ionicons name="storefront" size={28} color="#FFFFFF" />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.retailerBannerTitle}>Retailer Dashboard</Text>
              <Text style={styles.retailerBannerSub}>Manage products, orders & customers</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerSubtitle: { fontSize: FontSize.md, marginTop: 2 },
  notifBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchPlaceholder: { fontSize: FontSize.md },
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
  quickActionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, textAlign: 'center' },
  categorySection: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  catPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  catText: { fontSize: FontSize.xs },
  section: { marginTop: Spacing.xxxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  seeAll: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  trendingCard: {
    width: 150,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  trendingImageContainer: { position: 'relative', width: '100%', height: 150 },
  trendingImage: { width: '100%', height: '100%' },
  trendingWishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingBrand: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
  },
  trendingTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  trendingPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginTop: 4,
  },
  feedCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
  feedCreator: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  feedHandle: { fontSize: FontSize.xs },
  feedImage: { width: '100%', height: 200 },
  feedTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    padding: Spacing.md,
  },
  feedActions: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.xl },
  feedStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedStatText: { fontSize: FontSize.sm },
  retailerBanner: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  retailerBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  retailerBannerTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  retailerBannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm },
});
