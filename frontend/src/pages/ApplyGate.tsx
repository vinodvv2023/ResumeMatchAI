import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, FileUp, Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import type { TokenInfo, MatchResult } from '../types';

export default function ApplyGate() {
  const { token } = useParams<{ token: string }>();
  
  const [step, setStep] = useState<'loading' | 'invalid' | 'consent' | 'upload' | 'processing' | 'pass' | 'fail'>('loading');
  const [jobInfo, setJobInfo] = useState<TokenInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // App form state
  const [appForm, setAppForm] = useState({ name: '', email: '', phone: '', linkedin: '', portfolio: '', cover_letter: '' });
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appSuccess, setAppSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await api.get<TokenInfo>(`/apply/${token}`);
        setJobInfo(response.data);
        if (response.data.valid) {
          setStep('consent');
        } else {
          setStep('invalid');
        }
      } catch (err) {
        setStep('invalid');
      }
    };
    if (token) validateToken();
  }, [token]);

  const normalizeUrl = (url: string | undefined): string => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    
    // Prepend https:// if missing
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return ''; // Invalid URL
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    
    setStep('processing');
    setError(null);
    
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    try {
      const response = await api.post<MatchResult>(`/apply/${token}/upload-b64`, {
        filename: file.name,
        file_b64: base64,
      });
      setResult(response.data);
      
      // Auto-prefill form from extracted data
      if (response.data.extracted_data) {
        setAppForm(prev => ({
          ...prev,
          name: response.data.extracted_data?.name || prev.name,
          email: response.data.extracted_data?.email || prev.email,
          phone: response.data.extracted_data?.phone || prev.phone,
          linkedin: normalizeUrl(response.data.extracted_data?.linkedin) || prev.linkedin,
          portfolio: normalizeUrl(response.data.extracted_data?.portfolio) || prev.portfolio,
        }));
      }

      setStep(response.data.passed ? 'pass' : 'fail');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to process resume');
      }
      setStep('upload');
    }
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    
    setAppSubmitting(true);
    try {
      await api.post('/applications', { ...appForm, match_id: result.match_id });
      setAppSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to submit application');
      }
    } finally {
      setAppSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (step === 'invalid') {
    return (
      <div className="max-w-md mx-auto text-center mt-20">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-2">Link Expired</h2>
        <p className="text-slate-400">This magic link is no longer valid or the job has been closed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-10">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Apply for {jobInfo?.job_title}</h1>
        <p className="text-slate-400">Powered by ResumeMatch AI</p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Step 1: Consent */}
        {step === 'consent' && (
          <motion.div key="consent" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="glass-card max-w-xl mx-auto text-center p-8">
            <ShieldAlert className="w-16 h-16 text-violet-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">AI Data Processing Consent</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              By proceeding, you consent to having your resume parsed and evaluated by our automated AI systems. 
              Your data will be used solely for evaluating your fit for the <span className="font-semibold text-white">{jobInfo?.job_title}</span> role.
            </p>
            <button onClick={() => setStep('upload')} className="glass-button w-full flex items-center justify-center gap-2">
              I Consent, Continue <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {/* Step 2: Upload */}
        {step === 'upload' && (
          <motion.div key="upload" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Side: Job Description */}
              <div className="glass-card p-8 h-full flex flex-col">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Job Description</h2>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {jobInfo?.job_description}
                </div>
              </div>

              {/* Right Side: Upload */}
              <div className="glass-card p-8 h-full flex flex-col">
                <h2 className="text-xl font-bold text-white mb-6">Upload Your Resume</h2>
                
                {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6">{error}</div>}

                <div className="flex-1 border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer relative group flex flex-col items-center justify-center min-h-[200px]">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.docx,.doc,.rtf,.txt"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  />
                  <FileUp className="w-12 h-12 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-base font-medium text-white mb-1">
                    {file ? file.name : "Click or drag file here"}
                  </p>
                  <p className="text-xs text-slate-400">PDF, DOCX, RTF, TXT (Max 10MB)</p>
                </div>

                <button 
                  onClick={handleUpload} 
                  disabled={!file} 
                  className="glass-button w-full mt-6"
                >
                  Analyze Resume
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <motion.div key="processing" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center py-20">
            <Loader2 className="w-20 h-20 text-violet-500 animate-spin mx-auto mb-8" />
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing your profile...</h2>
            <p className="text-slate-400">Extracting skills, parsing experience, and matching against requirements.</p>
          </motion.div>
        )}

        {/* Step 4a: Fail */}
        {step === 'fail' && result && (
          <motion.div key="fail" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="glass-card">
            <div className="text-center mb-8">
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-2">Not a fit right now</h2>
              <p className="text-slate-400 text-lg">Your match score was <span className="font-bold text-white">{result.score}%</span>.</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Skills Gap Analysis</h3>
              <p className="text-slate-300 mb-6 text-sm">{result.summary}</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2 uppercase tracking-wider">Matched Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map(s => (
                      <span key={s} className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">{s}</span>
                    ))}
                    {result.matched_skills.length === 0 && <span className="text-slate-500 text-sm italic">None detected</span>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wider mt-6">Missing Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map(s => (
                      <span key={s} className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4b: Pass */}
        {step === 'pass' && result && (
          <motion.div key="pass" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="glass-card">
            {appSuccess ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-2">Application Submitted!</h2>
                <p className="text-slate-400">Our team will be in touch with you shortly.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-10">
                <div>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                  <h2 className="text-3xl font-bold text-white mb-2">Great Match!</h2>
                  <p className="text-slate-400 mb-6">Your profile is a strong fit with a score of <span className="text-green-400 font-bold">{result.score}%</span>. Please complete your application below.</p>
                  
                  <div className="bg-black/20 rounded-xl p-5 mb-6">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Top Matched Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_skills.slice(0, 6).map(s => (
                        <span key={s} className="bg-white/10 text-slate-200 px-2 py-1 rounded-md text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <form onSubmit={submitApplication} className="space-y-4">
                    {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</div>}
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                      <input required type="text" className="glass-input w-full" value={appForm.name} onChange={e => setAppForm({...appForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                      <input required type="email" className="glass-input w-full" value={appForm.email} onChange={e => setAppForm({...appForm, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                      <input type="tel" className="glass-input w-full" value={appForm.phone} onChange={e => setAppForm({...appForm, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn URL</label>
                      <input type="url" className="glass-input w-full" value={appForm.linkedin} onChange={e => setAppForm({...appForm, linkedin: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Portfolio URL</label>
                      <input type="url" className="glass-input w-full" value={appForm.portfolio} onChange={e => setAppForm({...appForm, portfolio: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Covering Letter</label>
                      <textarea 
                        className="glass-input w-full min-h-[120px] py-3" 
                        placeholder="Tell us why you are a great fit..."
                        value={appForm.cover_letter} 
                        onChange={e => setAppForm({...appForm, cover_letter: e.target.value})} 
                      />
                    </div>

                    <button type="submit" disabled={appSubmitting} className="glass-button w-full mt-4 flex items-center justify-center">
                      {appSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
