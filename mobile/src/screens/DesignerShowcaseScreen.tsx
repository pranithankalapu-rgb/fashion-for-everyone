import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import Loading from '../components/Loading';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { Designer, Design } from '../types/fashion';
import { OCCASIONS } from '../constants/config';
import { resolveMediaUrl } from '../utils/media';

const SAMPLE_IMAGE_OPTIONS = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
];

export default function DesignerShowcaseScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, role } = useAuth();
  const isDesigner = role === 'designer' || role === 'admin';

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'designers' | 'designs' | 'studio'>(isDesigner ? 'studio' : 'designers');
  const [refreshing, setRefreshing] = useState(false);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCollection, setNewCollection] = useState('Resort Elegance 2026');
  const [newImageUrl, setNewImageUrl] = useState(SAMPLE_IMAGE_OPTIONS[0]);
  const [newOccasion, setNewOccasion] = useState('Casual');
  const [newPrice, setNewPrice] = useState('290');
  const [uploading, setUploading] = useState(false);

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

  const lastPressRef = React.useRef(0);
  const handleOpenDesigner = (item: Designer) => {
    if (!item?.id) return;
    const now = Date.now();
    if (now - lastPressRef.current < 600) return;
    lastPressRef.current = now;
    navigation.navigate('DesignerDetail', { designerId: item.id, designer: item });
  };

  const handleOpenDesign = (item: Design) => {
    if (!item?.id) return;
    const now = Date.now();
    if (now - lastPressRef.current < 600) return;
    lastPressRef.current = now;
    navigation.navigate('DesignDetail', { designId: item.id, design: item });
  };

  const handleVote = async (id: string, rating: number) => {
    try {
      const updated = await api.voteDesign(id, rating);
      setDesigns((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch {}
  };

  const handlePublishDesign = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your design.');
      return;
    }
    if (!newImageUrl.trim()) {
      Alert.alert('Missing Image', 'Please select or enter an image URL.');
      return;
    }

    setUploading(true);
    try {
      const created = await api.createDesign({
        title: newTitle.trim(),
        collection: newCollection.trim() || 'Autumn Collection 2026',
        imageUrl: newImageUrl.trim(),
        occasion: newOccasion,
        price: Number(newPrice) || 290,
        palette: ['#1E293B', '#D97706', '#064E3B'],
        designerId: user?.id || 'des_1',
      });
      setDesigns((prev) => [created, ...prev]);
      setIsUploadModalOpen(false);
      setNewTitle('');
      Alert.alert('Design Published! 🎉', 'Your design is now live in the community showcase.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to publish design');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loading message="Loading designers..." />;

  const paddingTop = insets.top > 0 ? insets.top + Spacing.md : 60;
  const totalVotes = designs.reduce((acc, d) => acc + (d.votesCount || 0), 3210);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Designer Showcase 🎨</Text>
        </View>

        <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
          {isDesigner && (
            <TouchableOpacity
              style={[styles.tab, tab === 'studio' && styles.tabActive]}
              onPress={() => setTab('studio')}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, tab === 'studio' && styles.tabTextActive]}>My Studio</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tab, tab === 'designers' && styles.tabActive]}
            onPress={() => setTab('designers')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, tab === 'designers' && styles.tabTextActive]}>Designers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'designs' && styles.tabActive]}
            onPress={() => setTab('designs')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, tab === 'designs' && styles.tabTextActive]}>Designs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'studio' ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 + insets.bottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Studio Profile Banner */}
          <LinearGradient colors={isDark ? ['#1a103d', colors.surface] : ['#EEF2FF', colors.surface]} style={[styles.studioBanner, { borderColor: colors.border }]}>
            <View style={styles.studioHeader}>
              <View style={styles.studioAvatarBadge}>
                <Ionicons name="brush" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={[styles.studioName, { color: colors.text }]}>{user?.name || 'Pro Designer Studio'}</Text>
                <Text style={styles.studioHandle}>Verified Fashion Creator ✦</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxVal, { color: colors.text }]}>142.8k</Text>
                <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Views</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxVal, { color: colors.text }]}>{totalVotes}</Text>
                <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Likes & Votes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxVal, { color: colors.text }]}>4.9 ★</Text>
                <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Merit Score</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxVal, { color: colors.text }]}>#1</Text>
                <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Rank</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Action Button */}
          <View style={{ marginVertical: Spacing.lg }}>
            <Button
              title="+ Upload New Design"
              onPress={() => setIsUploadModalOpen(true)}
              size="lg"
              fullWidth
            />
          </View>

          {/* Published Catalog */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>My Portfolio & Designs ({designs.length})</Text>
          {designs.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.studioDesignRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleOpenDesign(item)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: resolveMediaUrl(item.imageUrl) || SAMPLE_IMAGE_OPTIONS[0] }} style={styles.studioDesignThumb} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={[styles.designTitle, { color: colors.text }]} numberOfLines={1}>{item.title || 'Exclusive Look'}</Text>
                <Text style={[styles.designDesigner, { color: colors.textMuted }]}>{item.collection || 'Collection'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs }}>
                  <Text style={[styles.designPrice, { color: colors.primary }]}>${(item.price ?? 0).toFixed(0)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={13} color={colors.warning} />
                    <Text style={styles.miniVoteText}>{(item.rating ?? 5).toFixed(1)} ({item.votesCount ?? 0} votes)</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : tab === 'designers' ? (
        <FlatList
          key="flatlist_showcase_designers"
          data={designers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 + insets.bottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No designers found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.designerCard, { backgroundColor: colors.surface }]}
              onPress={() => handleOpenDesigner(item)}
              activeOpacity={0.8}
              accessibilityLabel={`View ${item.name}'s designer profile`}
            >
              <Image source={{ uri: resolveMediaUrl(item.avatar) }} style={styles.designerAvatar} />
              <View style={styles.designerInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.designerName, { color: colors.text }]}>{item.name}</Text>
                  {item.verified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                </View>
                <Text style={[styles.designerHandle, { color: colors.textMuted }]}>@{item.handle}</Text>
                <Text style={[styles.designerBio, { color: colors.textSecondary }]} numberOfLines={2}>{item.bio}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{item.followers}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>followers</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="star" size={12} color={colors.warning} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{(item.avgRating ?? 5).toFixed(1)}</Text>
                  </View>
                  {item.badges.map((badge, i) => (
                    <View key={i} style={styles.badgePill}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ alignSelf: 'center', marginLeft: Spacing.xs }} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          key="flatlist_showcase_designs_2col"
          data={designs}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 + insets.bottom }}
          columnWrapperStyle={{ gap: Spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sparkles-outline" size={56} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No designs found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.designCard, { backgroundColor: colors.surface }]}
              onPress={() => handleOpenDesign(item)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: resolveMediaUrl(item.imageUrl) || SAMPLE_IMAGE_OPTIONS[0] }} style={styles.designImage} />
              <View style={styles.designInfo}>
                <Text style={[styles.designTitle, { color: colors.text }]} numberOfLines={1}>{item.title || 'Exclusive Look'}</Text>
                <Text style={[styles.designDesigner, { color: colors.textMuted }]}>{item.designerName || 'Designer'}</Text>
                <View style={styles.designBottom}>
                  <Text style={[styles.designPrice, { color: colors.primary }]}>${(item.price ?? 0).toFixed(0)}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      handleVote(item.id, 5);
                    }}
                    style={styles.miniVoteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text style={styles.miniVoteText}>{(item.rating ?? 5).toFixed(1)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Upload Modal for Designers */}
      <Modal visible={isUploadModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Upload New Design ✦</Text>
              <TouchableOpacity onPress={() => setIsUploadModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Design Title</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Asymmetric Cashmere Blazer"
                placeholderTextColor={colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Collection Name</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Resort Elegance 2026"
                placeholderTextColor={colors.textMuted}
                value={newCollection}
                onChangeText={setNewCollection}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Photo Look</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                {SAMPLE_IMAGE_OPTIONS.map((img, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setNewImageUrl(img)}
                    style={[styles.imgOption, { borderColor: colors.border }, newImageUrl === img && styles.imgOptionActive]}
                  >
                    <Image source={{ uri: img }} style={styles.imgOptionPhoto} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Occasion</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                {OCCASIONS.map((occ) => (
                  <TouchableOpacity
                    key={occ}
                    style={[styles.occPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }, newOccasion === occ && styles.occPillActive]}
                    onPress={() => setNewOccasion(occ)}
                  >
                    <Text style={[styles.occText, newOccasion === occ && styles.occTextActive]}>{occ}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Price ($)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
                placeholder="290"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={newPrice}
                onChangeText={setNewPrice}
              />

              <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}>
                <Button
                  title={uploading ? 'Publishing...' : 'Publish to Showcase'}
                  onPress={handlePublishDesign}
                  loading={uploading}
                  size="lg"
                  fullWidth
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
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
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  studioBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  studioHeader: { flexDirection: 'row', alignItems: 'center' },
  studioAvatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioName: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  studioHandle: { color: Colors.primaryLight, fontSize: FontSize.xs, marginTop: 2 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: Spacing.md },
  statBox: { alignItems: 'center' },
  statBoxVal: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  statBoxLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  sectionHeading: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.md },
  studioDesignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  studioDesignThumb: { width: 70, height: 85, borderRadius: BorderRadius.md },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  inputLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginBottom: 6 },
  modalInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    fontSize: FontSize.sm,
  },
  imgOption: {
    width: 64,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  imgOptionActive: { borderColor: Colors.primary },
  imgOptionPhoto: { width: '100%', height: '100%' },
  occPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  occPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  occText: { color: Colors.textMuted, fontSize: FontSize.xs },
  occTextActive: { color: Colors.primary },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
