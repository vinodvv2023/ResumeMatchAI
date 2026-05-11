import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, FileText, Target, Loader2, Save } from 'lucide-react';
import api from '../lib/api';
import type { Job } from '../types';

export default function EditJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    threshold: 60,
  });

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await api.get<Job>(`/jobs/${id}`);
      const { title, description, threshold } = response.data;
      setFormData({ title, description, threshold });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await api.put(`/jobs/${id}`, formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update job');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
          Edit Job Description
        </h1>
        <p className="text-slate-400 mt-2">Update the role details and scoring threshold.</p>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-slate-300">
              <Briefcase size={16} className="mr-2 text-violet-400" /> Job Title
            </label>
            <input
              type="text"
              required
              className="glass-input w-full"
              placeholder="e.g. Senior Frontend Engineer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-slate-300">
              <FileText size={16} className="mr-2 text-violet-400" /> Job Description
            </label>
            <textarea
              required
              rows={8}
              className="glass-input w-full resize-y"
              placeholder="Paste the full job description here. The AI will extract the necessary skills."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-slate-300">
              <Target size={16} className="mr-2 text-violet-400" /> Passing Threshold ({formData.threshold}%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
              />
              <span className="font-mono text-lg font-bold text-violet-400 w-12 text-right">
                {formData.threshold}%
              </span>
            </div>
            <p className="text-xs text-slate-500">Candidates scoring below this will be automatically rejected.</p>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saving} className="glass-button flex items-center gap-2">
              {saving ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
