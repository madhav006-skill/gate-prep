import { create } from 'zustand';
import api from '../api/client';

const useRankEstimatorStore = create((set, get) => ({
  // Estimate result
  result: null,
  loading: false,
  error: null,

  // Availability check
  availability: null,

  // Admin records
  adminRecords: [],
  adminStats: { pending: 0, verified: 0, rejected: 0 },
  adminByPaper: [],
  adminTotal: 0,
  adminLoading: false,
  adminPage: 1,
  adminTotalPages: 1,

  // Filters for admin
  adminFilters: { paperCode: '', examYear: '', category: '', status: '' },

  setAdminFilter: (key, value) => set(state => ({
    adminFilters: { ...state.adminFilters, [key]: value }
  })),

  // ─── Estimate Rank ───
  estimate: async ({ paperCode, examYears, category, expectedRawMarks }) => {
    set({ loading: true, error: null, result: null });
    try {
      const res = await api.post('/rank-estimator/estimate', {
        paperCode, examYears, category, expectedRawMarks
      });
      set({ result: res.data, loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Estimation failed',
        loading: false
      });
    }
  },

  // ─── Check Availability ───
  checkAvailability: async ({ paperCode, examYear, category }) => {
    try {
      const params = {};
      if (paperCode) params.paperCode = paperCode;
      if (examYear) params.examYear = examYear;
      if (category) params.category = category;
      const res = await api.get('/rank-estimator/availability', { params });
      set({ availability: res.data });
    } catch (err) {
      // silently fail
    }
  },

  // ─── Submit User Result ───
  submitUserResult: async (data) => {
    try {
      const res = await api.post('/rank-estimator/submit', data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Submission failed');
    }
  },

  // ─── Admin: Load Records ───
  adminLoadRecords: async (page = 1) => {
    const { adminFilters } = get();
    set({ adminLoading: true });
    try {
      const params = { page, limit: 50, ...adminFilters };
      // Remove empty filters
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await api.get('/rank-estimator/admin/records', { params });
      set({
        adminRecords: res.data.records,
        adminStats: res.data.stats,
        adminByPaper: res.data.byPaper,
        adminTotal: res.data.total,
        adminPage: page,
        adminTotalPages: res.data.pagination.totalPages,
        adminLoading: false
      });
    } catch (err) {
      set({ adminLoading: false });
    }
  },

  // ─── Admin: Add Single Record ───
  adminAddRecord: async (data) => {
    try {
      const res = await api.post('/rank-estimator/admin/record', data);
      get().adminLoadRecords(1);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to add record');
    }
  },

  // ─── Admin: Import CSV ───
  adminImportCSV: async (csvData) => {
    try {
      const res = await api.post('/rank-estimator/admin/import-csv', { csvData });
      get().adminLoadRecords(1);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'CSV import failed');
    }
  },

  // ─── Admin: Update Record (verify/reject/delete) ───
  adminUpdateRecord: async (id, payload) => {
    try {
      const res = await api.patch(`/rank-estimator/admin/record/${id}`, payload);
      // Refresh list
      get().adminLoadRecords(get().adminPage);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Update failed');
    }
  },

  clearResult: () => set({ result: null, error: null })
}));

export default useRankEstimatorStore;
