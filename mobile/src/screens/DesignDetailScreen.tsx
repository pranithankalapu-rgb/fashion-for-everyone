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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import type { Design } from '../types/fashion';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { resolveMediaUrl } from '../utils/media';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 1.1;

export default function DesignDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { designId, design: initialDesign } = route.params || {};

  const [design, setDesign] = useState<Design | null>(initialDesign || null);
  const [loading, setLoading] = useState(!initialDesign);
  const [voting, setVoting] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  const fetchDesign = useCallback(async () => {
    if (!designId && !initialDesign?.id) {
      Alert.alert('Error', 'Design identifier not found');
      navigation.goBack();
      return;
    }
    const id = designId || initialDesign?.id;
    try {
      const data = await api.getDesignById(id);
      setDesign(data);
    } catch {
      // If single fetch fails but initialDesign exists, keep initial
      if (!initialDesign) {
        Alert.alert('Error', 'Unable to load design details');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  }, [designId, initialDesign, navigation]);

  useEffect(() => {
    fetchDesign();
  }, [fetchDesign]);

  const handleVote = async (rating: number) => {
    if (!design?.id || voting) return;
    setVoting(true);
    setUserRating(rating);
    try {
      const updated = await api.voteDesign(design.id, rating);
      setDesign(updated);
      Alert.alert('Thank You! ★', `You rated this design ${rating} stars!`);
    } catch {
      Alert.alert('Notice', 'Could not register vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const topInset = Math.max(insets.top + 8, 44);

  if (loading && !design) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading design...</Text>
      </View>
    );
  }

  if (!design) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Design Not Found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const imageUrl = resolveMediaUrl(design.imageUrl);
  const priceDisplay = typeof design.price === 'number' ? `$${design.price.toFixed(0)}` : '$290';
  const ratingDisplay = typeof design.rating === 'number' ? design.rating.toFixed(1) : '5.0';
  const votesDisplay = typeof design.votesCount === 'number' ? `${design.votesCount} votes` : '0 votes';
  const palette = Array.isArray(design.palette) ? design.palette : ['#1E293B', '#D97706'];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}
      >
        {/* Main Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: topInset, backgroundColor: 'rgba(0,0,0,0.45)' }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back to Showcase"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={[styles.occasionBadge, { top: topInset, backgroundColor: colors.primary }]}>
            <Text style={styles.occasionBadgeText}>{design.occasion || 'Runway'}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Title and Price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text style={[styles.title, { color: colors.text }]}>{design.title || 'Exclusive Look'}</Text>
              <Text style={[styles.collection, { color: colors.textMuted }]}>
                {design.collection || 'Independent Collection 2026'}
              </Text>
            </View>
            <Text style={[styles.price, { color: colors.primary }]}>{priceDisplay}</Text>
          </View>

          {/* Designer Card */}
          <View style={[styles.designerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Avatar
              uri={design.designerAvatar}
              name={design.designerName || 'Designer'}
              size={50}
              borderColor={colors.primary}
              borderWidth={1.5}
            />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <View style={styles.designerNameRow}>
                <Text style={[styles.designerName, { color: colors.text }]}>
                  {design.designerName || 'Featured Fashion Designer'}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.designerRole, { color: colors.textMuted }]}>Verified Fashion Creator ✦</Text>
            </View>
          </View>

          {/* Rating and Community Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={18} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>{ratingDisplay}</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Merit Score</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{votesDisplay}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Community Support</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {design.inStock !== false ? 'Available' : 'Archive'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Production Status</Text>
            </View>
          </View>

          {/* Color Palette Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COLOR COMPOSITION</Text>
            <View style={styles.paletteRow}>
              {palette.map((hex, index) => (
                <View key={index} style={styles.paletteChip}>
                  <View style={[styles.colorSwatch, { backgroundColor: hex, borderColor: colors.border }]} />
                  <Text style={[styles.colorHex, { color: colors.textMuted }]}>{hex.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Interactive Voting Section */}
          <View style={[styles.voteSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.voteTitle, { color: colors.text }]}>Rate this Design</Text>
            <Text style={[styles.voteSubtitle, { color: colors.textMuted }]}>
              Help independent designers get recognized and produced
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = userRating ? star <= userRating : false;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleVote(star)}
                    disabled={voting}
                    style={styles.starBtn}
                    activeOpacity={0.7}
                    accessibilityLabel={`Rate ${star} stars`}
                  >
                    <Ionicons
                      name={isSelected ? 'star' : 'star-outline'}
                      size={32}
                      color={isSelected ? colors.warning : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            {voting && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />}
          </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  occasionBadge: {
    position: 'absolute',
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  occasionBadgeText: {
    color: '#FFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  content: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: 28,
  },
  collection: {
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  price: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  designerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  designerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  designerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  designerRole: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
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
    width: 1,
    height: 30,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  paletteChip: {
    alignItems: 'center',
    gap: 4,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    ...Shadows.sm,
  },
  colorHex: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  voteSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadows.sm,
  },
  voteTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  voteSubtitle: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  starBtn: {
    padding: Spacing.xs,
  },
});
