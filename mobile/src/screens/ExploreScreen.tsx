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
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import api from '../services/api';
import { useWishlist } from '../hooks/useWishlist';
import type { RetailProduct } from '../types/fashion';
import { getProductSearchSuggestions } from '../utils/searchSuggestions';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear'];

export default function ExploreScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [category, setCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlist();

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
    <View style={styles.container}>
      {/* Search */}
      <View style={[styles.searchContainer, { paddingTop: topPadding }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.textMuted}
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
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions Card directly below the search bar */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsCard}>
            <View style={styles.suggestionsHeader}>
              <Ionicons name="sparkles" size={13} color={Colors.primary} />
              <Text style={styles.suggestionsHeaderTitle}>Category Suggestions</Text>
            </View>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.suggestionRow,
                  idx === suggestions.length - 1 && styles.suggestionRowLast,
                ]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionIconCircle}>
                  <Ionicons name="search" size={13} color={Colors.primary} />
                </View>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {item}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catPill, category === item && styles.catPillActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catText, category === item && styles.catTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Product Grid */}
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No products found</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: FontSize.md, paddingVertical: Spacing.md },
  catList: { marginTop: Spacing.md, maxHeight: 44 },
  catPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  catText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  catTextActive: { color: Colors.primary },
  grid: { padding: Spacing.lg },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
  suggestionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderBottomColor: Colors.border,
  },
  suggestionsHeaderTitle: {
    color: Colors.primary,
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
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  suggestionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
