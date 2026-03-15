import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

const BOOT_LINES = [
  '> initializing langbot_v2...',
  '> loading language models... [OK]',
  '> connecting to groq api... [OK]',
  '> vector memory online... [OK]',
  '> 100+ languages supported... [OK]',
  '> system ready.',
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
        toast.success('// access granted');
      } else {
        await register(form.username, form.email, form.password);
        toast.success('// account created');
      }
    } catch (err) {
      toast.error('// ' + (err.response?.data?.message || 'access denied'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', fontFamily: "'JetBrains Mono', monospace" }}>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0c0c0c', color: '#00ff88', border: '1px solid #00ff8833', fontSize: 13, fontFamily: 'JetBrains Mono' }
      }} />

      {/* Left terminal panel */}
      <div style={{ width: 420, background: '#080808', borderRight: '1px solid #1a1a1a', padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: 0 }} className="hidden lg:flex">
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: '#333', marginBottom: 8 }}>langbot_v2.0 // multilingual ai</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#7b2fff', letterSpacing: -1 }} className="animate-flicker">
            LANG<span style={{ color: '#00ff88' }}>BOT</span>
          </div>
          <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>_terminal interface</div>
        </div>

        <div style={{ flex: 1 }}>
          {BOOT_LINES.map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              style={{ fontSize: 12, color: i === BOOT_LINES.length - 1 ? '#00ff88' : '#333', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>
              {line}
            </motion.div>
          ))}
          <div style={{ marginTop: 8, fontSize: 12, color: '#00ff88' }} className="terminal-cursor" />
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 24, marginTop: 24 }}>
          <div style={{ fontSize: 11, color: '#222', marginBottom: 12 }}>// supported languages</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['EN','HI','FR','ES','DE','JA','ZH','AR','PT','RU','KO','IT'].map(l => (
              <span key={l} style={{ fontSize: 10, color: '#333', border: '1px solid #1a1a1a', padding: '2px 6px', borderRadius: 3 }}>{l}</span>
            ))}
            <span style={{ fontSize: 10, color: '#7b2fff', border: '1px solid #7b2fff33', padding: '2px 6px', borderRadius: 3 }}>+90</span>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 380 }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#333', marginBottom: 8 }}>
              {tab === 'login' ? '// authenticate user' : '// register new user'}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e0e0e0', margin: 0 }}>
              {tab === 'login' ? 'sign_in()' : 'create_account()'}
            </h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid #1a1a1a' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px 0', fontSize: 12, fontFamily: 'JetBrains Mono',
                background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #7b2fff' : '2px solid transparent',
                color: tab === t ? '#7b2fff' : '#444', cursor: 'pointer', transition: 'all 0.15s',
                marginBottom: -1
              }}>
                {t === 'login' ? '.login' : '.register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#444', marginBottom: 6 }}>const username =</div>
              <input name="username" type="text" placeholder='"yourname"'
                value={form.username} onChange={handleChange} required className="input-field" />
            </div>

            <AnimatePresence>
              {tab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 6 }}>const email =</div>
                  <input name="email" type="email" placeholder='"you@example.com"'
                    value={form.email} onChange={handleChange} required className="input-field" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div style={{ fontSize: 10, color: '#444', marginBottom: 6 }}>const password =</div>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPass ? 'text' : 'password'}
                  placeholder='"min 8 chars"' value={form.password}
                  onChange={handleChange} required minLength={8}
                  className="input-field" style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 12,
                  fontFamily: 'JetBrains Mono'
                }}>
                  {showPass ? '[hide]' : '[show]'}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{
                marginTop: 8, padding: '12px', fontSize: 13, fontFamily: 'JetBrains Mono',
                background: loading ? '#7b2fff11' : '#7b2fff',
                border: '1px solid #7b2fff',
                color: loading ? '#7b2fff' : '#000',
                borderRadius: 4, cursor: loading ? 'wait' : 'pointer',
                fontWeight: 600, transition: 'all 0.15s', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
              {loading ? (
                <>
                  <div style={{ width: 12, height: 12, border: '2px solid #7b2fff44', borderTop: '2px solid #7b2fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  processing...
                </>
              ) : (
                tab === 'login' ? '> execute login()' : '> execute register()'
              )}
            </motion.button>
          </form>

          <div style={{ marginTop: 24, fontSize: 10, color: '#222', textAlign: 'center' }}>
            // langbot_v2 · powered by llama 3.3 70b · zero cost
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
