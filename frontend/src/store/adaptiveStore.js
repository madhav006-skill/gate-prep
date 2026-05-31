import { create } from 'zustand';
import api from '../api/client';

const useAdaptiveStore = create((set, get) => ({
  recommendation: null,
  history: [],
  loading: false,
  generating: false,
  error: null,
  previewTest: null,

  fetchRecommendation: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/adaptive/recommendation');
      set({ recommendation: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch recommendation', loading: false });
    }
  },

  fetchHistory: async () => {
    try {
      const res = await api.get('/adaptive/history');
      set({ history: res.data.data });
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  },

  generateTest: async (settings) => {
    set({ generating: true, error: null });
    try {
      const res = await api.post('/adaptive/generate', settings);
      set({ previewTest: res.data.data, generating: false });
      return { success: true, testId: res.data.data._id };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to generate test', generating: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  clearPreview: () => set({ previewTest: null })
}));

export default useAdaptiveStore;
