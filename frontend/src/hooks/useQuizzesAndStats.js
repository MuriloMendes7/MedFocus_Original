import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export const useQuizzes = (scope = 'user') =>
  useQuery({
    queryKey: ['quizzes', scope],
    queryFn: async () => {
      const { data } = await api.get('/quizzes', {
        params: scope === 'all' ? { scope: 'all' } : undefined,
      });
      return data.data;
    },
  });

export const useQuiz = (quizId) =>
  useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/${quizId}`);
      return data.data;
    },
    enabled: Boolean(quizId),
  });

export const useCreateQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/quizzes', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
};

export const useDeleteQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/quizzes/${id}`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
};

export const useSubmitQuizAttempt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, answers, timeSpentSeconds }) => {
      const { data } = await api.post(`/quizzes/${quizId}/attempts`, {
        answers,
        timeSpentSeconds,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useStats = () =>
  useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats');
      return data.data;
    },
  });

export const useAdminSummary = () =>
  useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/admin/summary');
      return data.data;
    },
  });

export const useAdminUsers = () =>
  useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data.data;
    },
  });

export const useUpdateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await api.patch(`/admin/users/${id}`, patch);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
};
