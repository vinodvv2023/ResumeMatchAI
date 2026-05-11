import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, CheckCircle, XCircle, FileText, Search } from 'lucide-react';
import api from '../lib/api';
import type { RegistryEntry } from '../types';

export default function Registry() {
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredRegistry = registry.filter(entry => 
    entry.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.email && entry.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                <th className="p-4 font-semibold text-slate-300">Candidate</th>
                <th className="p-4 font-semibold text-slate-300">Job Position</th>
                <th className="p-4 font-semibold text-slate-300">Score</th>
                <th className="p-4 font-semibold text-slate-300">Status</th>
                <th className="p-4 font-semibold text-slate-300">Date</th>
                <th className="p-4 font-semibold text-slate-300 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistry.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {searchTerm ? 'No results found for your search.' : 'No processing history found.'}
                  </td>
                </tr>
              ) : (
                filteredRegistry.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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
                      {/* Note: In a real app, this would open a detailed view of the match */}
                      <button 
                        className="p-2 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                        title="View Full Report"
                        onClick={() => alert(`Details for match ${entry.match_id}\nCandidate: ${entry.candidate_name}\nScore: ${entry.score}%`)}
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
