import { create } from 'zustand';
import api from '../api/client';

const useMistakeStore = create((set, get) => ({
  mistakes: [],
  summary: null,
  loading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    category: '',
    search: ''
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchMistakes();
  },

  fetchMistakes: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/mistakes?${params.toString()}`);
      set({ mistakes: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch mistakes', loading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await api.get('/mistakes/summary');
      set({ summary: res.data.data });
    } catch (err) {
      console.error('Failed to fetch mistake summary:', err);
    }
  },

  addManualMistake: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.post('/mistakes/manual', data);
      await get().fetchMistakes();
      await get().fetchSummary();
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to add manual mistake', loading: false });
      return { success: false, error: err.message };
    }
  },

  updateMistake: async (id, data) => {
    try {
      const res = await api.put(`/mistakes/${id}`, data);
      
      // Update local state
      set((state) => ({
        mistakes: state.mistakes.map(m => m._id === id ? res.data.data : m)
      }));
      
      // Update summary if status changed
      if (data.status) {
        await get().fetchSummary();
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to update mistake:', err);
      return { success: false };
    }
  },

  deleteMistake: async (id) => {
    try {
      await api.delete(`/mistakes/${id}`);
      set((state) => ({
        mistakes: state.mistakes.filter(m => m._id !== id)
      }));
      await get().fetchSummary();
      return { success: true };
    } catch (err) {
      console.error('Failed to delete mistake:', err);
      return { success: false };
    }
  }
}));

export default useMistakeStore;
