import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export const useDecks = (scope = 'user') =>
  useQuery({
    queryKey: ['decks', scope],
    queryFn: async () => {
      const { data } = await api.get('/decks', {
        params: scope === 'all' ? { scope: 'all' } : undefined,
      });
      return data.data;
    },
  });

export const useCreateDeck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/decks', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decks'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
};

export const useUpdateDeck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ deckId, ...payload }) => {
      const { data } = await api.put(`/decks/${deckId}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decks'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useDeleteDeck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deckId) => {
      const { data } = await api.delete(`/decks/${deckId}`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decks'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
};

export const useReviewCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ deckId, cardId, quality, durationMs }) => {
      const { data } = await api.post(`/decks/${deckId}/review`, {
        cardId,
        quality,
        durationMs,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decks'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};
