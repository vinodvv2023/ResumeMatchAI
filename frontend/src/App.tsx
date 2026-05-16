import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import CreateJob from './pages/CreateJob';
import EditJob from './pages/EditJob';
import Registry from './pages/Registry';
import ApplyGate from './pages/ApplyGate';
import LoginPage from './pages/LoginPage';
import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, KeyRound, X, Loader2, Check } from 'lucide-react';
import api from './lib/api';

function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters'); return; }

    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { current_password: currentPw, new_password: newPw });
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setShowChangePw(false); setPwSuccess(false); setDropdownOpen(false); }, 1500);
    } catch (err: any) {
      setPwError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-3 border-b border-white/5 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-300">{user.email}</span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            <LogOut size={16} />
            Logout
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-card !p-2 z-50">
              <button
                onClick={() => { setShowChangePw(true); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <KeyRound size={16} />
                Change Password
              </button>
              <hr className="border-white/5 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {showChangePw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-0 border-white/20 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound size={20} className="text-violet-400" />
                Change Password
              </h3>
              <button onClick={() => { setShowChangePw(false); setPwError(''); setPwSuccess(false); }} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {pwError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm">{pwError}</div>}
              {pwSuccess && <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><Check size={16} /> Password updated!</div>}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                <input type="password" required className="glass-input w-full" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <input type="password" required className="glass-input w-full" value={newPw} onChange={e => setNewPw(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input type="password" required className="glass-input w-full" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
              </div>
              <button type="submit" disabled={pwLoading} className="glass-button w-full flex items-center justify-center gap-2">
                {pwLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <main className="container mx-auto px-4 py-4 max-w-6xl">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/apply/:token" element={<ApplyGate />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create-job" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
              <Route path="/edit-job/:id" element={<ProtectedRoute><EditJob /></ProtectedRoute>} />
              <Route path="/registry" element={<ProtectedRoute><Registry /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
