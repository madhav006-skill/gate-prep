import { create } from 'zustand';
import api from '../api/client';

export const useAnalyticsStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,
  isEmpty: false,

  fetchWeaknessRadar: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/analytics/weakness-radar');
      const responseData = res.data.data;
      
      if (responseData.isEmpty) {
        set({ isEmpty: true, isLoading: false });
      } else {
        set({ data: responseData, isEmpty: false, isLoading: false });
      }
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch weakness radar', isLoading: false });
    }
  }
}));
