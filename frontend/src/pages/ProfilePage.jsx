import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const mono = "'JetBrains Mono', monospace";

const LANGUAGES = [
  { code:'en', name:'English', flag:'🇬🇧' },
  { code:'hi', name:'Hindi', flag:'🇮��' },
  { code:'fr', name:'French', flag:'🇫🇷' },
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

function StatCard({ icon, value, label, color, delay }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      style={{ background:'#0c0c0c', border:`1px solid ${color}22`, borderRadius:4, padding:'16px', display:'flex', flexDirection:'column', gap:6, fontFamily:mono }}>
      <div style={{ fontSize:10, color:'#333' }}>// {label}</div>
      <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:10, color:'#444' }}>{icon} {label.toLowerCase()}</div>
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
      setProfile(p.data); setStats(s.data);
      setForm({ bio: p.data.bio || '', avatarUrl: p.data.avatarUrl || '', preferredLanguage: p.data.preferredLanguage || 'en' });
    } catch { toast.error('// failed to load'); }
    finally { setLoading(false); }
  }

  async function save() {
    setSaving(true);
    try {
      await userApi.updateProfile(form);
      setProfile(p => ({ ...p, ...form }));
      setEditing(false);
      toast.success('// profile updated');
    } catch { toast.error('// save failed'); }
    finally { setSaving(false); }
  }

  const lang = LANGUAGES.find(l => l.code === (profile?.preferredLanguage || 'en'));

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:mono }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:12, color:'#7b2fff', marginBottom:8 }}>// loading profile data...</div>
        <div style={{ width:200, height:1, background:'#1a1a1a', position:'relative', overflow:'hidden' }}>
          <motion.div animate={{ x:['-100%','100%'] }} transition={{ repeat:Infinity, duration:1.2, ease:'linear' }}
            style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent, #7b2fff, transparent)' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#080808', fontFamily:mono, color:'#e0e0e0' }}>
      <Toaster position="top-center" toastOptions={{
        style: { background:'#0c0c0c', color:'#00ff88', border:'1px solid #00ff8833', fontSize:12, fontFamily:mono }
      }} />

      <div style={{ borderBottom:'1px solid #1a1a1a', background:'#080808' }}>
        <div style={{ maxWidth:700, margin:'0 auto', padding:'0 20px', height:44, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => navigate('/chat')}
            style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:12, fontFamily:mono }}
            onMouseEnter={e => e.target.style.color='#00ff88'}
            onMouseLeave={e => e.target.style.color='#444'}>
            back_to_chat()
          </button>
          <div style={{ fontSize:11, color:'#333' }}>// user_profile.exe</div>
          <button onClick={logout}
            style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:11, fontFamily:mono }}
            onMouseEnter={e => e.target.style.color='#ff4455'}
            onMouseLeave={e => e.target.style.color='#333'}>
            logout()
          </button>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:16 }}>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:'#0c0c0c', border:'1px solid #1a1a1a', borderRadius:4, padding:'24px' }}>
          <div style={{ fontSize:10, color:'#333', marginBottom:16 }}>// user_object</div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="avatar"
                  style={{ width:64, height:64, borderRadius:4, objectFit:'cover', border:'1px solid #7b2fff44' }} />
              ) : (
                <div style={{ width:64, height:64, borderRadius:4, background:'#7b2fff11', border:'1px solid #7b2fff44', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#7b2fff' }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ position:'absolute', bottom:-3, right:-3, width:10, height:10, borderRadius:'50%', background:'#00ff88', border:'2px solid #080808' }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#e0e0e0', marginBottom:2 }}>@{profile?.username}</div>
              <div style={{ fontSize:11, color:'#444', marginBottom:8 }}>{profile?.email}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, color:'#7b2fff', border:'1px solid #7b2fff33', padding:'2px 8px', borderRadius:3 }}>
                  {lang?.flag} {lang?.name}
                </span>
                <span style={{ fontSize:10, color:'#333', border:'1px solid #1a1a1a', padding:'2px 8px', borderRadius:3 }}>
                  joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '—'}
                </span>
                <span style={{ fontSize:10, color:'#00ff88', border:'1px solid #00ff8833', padding:'2px 8px', borderRadius:3 }}>
                  online
                </span>
              </div>
            </div>
            <button onClick={() => setEditing(p => !p)}
              style={{ background:'transparent', border:`1px solid ${editing ? '#ff445544' : '#7b2fff44'}`, color: editing ? '#ff4455' : '#7b2fff', padding:'6px 14px', fontSize:11, fontFamily:mono, borderRadius:3, cursor:'pointer', flexShrink:0 }}>
              {editing ? 'cancel()' : 'edit()'}
            </button>
          </div>
          {profile?.bio && !editing && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #111', fontSize:12, color:'#444', fontStyle:'italic' }}>
              // "{profile.bio}"
            </div>
          )}
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
          <StatCard icon="💬" value={stats?.totalConversations ?? 0} label="Conversations" color="#7b2fff" delay={0.1} />
          <StatCard icon="📨" value={stats?.totalMessages ?? 0} label="Messages" color="#00ff88" delay={0.15} />
          <StatCard icon="🌍" value="100+" label="Languages" color="#7b2fff" delay={0.2} />
        </div>

        {editing && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:'#0c0c0c', border:'1px solid #7b2fff22', borderRadius:4, padding:'24px', display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ fontSize:10, color:'#7b2fff' }}>// edit_profile()</div>
            <div>
              <div style={{ fontSize:10, color:'#444', marginBottom:6 }}>bio =</div>
              <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio:e.target.value}))}
                placeholder="// write something about yourself..."
                rows={3} className="input-field" style={{ resize:'none' }} />
            </div>
            <div>
              <div style={{ fontSize:10, color:'#444', marginBottom:6 }}>avatar_url =</div>
              <input value={form.avatarUrl} onChange={e => setForm(p => ({...p, avatarUrl:e.target.value}))}
                placeholder='"https://example.com/avatar.jpg"' className="input-field" />
            </div>
            <div>
              <div style={{ fontSize:10, color:'#444', marginBottom:6 }}>preferred_language =</div>
              <select value={form.preferredLanguage} onChange={e => setForm(p => ({...p, preferredLanguage:e.target.value}))}
                className="input-field">
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>
            <motion.button onClick={save} disabled={saving}
              whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
              style={{ padding:'12px', fontSize:12, fontFamily:mono, background: saving ? 'transparent' : '#7b2fff', border:'1px solid #7b2fff', color: saving ? '#7b2fff' : '#000', borderRadius:3, cursor: saving ? 'wait' : 'pointer', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {saving ? 'saving...' : 'save_profile()'}
            </motion.button>
          </motion.div>
        )}

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
          style={{ background:'#0c0c0c', border:'1px solid #1a1a1a', borderRadius:4, padding:'16px' }}>
          <div style={{ fontSize:10, color:'#333', marginBottom:10 }}>// tech_stack</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {['java_spring_boot','react_19','groq_llama_3.3_70b','supabase_postgresql','allminilm_l6v2','jwt_auth','vector_embeddings','bcrypt'].map(t => (
              <span key={t} style={{ fontSize:10, color:'#444', border:'1px solid #1a1a1a', padding:'3px 8px', borderRadius:3 }}>{t}</span>
            ))}
          </div>
        </motion.div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
