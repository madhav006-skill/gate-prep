import { create } from 'zustand';
import api from '../api/client';

const useSochoStore = create((set, get) => ({
  queue: [],
  summary: null,
  history: [],
  loading: false,
  generating: false,
  error: null,
  filters: {
    status: '',
    label: ''
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchHistory();
  },

  fetchSummary: async () => {
    try {
      const res = await api.get('/socho/summary');
      set({ summary: res.data.data });
    } catch (err) {
      console.error('Failed to fetch Socho summary:', err);
    }
  },

  fetchQueue: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/socho/queue');
      set({ queue: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch Socho queue', loading: false });
    }
  },

  generateQueue: async () => {
    set({ generating: true, error: null });
    try {
      await api.post('/socho/generate');
      await get().fetchQueue();
      await get().fetchSummary();
      set({ generating: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to generate Socho reviews', generating: false });
      return { success: false };
    }
  },

  fetchHistory: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.label) params.append('label', filters.label);

      const res = await api.get(`/socho/history?${params.toString()}`);
      set({ history: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch Socho history', loading: false });
    }
  },

  submitExplanation: async (id, explanation) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/socho/reviews/${id}/submit`, { explanation });
      
      // Remove from queue and add to history (or just re-fetch)
      await get().fetchQueue();
      await get().fetchSummary();
      set({ loading: false });
      return { success: true, data: res.data.data };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to submit explanation', loading: false });
      return { success: false, error: err.message };
    }
  },

  addToRevision: async (id) => {
    try {
      await api.post(`/socho/reviews/${id}/add-to-revision`);
      await get().fetchHistory(); // refresh to see status updated
      return { success: true };
    } catch (err) {
      console.error('Failed to add to revision:', err);
      return { success: false };
    }
  },

  markMastered: async (id) => {
    try {
      await api.post(`/socho/reviews/${id}/mark-mastered`);
      await get().fetchHistory();
      await get().fetchSummary();
      return { success: true };
    } catch (err) {
      console.error('Failed to mark as mastered:', err);
      return { success: false };
    }
  }
}));

export default useSochoStore;
