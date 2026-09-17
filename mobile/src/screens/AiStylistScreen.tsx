import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { RetailProduct, AiStylingResult, ChatMessage, ColorCombo } from '../types/fashion';
import { OCCASIONS } from '../constants/config';
import { getAiStylistSuggestions } from '../utils/searchSuggestions';

export default function AiStylistScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const [tab, setTab] = useState<'styling' | 'chat'>(route?.params?.colorCombo ? 'styling' : 'chat');
  const [occasion, setOccasion] = useState(route?.params?.colorCombo?.occasion || route?.params?.occasion || 'Casual');
  const [selectedCombo, setSelectedCombo] = useState<ColorCombo | null>(route?.params?.colorCombo || null);
  const [stylingResult, setStylingResult] = useState<AiStylingResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const aiSuggestions = useMemo(() => {
    if (chatInput.trim().length < 2) return [];
    return getAiStylistSuggestions(chatInput);
  }, [chatInput]);

  const handleSelectAiSuggestion = (suggestion: string) => {
    setChatInput(suggestion);
  };

  const handleGetStyling = async () => {
    setLoading(true);
    try {
      const activeProfile = user || {
        id: 'guest_01',
        name: 'Guest Fashion Enthusiast',
        skinTone: 'Warm Golden',
        undertone: 'Warm',
        bodyShape: 'Hourglass',
        measurements: { heightCm: 168, chestCm: 88, waistCm: 68, hipsCm: 94 },
        avatar: '',
        hairColor: 'Brown',
        selectedOccasions: ['Casual', 'Work'],
        styleVibes: ['Classic', 'Smart casual'],
        completedOnboarding: true,
      };
      const result = await api.getAiStyling(activeProfile as any, occasion);
      setStylingResult(result);
    } catch (err: any) {
      Alert.alert('AI Styling Error', err.message || 'Unable to generate styling analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route?.params?.colorCombo) {
      setSelectedCombo(route.params.colorCombo);
      setTab('styling');
      const occ = route.params.colorCombo.occasion;
      if (occ) {
        setOccasion(occ);
        // Automatically fetch AI styling advice for this combination & occasion
        (async () => {
          setLoading(true);
          try {
            const activeProfile = user || {
              id: 'guest_01',
              name: 'Guest Fashion Enthusiast',
              skinTone: 'Warm Golden',
              undertone: 'Warm',
              bodyShape: 'Hourglass',
              measurements: { heightCm: 168, chestCm: 88, waistCm: 68, hipsCm: 94 },
              avatar: '',
              hairColor: 'Brown',
              selectedOccasions: ['Casual', 'Work'],
              styleVibes: ['Classic', 'Smart casual'],
              completedOnboarding: true,
            };
            const result = await api.getAiStyling(activeProfile as any, occ);
            setStylingResult(result);
          } catch {
            // Ignore error
          } finally {
            setLoading(false);
          }
        })();
      }
    } else if (route?.params?.occasion) {
      setTab('styling');
      setOccasion(route.params.occasion);
    }
  }, [route?.params?.colorCombo, route?.params?.occasion]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.chatStylist(userMsg.content, { occasion });
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.content,
        recommendedProducts: res.recommendedProducts,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble answering. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.md : 60;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a103d', Colors.background]} style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerTop}>
          {navigation?.canGoBack?.() && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>AI Stylist ✦</Text>
            <Text style={styles.headerSub}>Your personal fashion advisor</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'chat' && styles.tabActive]}
            onPress={() => setTab('chat')}
          >
            <Text style={[styles.tabText, tab === 'chat' && styles.tabTextActive]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'styling' && styles.tabActive]}
            onPress={() => setTab('styling')}
          >
            <Text style={[styles.tabText, tab === 'styling' && styles.tabTextActive]}>Analyze</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {tab === 'chat' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <View style={styles.chatEmpty}>
                <Ionicons name="sparkles" size={48} color={Colors.primary} />
                <Text style={styles.chatEmptyTitle}>Ask me anything!</Text>
                <Text style={styles.chatEmptyText}>
                  "What should I wear to a summer wedding?" or "Find me casual outfits under $50"
                </Text>
              </View>
            )}
            {messages.map((msg, i) => (
              <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={styles.bubbleText}>{msg.content}</Text>
                {msg.recommendedProducts?.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.recProduct}
                    onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                  >
                    <Text style={styles.recProductTitle}>{p.title}</Text>
                    <Text style={styles.recProductPrice}>${p.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            {chatLoading && (
              <View style={[styles.bubble, styles.bubbleAi]}>
                <Text style={styles.bubbleText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* AI Suggestions strip */}
          {aiSuggestions.length > 0 && (
            <View style={styles.aiSuggestionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.aiSuggestionsScroll}
              >
                {aiSuggestions.map((suggestion, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.aiSuggestionChip}
                    onPress={() => handleSelectAiSuggestion(suggestion)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="sparkles" size={13} color={Colors.primary} />
                    <Text style={styles.aiSuggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Chat Input */}
          <View style={styles.chatInputBar}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask your AI stylist..."
              placeholderTextColor={Colors.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={handleSendChat}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat} disabled={chatLoading}>
              <Ionicons name="send" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg }}>
          {/* Selected Color Combination Banner (when navigated from Color Voting) */}
          {selectedCombo && (
            <View style={styles.selectedComboCard}>
              <View style={styles.selectedComboHeader}>
                <View style={styles.selectedComboTag}>
                  <Ionicons name="color-palette" size={15} color={Colors.accent} />
                  <Text style={styles.selectedComboTagText}>Selected Color Palette</Text>
                </View>
                <View style={styles.selectedComboBadge}>
                  <Text style={styles.selectedComboBadgeText}>{selectedCombo.occasion}</Text>
                </View>
              </View>

              <Text style={styles.selectedComboTitle}>{selectedCombo.title}</Text>
              <Text style={styles.selectedComboSub}>{selectedCombo.subType}</Text>

              <View style={styles.selectedComboColorRow}>
                {selectedCombo.colors.map((c, i) => (
                  <View key={i} style={styles.selectedComboColorItem}>
                    <View style={[styles.selectedComboSwatch, { backgroundColor: c.hex }]} />
                    <Text style={styles.selectedComboColorName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.selectedComboHex}>{c.hex}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.selectedComboFooter}>
                <View style={styles.selectedComboRating}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.selectedComboRatingText}>{selectedCombo.rating.toFixed(1)}</Text>
                  <Text style={styles.selectedComboVotesText}>({selectedCombo.votesCount.toLocaleString()} votes)</Text>
                </View>
                <Text style={styles.selectedComboHint}>Curating matching outfits below</Text>
              </View>
            </View>
          )}

          {/* Occasion selector */}
          <Text style={styles.label}>Select Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xl }}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ}
                style={[styles.occPill, occasion === occ && styles.occPillActive]}
                onPress={() => setOccasion(occ)}
              >
                <Text style={[styles.occText, occasion === occ && styles.occTextActive]}>{occ}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={handleGetStyling} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeBtn}
            >
              <Ionicons name="sparkles" size={20} color={Colors.white} />
              <Text style={styles.analyzeBtnText}>
                {loading ? 'Analyzing...' : 'Get AI Styling Advice'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Results */}
          {stylingResult && (
            <View style={styles.results}>
              <View style={styles.scoreRow}>
                <ScoreCard label="Color Harmony" score={stylingResult.colorHarmonyScore} />
                <ScoreCard label="Fit Score" score={stylingResult.fitScore} />
                <ScoreCard label="Overall" score={stylingResult.overallMatch} />
              </View>

              <View style={styles.adviceCard}>
                <Text style={styles.adviceLabel}>Palette Rationale</Text>
                <Text style={styles.adviceText}>{stylingResult.paletteRationale}</Text>
              </View>

              <View style={styles.adviceCard}>
                <Text style={styles.adviceLabel}>Body Shape Advice</Text>
                <Text style={styles.adviceText}>{stylingResult.bodyShapeAdvice}</Text>
              </View>

              {stylingResult.recommendedPalette?.length > 0 && (
                <View style={styles.paletteSection}>
                  <Text style={styles.adviceLabel}>Recommended Palette</Text>
                  <View style={styles.paletteRow}>
                    {stylingResult.recommendedPalette.map((color, i) => (
                      <View key={i} style={[styles.paletteSwatch, { backgroundColor: color }]} />
                    ))}
                  </View>
                </View>
              )}

              {stylingResult.curatedProducts?.length > 0 && (
                <View style={styles.curatedSection}>
                  <Text style={styles.adviceLabel}>Curated Matching Pieces ✨</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
                    {stylingResult.curatedProducts.map((p: any) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.curatedCard}
                        onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                      >
                        <Image source={{ uri: p.imageUrl || 'https://via.placeholder.com/120' }} style={styles.curatedImage} />
                        <View style={styles.curatedInfo}>
                          <Text style={styles.curatedBrand}>{p.brand}</Text>
                          <Text style={styles.curatedTitle} numberOfLines={1}>{p.title}</Text>
                          <Text style={styles.curatedPrice}>${Number(p.price).toFixed(2)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const percentage = Math.round(score > 1 ? score : score * 100);
  return (
    <View style={scoreStyles.card}>
      <Text style={scoreStyles.score}>{percentage}%</Text>
      <Text style={scoreStyles.label}>{label}</Text>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  score: { color: Colors.primary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerSub: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primaryFaded },
  tabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary },
  chatArea: { flex: 1 },
  chatContent: { padding: Spacing.lg, paddingBottom: 20 },
  chatEmpty: { alignItems: 'center', paddingTop: 60 },
  chatEmptyTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.lg },
  chatEmptyText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.xl },
  bubble: { maxWidth: '85%', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  bubbleAi: { alignSelf: 'flex-start', backgroundColor: Colors.surface },
  bubbleText: { color: Colors.white, fontSize: FontSize.md, lineHeight: 22 },
  recProduct: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recProductTitle: { color: Colors.text, fontSize: FontSize.sm, flex: 1 },
  recProductPrice: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  aiSuggestionsContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  aiSuggestionsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  aiSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  aiSuggestionText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.md,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  occPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  occPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  occText: { color: Colors.textMuted, fontSize: FontSize.sm },
  occTextActive: { color: Colors.primary },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  analyzeBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  results: { marginTop: Spacing.xxl },
  scoreRow: { flexDirection: 'row', gap: Spacing.md },
  adviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  adviceLabel: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  adviceText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22 },
  paletteSection: { marginTop: Spacing.lg },
  paletteRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  paletteSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.border },
  curatedSection: { marginTop: Spacing.xl },
  curatedCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  curatedImage: { width: '100%', height: 130 },
  curatedInfo: { padding: Spacing.sm },
  curatedBrand: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase' },
  curatedTitle: { color: Colors.text, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginTop: 2 },
  curatedPrice: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: 2 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: Spacing.md, padding: 4 },
  selectedComboCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    ...Shadows.md,
  },
  selectedComboHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  selectedComboTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedComboTagText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedComboBadge: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  selectedComboBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  selectedComboTitle: {
    color: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: 4,
  },
  selectedComboSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  selectedComboColorRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  selectedComboColorItem: {
    alignItems: 'center',
  },
  selectedComboSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  selectedComboColorName: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    maxWidth: 70,
    textAlign: 'center',
  },
  selectedComboHex: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  selectedComboFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  selectedComboRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedComboRatingText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  selectedComboVotesText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  selectedComboHint: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
