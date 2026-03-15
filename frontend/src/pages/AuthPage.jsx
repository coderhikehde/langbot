import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

const FEATURES = [
  { icon: '🌍', text: '100+ languages supported' },
  { icon: '🧠', text: 'Cross-language vector memory' },
  { icon: '⚡', text: 'Powered by Llama 3.3 70B' },
  { icon: '🔒', text: 'JWT secured & BCrypt hashed' },
];

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.username, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.username, form.email, form.password);
        toast.success('Account created!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#18181b', color: '#fafafa', border: '1px solid #27272a', fontSize: 14 }
      }} />

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-surface-900 border-r border-surface-800 p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <span className="text-3xl">🌍</span>
            <span className="text-xl font-bold text-surface-50">LangBot</span>
          </div>
          <h1 className="text-4xl font-bold text-surface-50 leading-tight mb-4">
            Chat in any<br />
            <span className="gradient-text">language.</span>
          </h1>
          <p className="text-surface-400 text-lg leading-relaxed mb-12">
            The AI assistant that understands you — no matter what language you speak in.
          </p>
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="flex items-center gap-3 text-surface-300">
                <span className="text-xl w-8">{f.icon}</span>
                <span className="text-sm font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['🇬🇧','🇫🇷','🇪🇸','🇩🇪','🇯🇵','🇸🇦','🇨🇳','🇮🇳','🇧🇷','🇷🇺','🇰🇷','🇮🇹'].map((f, i) => (
            <span key={i} className="text-2xl">{f}</span>
          ))}
          <span className="text-surface-500 text-sm self-center ml-1">+90 more</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🌍</span>
            <span className="text-lg font-bold">LangBot</span>
          </div>

          <h2 className="text-2xl font-bold text-surface-50 mb-1">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-surface-500 text-sm mb-8">
            {tab === 'login' ? 'Sign in to continue chatting' : 'Start chatting in any language'}
          </p>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface-900 border border-surface-800 p-1 rounded-lg mb-6">
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-150 ${
                  tab === t ? 'bg-surface-700 text-surface-50' : 'text-surface-500 hover:text-surface-300'
                }`}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5 block">
                Username
              </label>
              <input name="username" type="text" placeholder="yourname"
                value={form.username} onChange={handleChange} required
                className="input-field" />
            </div>

            <AnimatePresence>
              {tab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}>
                  <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5 block">
                    Email
                  </label>
                  <input name="email" type="email" placeholder="you@example.com"
                    value={form.email} onChange={handleChange} required
                    className="input-field" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 characters" value={form.password}
                  onChange={handleChange} required minLength={8}
                  className="input-field pr-12" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors text-lg">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 h-11">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{tab === 'login' ? '→ Sign In' : '✨ Create Account'}</>
              )}
            </motion.button>
          </form>

          <p className="text-center text-surface-600 text-xs mt-6">
            By continuing, you agree to our terms of service
          </p>
        </motion.div>
      </div>
    </div>
  );
}
