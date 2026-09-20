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
  Keyboard,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import type { AiStylingResult, ChatMessage, ColorCombo } from '../types/fashion';
import { OCCASIONS } from '../constants/config';
import { getAiStylistSuggestions } from '../utils/searchSuggestions';

export default function AiStylistScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<'styling' | 'chat'>(route?.params?.colorCombo ? 'styling' : 'chat');
  const [occasion, setOccasion] = useState(route?.params?.colorCombo?.occasion || route?.params?.occasion || 'Casual');
  const [selectedCombo, setSelectedCombo] = useState<ColorCombo | null>(route?.params?.colorCombo || null);
  const [stylingResult, setStylingResult] = useState<AiStylingResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const aiSuggestions = useMemo(() => {
    if (chatInput.trim().length < 2) return [];
    return getAiStylistSuggestions(chatInput);
  }, [chatInput]);

  const handleSelectAiSuggestion = (suggestion: string) => {
    setChatInput(suggestion);
  };

  // Dynamic bottom spacing:
  // 1. KEYBOARD CLOSED:
  // Use the actual device bottom safe-area inset (e.g. ~24dp gesture nav, ~48dp 3-button nav)
  // plus small breathing space (Spacing.xs = 4dp), or Spacing.md (16dp) if insets.bottom is 0.
  // This keeps the input bar comfortably above Android system navigation, never overlapping buttons/gestures.
  //
  // 2. KEYBOARD OPEN:
  // In Android with softwareKeyboardLayoutMode="resize", the window automatically resizes
  // directly above the keyboard. The input bar sits with snug Spacing.sm (8dp) padding directly on top of the keyboard.
  // No safe-area inset is added above the keyboard, preventing large blank gaps.
  const chatInputBottomPadding = isKeyboardVisible
    ? Spacing.sm
    : (insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md);

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
      const response = await api.chatStylist(userMsg.content, { occasion });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
          recommendedProducts: response.recommendedProducts,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not reach the styling engine. Here are some versatile fashion picks for you.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const gradientTop = isDark ? '#1a103d' : '#e0e7ff';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: gradientTop }]}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={[styles.mainContainer, { backgroundColor: colors.background }]}
      >
        {/* Header with gradient */}
        <LinearGradient colors={[gradientTop, colors.background]} style={styles.header}>
          <View style={styles.headerTop}>
            {navigation?.canGoBack?.() && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.goBack();
                }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Stylist ✦</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Personalized fashion intelligence</Text>
            </View>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.tab, tab === 'chat' && [styles.tabActive, { backgroundColor: colors.primaryFaded }]]}
              onPress={() => {
                Keyboard.dismiss();
                setTab('chat');
              }}
            >
              <Text style={[styles.tabText, tab === 'chat' && [styles.tabTextActive, { color: colors.primary }]]}>
                💬 Chat Stylist
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'styling' && [styles.tabActive, { backgroundColor: colors.primaryFaded }]]}
              onPress={() => {
                Keyboard.dismiss();
                setTab('styling');
              }}
            >
              <Text style={[styles.tabText, tab === 'styling' && [styles.tabTextActive, { color: colors.primary }]]}>
                ✨ Style Advice
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {tab === 'chat' ? (
          <View style={styles.chatContainer}>
            {/* Chat Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatArea}
              contentContainerStyle={[styles.chatContent, { paddingBottom: Spacing.md }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={Keyboard.dismiss}
                  style={[styles.chatEmpty, isKeyboardVisible && styles.chatEmptyCompact]}
                >
                  <Ionicons name="sparkles" size={isKeyboardVisible ? 32 : 48} color={colors.primary} />
                  <Text style={[styles.chatEmptyTitle, { color: colors.text }, isKeyboardVisible && styles.chatEmptyTitleCompact]}>
                    Ask me anything!
                  </Text>
                  {!isKeyboardVisible && (
                    <Text style={[styles.chatEmptyText, { color: colors.textSecondary }]}>
                      "What should I wear to a summer wedding?" or "Find me casual outfits under $50"
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.bubble,
                    msg.role === 'user'
                      ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                      : [styles.bubbleAi, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }],
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: msg.role === 'user' ? '#FFFFFF' : colors.text }]}>
                    {msg.content}
                  </Text>
                  {msg.recommendedProducts?.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.recProduct, { backgroundColor: colors.surfaceLight }]}
                      onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                    >
                      <Text style={[styles.recProductTitle, { color: colors.text }]}>{p.title}</Text>
                      <Text style={[styles.recProductPrice, { color: colors.primary }]}>${p.price.toFixed(2)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              {chatLoading && (
                <View style={[styles.bubble, styles.bubbleAi, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.bubbleText, { color: colors.text }]}>Thinking...</Text>
                </View>
              )}
            </ScrollView>

            {/* Bottom input area: suggestions + chat bar */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
              {aiSuggestions.length > 0 && (
                <View style={[styles.aiSuggestionsContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.aiSuggestionsScroll}
                  >
                    {aiSuggestions.map((suggestion, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.aiSuggestionChip, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                        onPress={() => handleSelectAiSuggestion(suggestion)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="sparkles" size={13} color={colors.primary} />
                        <Text style={[styles.aiSuggestionText, { color: colors.text }]}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Chat Input placed right above the system navigation or keyboard */}
              <View style={[styles.chatInputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: chatInputBottomPadding }]}>
                <TextInput
                  style={[styles.chatTextInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                  placeholder="Ask your AI stylist..."
                  placeholderTextColor={colors.textMuted}
                  value={chatInput}
                  onChangeText={setChatInput}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                  onSubmitEditing={handleSendChat}
                  returnKeyType="send"
                  multiline={true}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSendChat}
                  disabled={chatLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg }}>
            {/* Selected Color Combination Banner (when navigated from Color Voting) */}
            {selectedCombo && (
              <View style={[styles.selectedComboCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.selectedComboHeader}>
                  <View style={styles.selectedComboTag}>
                    <Ionicons name="color-palette" size={15} color={colors.accent} />
                    <Text style={styles.selectedComboTagText}>Selected Color Palette</Text>
                  </View>
                  <View style={[styles.selectedComboBadge, { backgroundColor: colors.primaryFaded }]}>
                    <Text style={[styles.selectedComboBadgeText, { color: colors.primary }]}>{selectedCombo.occasion}</Text>
                  </View>
                </View>

                <Text style={[styles.selectedComboTitle, { color: colors.text }]}>{selectedCombo.title}</Text>
                <Text style={[styles.selectedComboSub, { color: colors.textMuted }]}>{selectedCombo.subType}</Text>

                <View style={styles.selectedComboColorRow}>
                  {selectedCombo.colors.map((c, i) => (
                    <View key={i} style={styles.selectedComboColorItem}>
                      <View style={[styles.selectedComboSwatch, { backgroundColor: c.hex, borderColor: colors.border }]} />
                      <Text style={[styles.selectedComboColorName, { color: colors.text }]} numberOfLines={1}>{c.name}</Text>
                      <Text style={[styles.selectedComboHex, { color: colors.textMuted }]}>{c.hex}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.selectedComboFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.selectedComboRating}>
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text style={styles.selectedComboRatingText}>{selectedCombo.rating.toFixed(1)}</Text>
                    <Text style={[styles.selectedComboVotesText, { color: colors.textMuted }]}>({selectedCombo.votesCount.toLocaleString()} votes)</Text>
                  </View>
                  <Text style={[styles.selectedComboHint, { color: colors.primary }]}>Curating matching outfits below</Text>
                </View>
              </View>
            )}

            {/* Occasion selector */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Select Occasion</Text>
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

                <View style={[styles.adviceCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.adviceLabel, { color: colors.primary }]}>Palette Rationale</Text>
                  <Text style={[styles.adviceText, { color: colors.textSecondary }]}>{stylingResult.paletteRationale}</Text>
                </View>

                <View style={[styles.adviceCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.adviceLabel, { color: colors.primary }]}>Body Shape Advice</Text>
                  <Text style={[styles.adviceText, { color: colors.textSecondary }]}>{stylingResult.bodyShapeAdvice}</Text>
                </View>

                {stylingResult.recommendedPalette?.length > 0 && (
                  <View style={styles.paletteSection}>
                    <Text style={[styles.adviceLabel, { color: colors.primary }]}>Recommended Palette</Text>
                    <View style={styles.paletteRow}>
                      {stylingResult.recommendedPalette.map((color, i) => (
                        <View key={i} style={[styles.paletteSwatch, { backgroundColor: color, borderColor: colors.border }]} />
                      ))}
                    </View>
                  </View>
                )}

                {stylingResult.curatedProducts?.length > 0 && (
                  <View style={styles.curatedSection}>
                    <Text style={[styles.adviceLabel, { color: colors.primary }]}>Curated Matching Pieces ✨</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
                      {stylingResult.curatedProducts.map((p: any) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.curatedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                        >
                          <Image source={{ uri: p.imageUrl || 'https://via.placeholder.com/120' }} style={styles.curatedImage} />
                          <View style={styles.curatedInfo}>
                            <Text style={[styles.curatedBrand, { color: colors.textMuted }]}>{p.brand}</Text>
                            <Text style={[styles.curatedTitle, { color: colors.text }]} numberOfLines={1}>{p.title}</Text>
                            <Text style={[styles.curatedPrice, { color: colors.primary }]}>${Number(p.price).toFixed(2)}</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const { colors } = useTheme();
  const percentage = Math.round(score > 1 ? score : score * 100);
  return (
    <View style={[scoreStyles.card, { backgroundColor: colors.surface }]}>
      <Text style={[scoreStyles.score, { color: colors.primary }]}>{percentage}%</Text>
      <Text style={[scoreStyles.label, { color: colors.textMuted }]}>{label}</Text>
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
  safeArea: { flex: 1, backgroundColor: '#1a103d' },
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerSub: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primaryFaded },
  tabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary },
  chatContainer: { flex: 1, backgroundColor: Colors.background },
  chatArea: { flex: 1, flexShrink: 1 },
  chatContent: { padding: Spacing.lg, paddingBottom: Spacing.md },
  chatEmpty: { alignItems: 'center', paddingTop: 28, paddingBottom: 16 },
  chatEmptyCompact: { paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  chatEmptyTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginTop: Spacing.sm },
  chatEmptyTitleCompact: { fontSize: FontSize.md, marginTop: 4 },
  chatEmptyText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.lg },
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
  inputWrapper: {
    flexShrink: 0,
    width: '100%',
    backgroundColor: Colors.surface,
  },
  aiSuggestionsContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.xs,
    maxHeight: 46,
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
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  chatTextInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    color: Colors.text,
    fontSize: FontSize.md,
    maxHeight: 120,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  occPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    marginRight: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  occPillActive: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primary,
  },
  occText: {
    color: '#E0E0F0',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  occTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
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
