import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ko', name: 'Korean', flag: '��🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', avatarUrl: '', preferredLanguage: 'en' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileRes, statsRes] = await Promise.all([
        userApi.getProfile(),
        userApi.getStats(),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setForm({
        bio: profileRes.data.bio || '',
        avatarUrl: profileRes.data.avatarUrl || '',
        preferredLanguage: profileRes.data.preferredLanguage || 'en',
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await userApi.updateProfile(form);
      setProfile(prev => ({ ...prev, ...form }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const avatarLetter = user?.username?.[0]?.toUpperCase() || '?';
  const selectedLang = LANGUAGES.find(l => l.code === (profile?.preferredLanguage || 'en'));

  if (loading) return (
    <div style={{ ...s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={s.spinner} />
    </div>
  );

  return (
    <div style={s.bg}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e1e2e', color: '#cdd6f4', border: '1px solid #313244' } }} />
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={() => navigate('/chat')} style={s.backBtn}>← Back to Chat</button>
          <h1 style={s.headerTitle}>Profile</h1>
          <button onClick={logout} style={s.logoutBtn}>Sign Out</button>
        </div>

        {/* Avatar + Name */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={s.profileCard}>
          <div style={s.avatarWrap}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="avatar" style={s.avatarImg} />
            ) : (
              <div style={s.avatarLetter}>{avatarLetter}</div>
            )}
          </div>
          <div>
            <h2 style={s.username}>@{profile?.username}</h2>
            <p style={s.email}>{profile?.email}</p>
            <p style={s.langBadge}>{selectedLang?.flag} {selectedLang?.name}</p>
          </div>
          <button onClick={() => setEditing(!editing)} style={s.editBtn}>
            {editing ? '✕ Cancel' : '✏️ Edit'}
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={s.statsRow}>
          {[
            { label: 'Conversations', value: stats?.totalConversations ?? 0, icon: '💬' },
            { label: 'Messages', value: stats?.totalMessages ?? 0, icon: '📨' },
            { label: 'Languages', value: '100+', icon: '🌍' },
          ].map((stat, i) => (
            <div key={i} style={s.statCard}>
              <span style={s.statIcon}>{stat.icon}</span>
              <span style={s.statValue}>{stat.value}</span>
              <span style={s.statLabel}>{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Edit Form */}
        {editing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={s.editCard}>
            <h3 style={s.editTitle}>Edit Profile</h3>
            <label style={s.label}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell something about yourself..." style={s.textarea} rows={3} />
            <label style={s.label}>Avatar URL</label>
            <input value={form.avatarUrl} onChange={e => setForm(p => ({ ...p, avatarUrl: e.target.value }))}
              placeholder="https://example.com/avatar.jpg" style={s.inputField} />
            <label style={s.label}>Preferred Language</label>
            <select value={form.preferredLanguage} onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))} style={s.select}>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
            <motion.button onClick={saveProfile} disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={s.saveBtn}>
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </motion.button>
          </motion.div>
        )}

        {/* Bio display */}
        {!editing && profile?.bio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.bioCard}>
            <p style={s.bioText}>"{profile.bio}"</p>
          </motion.div>
        )}

        {/* Member since */}
        <p style={s.memberSince}>
          Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </p>
      </div>
    </div>
  );
}

const s = {
  bg: { minHeight: '100vh', background: '#1e1e2e', fontFamily: "'Inter', system-ui, sans-serif", color: '#cdd6f4' },
  container: { maxWidth: 640, margin: '0 auto', padding: '24px 20px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  headerTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#cdd6f4' },
  backBtn: { background: '#313244', border: 'none', color: '#cdd6f4', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  logoutBtn: { background: 'transparent', border: '1px solid #45475a', color: '#6c7086', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  profileCard: { background: '#181825', border: '1px solid #313244', borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, position: 'relative' },
  avatarWrap: { flexShrink: 0 },
  avatarImg: { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #7c3aed' },
  avatarLetter: { width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', border: '3px solid #313244' },
  username: { margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#cdd6f4' },
  email: { margin: '0 0 8px', fontSize: 13, color: '#6c7086' },
  langBadge: { margin: 0, fontSize: 13, background: '#313244', display: 'inline-block', padding: '3px 10px', borderRadius: 99, color: '#a6e3a1' },
  editBtn: { marginLeft: 'auto', background: '#313244', border: 'none', color: '#cdd6f4', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start' },
  statsRow: { display: 'flex', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, background: '#181825', border: '1px solid #313244', borderRadius: 14, padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 26, fontWeight: 800, color: '#cdd6f4' },
  statLabel: { fontSize: 12, color: '#6c7086', fontWeight: 500 },
  editCard: { background: '#181825', border: '1px solid #313244', borderRadius: 16, padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  editTitle: { margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#cdd6f4' },
  label: { fontSize: 12, fontWeight: 600, color: '#6c7086', textTransform: 'uppercase', letterSpacing: 0.5 },
  textarea: { background: '#11111b', border: '1px solid #313244', borderRadius: 10, padding: '12px 14px', color: '#cdd6f4', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
  inputField: { background: '#11111b', border: '1px solid #313244', borderRadius: 10, padding: '12px 14px', color: '#cdd6f4', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  select: { background: '#11111b', border: '1px solid #313244', borderRadius: 10, padding: '12px 14px', color: '#cdd6f4', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  saveBtn: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  bioCard: { background: '#181825', border: '1px solid #313244', borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  bioText: { margin: 0, fontSize: 15, color: '#a6adc8', fontStyle: 'italic', lineHeight: 1.6 },
  memberSince: { textAlign: 'center', fontSize: 12, color: '#45475a', marginTop: 8 },
  spinner: { width: 40, height: 40, border: '3px solid #313244', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};
