import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import api from '../services/api';
import { useWishlist } from '../hooks/useWishlist';
import type { RetailProduct } from '../types/fashion';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear'];

export default function ExploreScreen({ navigation }: any) {
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlist();

  const fetchProducts = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.query = search.trim();
      if (category !== 'All') params.category = category;
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

  if (loading) return <Loading message="Loading products..." />;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchProducts}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); }}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catList}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        keyExtractor={(item) => item}
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
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: Spacing.lg }}
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
});
