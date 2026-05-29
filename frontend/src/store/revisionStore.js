import { create } from 'zustand';
import api from '../api/client';

const useRevisionStore = create((set, get) => ({
  revisionItems: [],
  summary: null,
  loading: false,
  error: null,
  filter: 'all',

  setFilter: (filter) => set({ filter }),

  fetchSummary: async () => {
    try {
      const { data } = await api.get('/revision/summary');
      if (data.success) set({ summary: data.data });
    } catch (err) {
      console.error('fetchSummary error:', err);
    }
  },

  fetchRevisionQueue: async (filter = 'all') => {
    set({ loading: true, error: null, filter });
    try {
      const { data } = await api.get('/revision', { params: { filter } });
      if (data.success) {
        set({ revisionItems: data.data, loading: false });
      }
    } catch (err) {
      set({ error: 'Could not load revision queue right now.', loading: false });
    }
  },

  practiceAnswer: async (revisionId, { answer, timeSpent }) => {
    const { data } = await api.put(`/revision/${revisionId}/practice`, { answer, timeSpent });
    return data;
  },

  snoozeItem: async (revisionId) => {
    await api.put(`/revision/${revisionId}/snooze`);
    // Remove from current list
    set(state => ({
      revisionItems: state.revisionItems.filter(i => i._id !== revisionId)
    }));
    get().fetchSummary();
  },

  markComplete: async (revisionId) => {
    await api.put(`/revision/${revisionId}/complete`);
    set(state => ({
      revisionItems: state.revisionItems.filter(i => i._id !== revisionId)
    }));
    get().fetchSummary();
  },

  generateFromAttempts: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/revision/generate');
      set({ loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: 'Failed to generate revision queue.' });
      throw err;
    }
  }
}));

export default useRevisionStore;
