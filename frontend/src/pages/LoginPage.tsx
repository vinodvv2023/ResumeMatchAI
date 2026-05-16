import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Zap, Briefcase, Sparkles, Shield, Link2, Copy, ClipboardList, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';

function StepCard({ icon: Icon, title, desc, step }: { icon: React.ElementType; title: string; desc: string; step: number }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
        {Icon && <Icon size={18} />}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400/60">Step {step}</span>
        </div>
        <p className="text-white font-medium text-sm">{title}</p>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Left - Auth Form */}
        <div className="max-w-md mx-auto w-full lg:mx-0">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 mt-2">
              {isRegister
                ? 'Sign up to start screening resumes with AI'
                : 'Sign in to your ResumeMatch AI account'}
            </p>
          </div>

          <div className="glass-card !p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="glass-input w-full !pl-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    placeholder={isRegister ? 'Min. 6 characters' : 'Enter password'}
                    className="glass-input w-full !pl-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      className="glass-input w-full !pl-11"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="glass-button w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRegister ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-400">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </span>{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>

        {/* Right - About & How It Works */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">ResumeMatch AI</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              A privacy-first AI resume screening platform. Recruiters create job postings, share Magic Links with candidates, and get instant AI-powered match scores. All personally identifiable information (PII) is redacted before processing.
            </p>
          </div>

          {/* Who Benefits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card !p-4">
              <Briefcase size={20} className="text-violet-400 mb-2" />
              <h4 className="text-sm font-semibold text-white">Recruiters / HR</h4>
              <p className="text-xs text-slate-400 mt-1">Screen hundreds of resumes in minutes, not hours. AI scores each candidate against your job requirements.</p>
            </div>
            <div className="glass-card !p-4">
              <Sparkles size={20} className="text-indigo-400 mb-2" />
              <h4 className="text-sm font-semibold text-white">Candidates</h4>
              <p className="text-xs text-slate-400 mt-1">Get instant feedback with a match score, matched skills, and a skills gap analysis after submitting a resume.</p>
            </div>
          </div>

          {/* How Magic Links Work */}
          <div className="glass-card !p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-violet-400" />
              How Magic Links Work
            </h3>

            <StepCard
              icon={ClipboardList}
              step={1}
              title="Create a Job Posting"
              desc="Define the job title, description, and a pass threshold (0-100%). A unique Magic Link is auto-generated."
            />
            <StepCard
              icon={Copy}
              step={2}
              title="Copy & Share the Link"
              desc="Click the copy button next to the Magic Link on your Dashboard. Share it via email, LinkedIn, or any channel with candidates."
            />
            <StepCard
              icon={Link2}
              step={3}
              title="Candidates Apply via Link"
              desc="Candidates open the link, consent to AI processing, and upload their resume. No sign-up needed for them."
            />
            <StepCard
              icon={CheckCircle}
              step={4}
              title="Review Results in Registry"
              desc="Each processed resume gets a score, matched/missing skills breakdown, and a pass/fail decision. View full history anytime."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
