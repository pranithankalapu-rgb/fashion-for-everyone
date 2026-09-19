import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import api from '../services/api';
import { useWishlist } from '../hooks/useWishlist';
import type { RetailProduct } from '../types/fashion';
import { getProductSearchSuggestions } from '../utils/searchSuggestions';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear'];

export default function ExploreScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(route?.params?.search || '');
  const [isFocused, setIsFocused] = useState(false);
  const [category, setCategory] = useState(route?.params?.category || 'All');
  const [refreshing, setRefreshing] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlist();

  // Sync with incoming navigation params
  useEffect(() => {
    if (route?.params?.category && route.params.category !== category) {
      setCategory(route.params.category);
    }
    if (route?.params?.search !== undefined && route.params.search !== search) {
      setSearch(route.params.search);
    }
  }, [route?.params?.category, route?.params?.search]);

  const suggestions = useMemo(() => {
    if (!isFocused || search.trim().length < 2) return [];
    return getProductSearchSuggestions(search);
  }, [isFocused, search]);

  const fetchProducts = useCallback(async (customQuery?: string, cat = category) => {
    try {
      const q = typeof customQuery === 'string' ? customQuery : search;
      const params: any = {};
      if (q.trim()) params.query = q.trim();
      if (cat !== 'All') params.category = cat;
      const data = await api.getProducts(params);
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearch(suggestion);
    setIsFocused(false);
    Keyboard.dismiss();
    fetchProducts(suggestion);
  };

  if (loading) return <Loading message="Loading products..." />;

  const topPadding = insets.top > 0 ? insets.top + Spacing.sm : Spacing.lg;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search */}
      <View style={[styles.searchContainer, { paddingTop: topPadding }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onFocus={() => setIsFocused(true)}
            onChangeText={(text) => {
              setSearch(text);
              setIsFocused(true);
            }}
            onSubmitEditing={() => {
              setIsFocused(false);
              fetchProducts();
            }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setIsFocused(false);
                fetchProducts('');
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions Card directly below the search bar */}
        {suggestions.length > 0 && (
          <View style={[styles.suggestionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.suggestionsHeader, { borderBottomColor: colors.border }]}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={[styles.suggestionsHeaderTitle, { color: colors.primary }]}>Category Suggestions</Text>
            </View>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.suggestionRow,
                  { borderBottomColor: colors.border },
                  idx === suggestions.length - 1 && styles.suggestionRowLast,
                ]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.suggestionIconCircle, { backgroundColor: colors.primaryFaded }]}>
                  <Ionicons name="search" size={13} color={colors.primary} />
                </View>
                <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>
                  {item}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catList}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isActive = category === item;
          return (
            <TouchableOpacity
              style={[
                styles.catPill,
                {
                  backgroundColor: isActive ? colors.primaryFaded : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCategory(item)}
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
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Product Grid */}
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.grid, { paddingBottom: 110 + insets.bottom }]}
        columnWrapperStyle={{ gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            onWishlistToggle={() => toggleWishlist(item)}
            isWishlisted={isWishlisted(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, paddingVertical: Spacing.md },
  catList: { marginTop: Spacing.md, maxHeight: 44 },
  catPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  catText: { fontSize: FontSize.sm },
  grid: { padding: Spacing.lg },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
  suggestionsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.md,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  suggestionsHeaderTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  suggestionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
