import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy, CheckCircle2, ExternalLink, Pencil, Trash2, History } from 'lucide-react';
import api from '../lib/api';
import type { Job } from '../types';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get<Job[]>('/jobs');
      setJobs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job? All associated data will be lost.')) return;
    
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter(j => j.id !== id));
    } catch (error) {
      console.error('Failed to delete job', error);
      alert('Failed to delete job');
    }
  };

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
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
            Job Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Manage open positions and application links</p>
        </div>
        <div className="flex gap-4">
          <Link to="/registry" className="glass-button !bg-slate-800/50 flex items-center gap-2">
            <History size={20} />
            View Registry
          </Link>
          <Link to="/create-job" className="glass-button flex items-center gap-2">
            <Plus size={20} />
            Create New Job
          </Link>
        </div>
      </div>

      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 font-semibold text-slate-300">Job Title</th>
                <th className="p-4 font-semibold text-slate-300">Threshold</th>
                <th className="p-4 font-semibold text-slate-300">Latest Score</th>
                <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No jobs created yet. Click "Create New Job" to get started.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">{job.id.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md text-sm">
                        {job.threshold}%
                      </span>
                    </td>
                    <td className="p-4">
                      {job.latest_score !== null && job.latest_score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${job.latest_score >= job.threshold ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>{job.latest_score}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {job.magic_link ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={job.magic_link} 
                            className="bg-black/20 border border-white/10 rounded px-3 py-1.5 text-sm text-slate-300 w-48 focus:outline-none"
                          />
                          <button 
                            onClick={() => copyToClipboard(job.magic_link!, job.id)}
                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                            title="Copy link"
                          >
                            {copied === job.id ? <CheckCircle2 size={18} className="text-green-400" /> : <Copy size={18} />}
                          </button>
                          <a 
                            href={job.magic_link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                            title="Open link"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-red-400 text-sm">No active link</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/edit-job/${job.id}`}
                          className="p-2 hover:bg-violet-500/20 rounded-md transition-colors text-violet-400 hover:text-violet-300"
                          title="Edit Job"
                        >
                          <Pencil size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(job.id)}
                          className="p-2 hover:bg-red-500/20 rounded-md transition-colors text-red-400 hover:text-red-300"
                          title="Delete Job"
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
    </div>
  );
}
