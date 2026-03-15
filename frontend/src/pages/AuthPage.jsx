import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(formData.username, formData.password);
        toast.success('Welcome back!');
      } else {
        await register(formData.username, formData.email, formData.password);
        toast.success('Account created!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.bg}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e1e2e', color: '#cdd6f4', border: '1px solid #313244' } }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={s.card}>
        <div style={s.logoWrap}>
          <span style={s.logoEmoji}>🌍</span>
          <div>
            <h1 style={s.title}>LangBot</h1>
            <p style={s.subtitle}>Chat in any language</p>
          </div>
        </div>
        <div style={s.tabs}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.inputWrap}>
            <span style={s.inputIcon}>👤</span>
            <input name="username" type="text" placeholder="Username" value={formData.username}
              onChange={handleChange} required style={s.input} />
          </div>
          {tab === 'register' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={s.inputWrap}>
              <span style={s.inputIcon}>✉️</span>
              <input name="email" type="email" placeholder="Email" value={formData.email}
                onChange={handleChange} required style={s.input} />
            </motion.div>
          )}
          <div style={s.inputWrap}>
            <span style={s.inputIcon}>🔒</span>
            <input name="password" type="password" placeholder="Password" value={formData.password}
              onChange={handleChange} required minLength={8} style={s.input} />
          </div>
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={s.btn}>
            {loading ? '⏳ Please wait...' : tab === 'login' ? '🚀 Sign In' : '✨ Create Account'}
          </motion.button>
        </form>
        <p style={s.langs}>🇬🇧 🇫🇷 🇪🇸 🇩🇪 🇯🇵 🇸🇦 🇨�� 🇮🇳 🇧🇷 🇷🇺 + 90 more</p>
      </motion.div>
    </div>
  );
}

const s = {
  bg: { minHeight: '100vh', background: '#1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" },
  card: { background: '#181825', border: '1px solid #313244', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 },
  logoEmoji: { fontSize: 52 },
  title: { margin: 0, fontSize: 28, fontWeight: 800, color: '#cdd6f4', letterSpacing: '-0.5px' },
  subtitle: { margin: '2px 0 0', fontSize: 13, color: '#6c7086' },
  tabs: { display: 'flex', background: '#11111b', borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 },
  tab: { flex: 1, border: 'none', background: 'transparent', padding: '9px 0', borderRadius: 7, cursor: 'pointer', fontWeight: 600, color: '#6c7086', fontSize: 14, transition: 'all 0.2s' },
  tabActive: { background: '#313244', color: '#cdd6f4' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  inputWrap: { display: 'flex', alignItems: 'center', background: '#11111b', border: '1px solid #313244', borderRadius: 10, padding: '0 14px', gap: 10 },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, border: 'none', background: 'transparent', padding: '13px 0', fontSize: 14, color: '#cdd6f4', outline: 'none', fontFamily: 'inherit' },
  btn: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
  langs: { textAlign: 'center', marginTop: 24, fontSize: 18, letterSpacing: 2 },
};
