import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { RetailProduct, AiStylingResult, ChatMessage } from '../types/fashion';
import { OCCASIONS } from '../constants/config';

export default function AiStylistScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'styling' | 'chat'>('chat');
  const [occasion, setOccasion] = useState('Casual');
  const [stylingResult, setStylingResult] = useState<AiStylingResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleGetStyling = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to use AI Styling');
      return;
    }
    setLoading(true);
    try {
      const result = await api.getAiStyling(user as any, occasion);
      setStylingResult(result);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a103d', Colors.background]} style={styles.header}>
        <Text style={styles.headerTitle}>AI Stylist ✦</Text>
        <Text style={styles.headerSub}>Your personal fashion advisor</Text>

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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {/* Chat Messages */}
          <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
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
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <View style={scoreStyles.card}>
      <Text style={scoreStyles.score}>{Math.round(score * 100)}%</Text>
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
  chatContent: { padding: Spacing.lg, paddingBottom: 100 },
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
});
