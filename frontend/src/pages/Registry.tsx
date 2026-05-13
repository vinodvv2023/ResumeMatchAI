import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, CheckCircle, XCircle, FileText, Search, Trash2, FileUp } from 'lucide-react';
import api from '../lib/api';
import type { RegistryEntry } from '../types';

export default function Registry() {
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  
  // Modal state
  const [detailEntry, setDetailEntry] = useState<RegistryEntry | null>(null);

  useEffect(() => {
    fetchRegistry();
  }, []);

  const fetchRegistry = async () => {
    try {
      const response = await api.get<RegistryEntry[]>('/applications/registry');
      setRegistry(response.data);
    } catch (error) {
      console.error('Failed to fetch registry', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRegistry.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      setDeleting(true);
      await api.delete(`/applications/${id}`);
      setRegistry(prev => prev.filter(e => e.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} entries?`)) return;
    
    try {
      setDeleting(true);
      await api.post('/applications/bulk-delete', { ids: selectedIds });
      setRegistry(prev => prev.filter(e => !selectedIds.includes(e.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk delete failed', error);
      alert('Failed to delete selected entries');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRegistry = registry.filter(entry => 
    entry.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.email && entry.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const allSelected = filteredRegistry.length > 0 && selectedIds.length === filteredRegistry.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < filteredRegistry.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
            Application Registry
          </h1>
          <p className="text-slate-400 mt-2">Historical record of all processed resumes and scores.</p>
        </div>

        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/20 transition-all font-medium disabled:opacity-50"
          >
            <Trash2 size={18} />
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 glass-card !py-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, job, or email..." 
          className="bg-transparent border-none outline-none text-slate-200 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 transition-colors"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="p-4 font-semibold text-slate-300">Candidate</th>
                <th className="p-4 font-semibold text-slate-300">Job Position</th>
                <th className="p-4 font-semibold text-slate-300">Score</th>
                <th className="p-4 font-semibold text-slate-300">Status</th>
                <th className="p-4 font-semibold text-slate-300">Date</th>
                <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistry.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {searchTerm ? 'No results found for your search.' : 'No processing history found.'}
                  </td>
                </tr>
              ) : (
                filteredRegistry.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedIds.includes(entry.id) ? 'bg-violet-500/5' : ''}`}
                  >
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 transition-colors"
                        checked={selectedIds.includes(entry.id)}
                        onChange={() => handleSelectOne(entry.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-medium">{entry.candidate_name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={10} /> {entry.email || 'No email found'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {entry.job_title}
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-lg font-bold text-violet-400">
                        {entry.score}%
                      </div>
                    </td>
                    <td className="p-4">
                      {entry.passed ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                          <CheckCircle size={14} /> Pass
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
                          <XCircle size={14} /> Fail
                        </span>
                      )}
                      {entry.has_applied && (
                        <div className="text-[10px] uppercase tracking-wider text-indigo-400 mt-1 font-bold">
                          Applied
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-sm font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          className="p-2 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                          title="View Application Details"
                          onClick={() => setDetailEntry(entry)}
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteOne(entry.id)}
                          disabled={deleting}
                          className="p-2 hover:bg-red-500/10 rounded-md transition-colors text-slate-400 hover:text-red-400"
                          title="Delete Entry"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-white/20 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xl font-bold">
                  {detailEntry.candidate_name[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{detailEntry.candidate_name}</h2>
                  <p className="text-slate-400 text-sm">Applying for <span className="text-violet-400">{detailEntry.job_title}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setDetailEntry(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Header Info & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-6 bg-white/5 rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Match Score</div>
                    <div className="text-4xl font-bold text-violet-400">{detailEntry.score}%</div>
                  </div>
                  <div className="h-12 w-px bg-white/10"></div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Decision</div>
                    {detailEntry.passed ? (
                      <span className="flex items-center gap-2 text-green-400 font-bold text-xl">
                        <CheckCircle size={20} /> PASSED
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-400 font-bold text-xl">
                        <XCircle size={20} /> FAILED
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right mr-4 hidden md:block">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Processed On</div>
                    <div className="text-slate-300 font-mono text-sm">{new Date(detailEntry.created_at).toLocaleString()}</div>
                  </div>
                  {detailEntry.filename && (
                    <a 
                       onClick={async (e) => {
                         e.preventDefault();
                         try {
                           const res = await api.get(`/applications/resume/${detailEntry.resume_id}/file`, { responseType: 'blob' });
                           const url = window.URL.createObjectURL(res.data);
                           const a = document.createElement('a');
                           a.href = url;
                            a.download = detailEntry.filename ?? 'resume.pdf';
                           a.click();
                           window.URL.revokeObjectURL(url);
                         } catch {}
                       }}
                      className="glass-button flex items-center gap-2 py-3 px-6 !bg-violet-500/20 hover:!bg-violet-500/30 border-violet-500/30"
                    >
                      <FileUp size={18} className="text-violet-400" />
                      Download Original Resume
                    </a>
                  )}
                </div>
              </div>

              {/* Covering Letter */}
              {detailEntry.cover_letter ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                    Covering Letter
                  </h3>
                  <div className="bg-white/5 rounded-2xl p-6 text-slate-300 leading-relaxed italic border border-white/5 whitespace-pre-wrap">
                    "{detailEntry.cover_letter}"
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-2xl bg-white/2">
                  <p className="text-slate-500 text-sm italic">No covering letter provided with this application.</p>
                </div>
              )}

              {/* Resume Text */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-violet-500 rounded-full"></div>
                  Parsed Content
                </h3>
                <div className="bg-black/40 rounded-2xl p-8 text-slate-400 text-sm font-mono leading-relaxed border border-white/5 whitespace-pre-wrap">
                  {detailEntry.resume_text || "No resume text available."}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setDetailEntry(null)}
                className="glass-button px-8"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
