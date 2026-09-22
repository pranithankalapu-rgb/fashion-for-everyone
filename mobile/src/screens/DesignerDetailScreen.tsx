import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import type { Designer, Design } from '../types/fashion';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { resolveMediaUrl } from '../utils/media';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / 2;

export default function DesignerDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { designerId, designer: initialDesigner } = route.params || {};

  const [designer, setDesigner] = useState<Designer | null>(initialDesigner || null);
  const [designs, setDesigns] = useState<Design[]>(initialDesigner?.designs || []);
  const [loading, setLoading] = useState(!initialDesigner);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialDesigner?.followers || 0);

  const fetchDesignerData = useCallback(async () => {
    const id = designerId || initialDesigner?.id;
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const [designerData, allDesigns] = await Promise.all([
        api.getDesignerById(id).catch(() => null),
        api.getDesigns().catch(() => []),
      ]);

      if (designerData) {
        setDesigner(designerData);
        setFollowersCount(designerData.followers || 0);
        // If designer endpoint returned designs, use those, else filter from allDesigns
        if (Array.isArray(designerData.designs) && designerData.designs.length > 0) {
          setDesigns(designerData.designs);
        } else {
          const matchingDesigns = allDesigns.filter((d: Design) => d.designerId === id);
          setDesigns(matchingDesigns);
        }
      } else if (initialDesigner) {
        // Keep initial designer if single fetch failed
        setDesigner(initialDesigner);
        const matchingDesigns = allDesigns.filter((d: Design) => d.designerId === id);
        setDesigns(matchingDesigns);
      } else {
        // Designer genuinely not found
        setDesigner(null);
      }
    } catch {
      if (!initialDesigner) {
        setDesigner(null);
      }
    } finally {
      setLoading(false);
    }
  }, [designerId, initialDesigner]);

  useEffect(() => {
    fetchDesignerData();
  }, [fetchDesignerData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDesignerData();
    setRefreshing(false);
  };

  const handleToggleFollow = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      setFollowersCount((count: number) => count + (next ? 1 : -1));
      Alert.alert(
        next ? 'Following Creator ✦' : 'Unfollowed',
        next
          ? `You are now following ${designer?.name || 'this designer'}. You'll receive updates on their new runway drops!`
          : `You have unfollowed ${designer?.name || 'this designer'}.`
      );
      return next;
    });
  };

  const handleShare = async () => {
    if (!designer) return;
    try {
      await Share.share({
        message: `Explore ${designer.name}'s exclusive runway designs on Fashion for Everyone! @${designer.handle}`,
      });
    } catch {}
  };

  const lastPressRef = React.useRef(0);
  const handleOpenDesign = (item: Design) => {
    if (!item?.id) return;
    const now = Date.now();
    if (now - lastPressRef.current < 600) return;
    lastPressRef.current = now;
    navigation.navigate('DesignDetail', { designId: item.id, design: item });
  };

  const topInset = insets.top > 0 ? insets.top + Spacing.sm : 50;

  if (loading && !designer) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading designer portfolio...</Text>
      </View>
    );
  }

  if (!designer) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="person-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Designer Not Found</Text>
        <Text style={[styles.errorSub, { color: colors.textMuted }]}>
          The requested designer profile could not be located.
        </Text>
        <View style={{ marginTop: Spacing.xl }}>
          <Button title="Go Back to Showcase" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const avgRatingDisplay = typeof designer.avgRating === 'number' ? designer.avgRating.toFixed(1) : '5.0';
  const totalVotesDisplay = typeof designer.totalVotes === 'number' ? designer.totalVotes.toLocaleString() : '0';
  const followersDisplay = followersCount.toLocaleString();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: topInset, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {designer.name}
        </Text>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          onPress={handleShare}
          accessibilityLabel="Share designer profile"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.avatarSection}>
            <Avatar
              uri={designer.avatar}
              name={designer.name}
              size={84}
              borderColor={colors.primary}
              borderWidth={2.5}
            />
            {designer.verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={[styles.designerName, { color: colors.text }]}>{designer.name}</Text>
          <Text style={[styles.designerHandle, { color: colors.primary }]}>@{designer.handle}</Text>

          {/* Badges Pill Row */}
          {Array.isArray(designer.badges) && designer.badges.length > 0 && (
            <View style={styles.badgeRow}>
              {designer.badges.map((badge, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor:
                        badge === 'Top Rated'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : badge === 'Trending'
                          ? 'rgba(236, 72, 153, 0.15)'
                          : 'rgba(99, 102, 241, 0.15)',
                      borderColor:
                        badge === 'Top Rated'
                          ? 'rgba(245, 158, 11, 0.4)'
                          : badge === 'Trending'
                          ? 'rgba(236, 72, 153, 0.4)'
                          : 'rgba(99, 102, 241, 0.4)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          badge === 'Top Rated'
                            ? colors.warning
                            : badge === 'Trending'
                            ? '#EC4899'
                            : colors.primary,
                      },
                    ]}
                  >
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Bio */}
          {Boolean(designer.bio) && (
            <Text style={[styles.designerBio, { color: colors.textSecondary }]}>{designer.bio}</Text>
          )}

          {/* Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{followersDisplay}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>{avgRatingDisplay}</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Merit Score</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalVotesDisplay}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Votes</Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing
                ? { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 }
                : { backgroundColor: colors.primary },
            ]}
            onPress={handleToggleFollow}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFollowing ? 'checkmark' : 'person-add-outline'}
              size={18}
              color={isFollowing ? colors.text : '#FFFFFF'}
            />
            <Text style={[styles.followButtonText, { color: isFollowing ? colors.text : '#FFFFFF' }]}>
              {isFollowing ? 'Following Creator' : 'Follow Designer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Portfolio Section */}
        <View style={styles.portfolioSection}>
          <View style={styles.portfolioHeader}>
            <Text style={[styles.portfolioTitle, { color: colors.text }]}>
              Runway Portfolio & Designs
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{designs.length}</Text>
            </View>
          </View>

          {designs.length === 0 ? (
            <View style={[styles.emptyPortfolioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="sparkles-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyPortfolioTitle, { color: colors.text }]}>No Designs Published Yet</Text>
              <Text style={[styles.emptyPortfolioSub, { color: colors.textMuted }]}>
                This designer has not released public showcase looks yet. Check back soon!
              </Text>
            </View>
          ) : (
            <View style={styles.designsGrid}>
              {designs.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.designGridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleOpenDesign(item)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: resolveMediaUrl(item.imageUrl) }}
                    style={styles.designGridImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.designGridInfo}>
                    <Text style={[styles.designGridTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.designGridCollection, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.collection || 'Runway'}
                    </Text>
                    <View style={styles.designGridFooter}>
                      <Text style={[styles.designGridPrice, { color: colors.primary }]}>
                        ${typeof item.price === 'number' ? item.price.toFixed(0) : '290'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Ionicons name="star" size={12} color={colors.warning} />
                        <Text style={[styles.designGridRating, { color: colors.textSecondary }]}>
                          {(item.rating ?? 5).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
  },
  errorSub: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  profileCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.md,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  designerName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  designerHandle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  badgePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  designerBio: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  followButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  portfolioSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  portfolioTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  emptyPortfolioCard: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyPortfolioTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
  },
  emptyPortfolioSub: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  designsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  designGridCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.sm,
  },
  designGridImage: {
    width: '100%',
    height: CARD_WIDTH * 1.25,
  },
  designGridInfo: {
    padding: Spacing.sm,
  },
  designGridTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  designGridCollection: {
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  designGridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  designGridPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  designGridRating: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
