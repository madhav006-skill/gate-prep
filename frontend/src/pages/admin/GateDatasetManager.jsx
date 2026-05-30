import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Upload, Plus, CheckCircle2, XCircle, Clock,
  Filter, ChevronDown, Loader2, Trash2, Eye, FileText, Download
} from 'lucide-react';
import useRankEstimatorStore from '../../store/rankEstimatorStore';

const STATUS_CONFIG = {
  verified: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: '✓ Verified' },
  pending:  { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',   label: '⏳ Pending' },
  rejected: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         label: '✗ Rejected' },
};

const PAPERS = ['CS', 'DA', 'ECE', 'ME', 'EE', 'CE'];
const CATEGORIES = ['General', 'OBC', 'EWS', 'SC', 'ST'];

const SAMPLE_CSV = `examYear,paperCode,paperName,category,rawMarks,gateScore,allIndiaRank,sourceType,sourceLabel,verificationStatus
2025,CS,Computer Science & Information Technology,General,62.33,710,1450,admin_import,Verified coaching dataset,verified
2024,DA,Data Science & Artificial Intelligence,General,55.00,,900,admin_import,Admin import,verified`;

// ─────────────── Add Record Modal ───────────────
function AddRecordModal({ onClose }) {
  const { adminAddRecord } = useRankEstimatorStore();
  const [form, setForm] = useState({
    examYear: '2025', paperCode: 'CS', category: 'General',
    rawMarks: '', gateScore: '', allIndiaRank: '',
    sourceType: 'admin_import', sourceLabel: '', verificationStatus: 'verified'
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await adminAddRecord(form);
      onClose();
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };

  const Field = ({ label, name, type='text', ...props }) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type={type} {...props}
        className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
        value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-[#1A1D24] border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Add Single Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        {err && <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-sm px-4 py-2 rounded-lg mb-4">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Year *</label>
              <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                value={form.examYear} onChange={e => setForm(f => ({ ...f, examYear: e.target.value }))}>
                {['2025','2024','2023','2022','2021','2020'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Paper *</label>
              <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                value={form.paperCode} onChange={e => setForm(f => ({ ...f, paperCode: e.target.value }))}>
                {PAPERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Category *</label>
            <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Raw Marks *" name="rawMarks" type="number" step="0.01" placeholder="62.33" />
            <Field label="GATE Score" name="gateScore" type="number" placeholder="Optional" />
            <Field label="AIR *" name="allIndiaRank" type="number" placeholder="1450" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Source Label *</label>
            <input className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="e.g. Coaching institute dataset, Student report" 
              value={form.sourceLabel} onChange={e => setForm(f => ({ ...f, sourceLabel: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source Type</label>
              <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                value={form.sourceType} onChange={e => setForm(f => ({ ...f, sourceType: e.target.value }))}>
                <option value="admin_import">Admin Import</option>
                <option value="public_dataset">Public Dataset</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                value={form.verificationStatus} onChange={e => setForm(f => ({ ...f, verificationStatus: e.target.value }))}>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading || !form.rawMarks || !form.allIndiaRank || !form.sourceLabel}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Record
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────── CSV Import Modal ───────────────
function CSVImportModal({ onClose }) {
  const { adminImportCSV } = useRankEstimatorStore();
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setErr(''); setLoading(true);
    try {
      const res = await adminImportCSV(csvText);
      setResult(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'gate_rank_data_sample.csv'; a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-[#1A1D24] border border-gray-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Bulk CSV Import</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="bg-[#0F1117] rounded-lg p-4 mb-4 text-xs font-mono text-gray-400">
          <p className="text-gray-500 mb-1">Required columns:</p>
          examYear, paperCode, paperName, category, rawMarks, gateScore (optional), allIndiaRank, sourceType, sourceLabel, verificationStatus
          <button onClick={downloadSample} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 mt-2">
            <Download size={11} /> Download sample CSV
          </button>
        </div>

        {err && <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-sm px-4 py-2 rounded-lg mb-3">{err}</div>}

        {result ? (
          <div className="text-center py-6">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-white font-bold text-lg mb-1">{result.imported} records imported!</p>
            {result.errors?.length > 0 && (
              <p className="text-amber-400 text-sm">{result.errors.length} rows had errors and were skipped.</p>
            )}
            <button onClick={onClose} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">Done</button>
          </div>
        ) : (
          <>
            <textarea
              className="w-full h-48 bg-[#0F1117] border border-gray-700 rounded-lg p-3 text-gray-300 text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
              placeholder="Paste CSV content here..."
              value={csvText} onChange={e => setCsvText(e.target.value)}
            />
            <button onClick={handleImport} disabled={loading || !csvText.trim()}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────── Main Admin Page ───────────────
const GateDatasetManager = () => {
  const navigate = useNavigate();
  const {
    adminLoadRecords, adminRecords, adminStats, adminByPaper,
    adminTotal, adminLoading, adminPage, adminTotalPages,
    adminFilters, setAdminFilter, adminUpdateRecord
  } = useRankEstimatorStore();

  const [showAdd, setShowAdd] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { adminLoadRecords(1); }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdating(id);
    try { await adminUpdateRecord(id, { verificationStatus: status }); } finally { setUpdating(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record permanently?')) return;
    setUpdating(id);
    try { await adminUpdateRecord(id, { action: 'delete' }); } finally { setUpdating(null); }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 font-sans">
      {/* Header */}
      <div className="bg-[#1A1D24] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Database size={18} className="text-purple-400" /> GATE Rank Dataset Manager
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCSV(true)}
            className="flex items-center gap-2 bg-green-700/30 hover:bg-green-700/50 border border-green-600/40 text-green-300 px-4 py-2 rounded-lg text-sm transition">
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition">
            <Plus size={15} /> Add Record
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Total Records', adminTotal, 'text-blue-400', 'bg-blue-500/10 border-blue-500/20'],
            ['Verified', adminStats.verified, 'text-emerald-400', 'bg-emerald-500/10 border-emerald-500/20'],
            ['Pending', adminStats.pending, 'text-yellow-400', 'bg-yellow-500/10 border-yellow-500/20'],
            ['Rejected', adminStats.rejected, 'text-red-400', 'bg-red-500/10 border-red-500/20'],
          ].map(([label, val, color, bg]) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-3xl font-black ${color}`}>{val?.toLocaleString() || 0}</p>
            </div>
          ))}
        </div>

        {/* By Paper breakdown */}
        {adminByPaper.length > 0 && (
          <div className="bg-[#1A1D24] border border-gray-800 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-400 mb-3">Records by Paper</p>
            <div className="flex flex-wrap gap-3">
              {adminByPaper.map(p => (
                <div key={p._id} className="bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-sm">
                  <span className="text-purple-400 font-bold">{p._id}</span>
                  <span className="text-gray-400 ml-2">{p.count} total</span>
                  <span className="text-emerald-400 ml-1">({p.verified} verified)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#1A1D24] border border-gray-800 rounded-xl p-4 flex flex-wrap gap-3">
          <Filter size={16} className="text-gray-500 mt-2" />
          {[
            { key: 'paperCode', label: 'Paper', options: ['', ...PAPERS] },
            { key: 'examYear', label: 'Year', options: ['', '2025', '2024', '2023', '2022'] },
            { key: 'category', label: 'Category', options: ['', ...CATEGORIES] },
            { key: 'status', label: 'Status', options: ['', 'verified', 'pending', 'rejected'] },
          ].map(({ key, label, options }) => (
            <select key={key}
              className="bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
              value={adminFilters[key]} onChange={e => setAdminFilter(key, e.target.value)}>
              {options.map(o => <option key={o} value={o}>{o || `All ${label}s`}</option>)}
            </select>
          ))}
          <button onClick={() => adminLoadRecords(1)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
            Apply
          </button>
        </div>

        {/* Records Table */}
        <div className="bg-[#1A1D24] border border-gray-800 rounded-xl overflow-hidden">
          {adminLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-purple-500" />
            </div>
          ) : adminRecords.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Database size={40} className="mx-auto mb-3 opacity-30" />
              No records found for selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0F1117] border-b border-gray-800">
                  <tr>
                    {['Year','Paper','Cat.','Marks','AIR','Score','Source','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {adminRecords.map(r => {
                    const sCfg = STATUS_CONFIG[r.verificationStatus];
                    const isUpdating = updating === r._id;
                    return (
                      <tr key={r._id} className="hover:bg-gray-800/20 transition">
                        <td className="px-4 py-3 text-gray-300">{r.examYear}</td>
                        <td className="px-4 py-3 font-bold text-purple-400">{r.paperCode}</td>
                        <td className="px-4 py-3 text-gray-400">{r.category}</td>
                        <td className="px-4 py-3 font-mono text-white">{r.rawMarks}</td>
                        <td className="px-4 py-3 font-mono text-white">{r.allIndiaRank?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-400">{r.gateScore || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate" title={r.sourceLabel}>{r.sourceLabel}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${sCfg?.bg} ${sCfg?.color}`}>{sCfg?.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {r.verificationStatus !== 'verified' && (
                              <button onClick={() => handleStatusUpdate(r._id, 'verified')} disabled={isUpdating}
                                className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg" title="Verify">
                                {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                              </button>
                            )}
                            {r.verificationStatus !== 'rejected' && (
                              <button onClick={() => handleStatusUpdate(r._id, 'rejected')} disabled={isUpdating}
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg" title="Reject">
                                <XCircle size={13} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(r._id)} disabled={isUpdating}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {adminTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <p className="text-xs text-gray-500">Page {adminPage} of {adminTotalPages} · {adminTotal} total records</p>
              <div className="flex gap-2">
                <button onClick={() => adminLoadRecords(adminPage - 1)} disabled={adminPage === 1}
                  className="px-3 py-1.5 text-sm bg-[#0F1117] border border-gray-700 rounded-lg disabled:opacity-40">←</button>
                <button onClick={() => adminLoadRecords(adminPage + 1)} disabled={adminPage === adminTotalPages}
                  className="px-3 py-1.5 text-sm bg-[#0F1117] border border-gray-700 rounded-lg disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddRecordModal onClose={() => setShowAdd(false)} />}
      {showCSV && <CSVImportModal onClose={() => setShowCSV(false)} />}
    </div>
  );
};

export default GateDatasetManager;
