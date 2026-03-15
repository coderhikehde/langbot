import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { code:'en', name:'English', flag:'🇬🇧' },
  { code:'hi', name:'Hindi', flag:'🇮🇳' },
  { code:'fr', name:'French', flag:'🇫��' },
  { code:'es', name:'Spanish', flag:'🇪🇸' },
  { code:'de', name:'German', flag:'🇩🇪' },
  { code:'ja', name:'Japanese', flag:'🇯🇵' },
  { code:'zh', name:'Chinese', flag:'🇨🇳' },
  { code:'ar', name:'Arabic', flag:'🇸🇦' },
  { code:'pt', name:'Portuguese', flag:'🇧🇷' },
  { code:'ru', name:'Russian', flag:'🇷🇺' },
  { code:'ko', name:'Korean', flag:'🇰🇷' },
  { code:'it', name:'Italian', flag:'🇮🇹' },
];

function StatCard({ icon, value, label, delay }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ delay }} className="card p-5 flex flex-col items-center gap-1.5 text-center">
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-bold text-surface-50">{value}</span>
      <span className="text-xs text-surface-500 font-medium">{label}</span>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio:'', avatarUrl:'', preferredLanguage:'en' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [p, s] = await Promise.all([userApi.getProfile(), userApi.getStats()]);
      setProfile(p.data);
      setStats(s.data);
      setForm({ bio: p.data.bio || '', avatarUrl: p.data.avatarUrl || '', preferredLanguage: p.data.preferredLanguage || 'en' });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }

  async function save() {
    setSaving(true);
    try {
      await userApi.updateProfile(form);
      setProfile(p => ({ ...p, ...form }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }

  const lang = LANGUAGES.find(l => l.code === (profile?.preferredLanguage || 'en'));
  const initials = user?.username?.[0]?.toUpperCase() || '?';

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-surface-700 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100">
      <Toaster position="top-center" toastOptions={{
        style: { background:'#18181b', color:'#fafafa', border:'1px solid #27272a', fontSize:14 }
      }} />

      {/* Header */}
      <header className="border-b border-surface-800 bg-surface-900">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/chat')} className="btn-ghost text-sm flex items-center gap-1.5">
            ← Back to Chat
          </button>
          <span className="font-semibold text-surface-200">Profile</span>
          <button onClick={logout} className="btn-ghost text-sm text-surface-500">Sign out</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Profile card */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card p-6">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-600" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-brand-600">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-surface-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-surface-50">@{profile?.username}</h2>
              <p className="text-sm text-surface-500 mb-2">{profile?.email}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge bg-brand-900/50 border border-brand-800 text-brand-300">
                  {lang?.flag} {lang?.name}
                </span>
                <span className="badge bg-surface-800 text-surface-400">
                  Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '—'}
                </span>
              </div>
            </div>
            <button onClick={() => setEditing(p => !p)}
              className={`btn-secondary text-sm flex-shrink-0 ${editing ? 'border-red-800 text-red-400' : ''}`}>
              {editing ? '✕ Cancel' : '✏️ Edit'}
            </button>
          </div>

          {profile?.bio && !editing && (
            <p className="mt-4 text-sm text-surface-400 leading-relaxed border-t border-surface-800 pt-4 italic">
              "{profile.bio}"
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="💬" value={stats?.totalConversations ?? 0} label="Conversations" delay={0.1} />
          <StatCard icon="��" value={stats?.totalMessages ?? 0} label="Messages" delay={0.15} />
          <StatCard icon="🌍" value="100+" label="Languages" delay={0.2} />
        </div>

        {/* Edit form */}
        <AnimatePresenceWrapper show={editing}>
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:8 }} className="card p-6 space-y-4">
            <h3 className="font-semibold text-surface-200 mb-4">Edit Profile</h3>

            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5 block">Bio</label>
              <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))}
                placeholder="Tell something about yourself..."
                rows={3} className="input-field resize-none" />
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5 block">Avatar URL</label>
              <input value={form.avatarUrl} onChange={e => setForm(p => ({...p, avatarUrl: e.target.value}))}
                placeholder="https://example.com/avatar.jpg" className="input-field" />
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5 block">Preferred Language</label>
              <select value={form.preferredLanguage} onChange={e => setForm(p => ({...p, preferredLanguage: e.target.value}))}
                className="input-field">
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>

            <motion.button onClick={save} disabled={saving}
              whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
              className="btn-primary w-full flex items-center justify-center gap-2 h-10">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '💾 Save Changes'}
            </motion.button>
          </motion.div>
        </AnimatePresenceWrapper>

        {/* Tech stack */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
          className="card p-5">
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Powered by</h3>
          <div className="flex flex-wrap gap-2">
            {['Java Spring Boot','React 19','Groq Llama 3.3 70B','Supabase PostgreSQL','AllMiniLmL6V2','JWT Auth'].map(t => (
              <span key={t} className="badge bg-surface-800 border border-surface-700 text-surface-400 text-xs">{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AnimatePresenceWrapper({ show, children }) {
  if (!show) return null;
  return children;
}
