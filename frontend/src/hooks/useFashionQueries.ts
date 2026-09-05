import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { ColorCombo, RetailProduct, CustomerOrder, OutfitLook, Designer, Design, StoreSettings } from '../types/fashion';

export function useProducts(params?: { query?: string; category?: string; maxPrice?: number }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.getProducts(params),
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.getOrders(),
    staleTime: 1000 * 30,
  });
}

export function useColorCombos(occasion?: string) {
  return useQuery({
    queryKey: ['colorCombos', occasion || 'All'],
    queryFn: () => api.getColorCombos(occasion),
    staleTime: 1000 * 60,
  });
}

export function useSocialFeed() {
  return useQuery({
    queryKey: ['socialFeed'],
    queryFn: () => api.getSocialFeed(),
    staleTime: 1000 * 60,
  });
}

export function useDesigners() {
  return useQuery({
    queryKey: ['designers'],
    queryFn: () => api.getDesigners(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDesigns(occasion?: string) {
  return useQuery({
    queryKey: ['designs', occasion || 'All'],
    queryFn: () => api.getDesigns(occasion),
    staleTime: 1000 * 60 * 2,
  });
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['storeSettings'],
    queryFn: () => api.getStoreSettings(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useVoteColorCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 'up' | 'down' }) =>
      api.voteColorCombo(id, direction),
    onMutate: async ({ id, direction }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['colorCombos'] });
      const previousCombos = queryClient.getQueryData<ColorCombo[]>(['colorCombos', 'All']);

      if (previousCombos) {
        queryClient.setQueryData<ColorCombo[]>(
          ['colorCombos', 'All'],
          previousCombos.map(c =>
            c.id === id
              ? {
                  ...c,
                  votesCount: direction === 'up' ? c.votesCount + 1 : Math.max(0, c.votesCount - 1),
                  trendingScore: direction === 'up' ? c.trendingScore + 1 : c.trendingScore,
                  userVote: direction === 'up' ? 1 : -1,
                }
              : c
          )
        );
      }
      return { previousCombos };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCombos) {
        queryClient.setQueryData(['colorCombos', 'All'], context.previousCombos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['colorCombos'] });
    },
  });
}
