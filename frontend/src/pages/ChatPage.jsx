import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const LANG_FLAGS = {
  en:'🇬🇧',fr:'🇫🇷',es:'🇪🇸',de:'🇩🇪',it:'🇮🇹',
  ja:'🇯🇵',zh:'🇨🇳',ar:'🇸🇦',pt:'🇧🇷',ru:'🇷🇺',
  ko:'🇰🇷',hi:'🇮🇳',nl:'🇳🇱',pl:'🇵🇱',tr:'🇹🇷',
};

const EXAMPLES = ['Hello! What can you do?','Bonjour!','こんにちは!','مرحبا!','नमस्ते!','Hola!'];

const mono = "'JetBrains Mono', monospace";

function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8 }} className="animate-scan-in">
      <div style={{ width:24, height:24, borderRadius:3, border:'1px solid #00ff8844', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#00ff88', fontFamily:mono }}>AI</div>
      <div style={{ background:'#0c0c0c', border:'1px solid #00ff8822', borderRadius:'0 6px 6px 6px', padding:'10px 14px', display:'flex', gap:4 }}>
        {[0,1,2].map(i => (
          <motion.div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#00ff88' }}
            animate={{ opacity:[0.2,1,0.2] }} transition={{ repeat:Infinity, duration:0.8, delay:i*0.2 }} />
        ))}
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'USER';
  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.15 }}
      style={{ display:'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems:'flex-end', gap:8 }}>
      {!isUser && (
        <div style={{ width:24, height:24, borderRadius:3, border:'1px solid #00ff8844', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#00ff88', fontFamily:mono, flexShrink:0 }}>AI</div>
      )}
      <div style={{ maxWidth:'65%', display:'flex', flexDirection:'column', gap:4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {!isUser && <div style={{ fontSize:10, color:'#333', fontFamily:mono }}>// langbot response</div>}
        {isUser && <div style={{ fontSize:10, color:'#7b2fff88', fontFamily:mono }}>// user input</div>}
        <div style={{
          padding:'10px 14px', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap', fontFamily:mono,
          background: isUser ? '#7b2fff' : '#0c0c0c',
          border: isUser ? '1px solid #7b2fff' : '1px solid #00ff8822',
          borderRadius: isUser ? '6px 6px 0 6px' : '0 6px 6px 6px',
          color: isUser ? '#000' : '#ccc',
        }}>
          {msg.content}
        </div>
        {msg.language && (
          <div style={{ fontSize:10, color:'#333', fontFamily:mono }}>
            {LANG_FLAGS[msg.language] || '🌐'} lang::{msg.language}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  async function loadConversations() {
    try { const r = await chatApi.getConversations(); setConversations(r.data); } catch {}
  }

  async function loadConversation(id) {
    try {
      const r = await chatApi.getConversation(id);
      setActiveConvId(id); setMessages(r.data.messages); setMeta(null);
    } catch {}
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const tid = 'tmp-' + Date.now();
    setMessages(p => [...p, { id:tid, role:'USER', content:text }]);
    setLoading(true);
    try {
      const r = await chatApi.sendMessage(text, activeConvId);
      const { conversationId, responseText, detectedLanguage, detectedIntent, memoriesUsed } = r.data;
      setActiveConvId(conversationId);
      setMessages(p => [
        ...p.filter(m => m.id !== tid),
        { id:'u'+Date.now(), role:'USER', content:text, language:detectedLanguage },
        { id:'b'+Date.now(), role:'ASSISTANT', content:responseText, language:detectedLanguage },
      ]);
      setMeta({ detectedLanguage, detectedIntent, memoriesUsed });
      loadConversations();
    } catch {
      setMessages(p => p.filter(m => m.id !== tid));
      toast.error('// transmission failed');
    } finally { setLoading(false); }
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('// use chrome for voice'); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true;
    r.onstart = () => setListening(true);
    r.onresult = e => setInput(Array.from(e.results).map(r => r[0].transcript).join(''));
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error('// voice error'); };
    recognitionRef.current = r; r.start();
  }

  function stopListening() { recognitionRef.current?.stop(); setListening(false); }

  async function deleteConv(e, id) {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      setConversations(p => p.filter(c => c.id !== id));
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); setMeta(null); }
      toast.success('// deleted');
    } catch { toast.error('// delete failed'); }
  }

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:'flex', height:'100vh', background:'#080808', fontFamily:mono, color:'#e0e0e0', overflow:'hidden' }}>
      <Toaster position="top-center" toastOptions={{
        style: { background:'#0c0c0c', color:'#00ff88', border:'1px solid #00ff8833', fontSize:12, fontFamily:mono }
      }} />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ x:-260 }} animate={{ x:0 }} exit={{ x:-260 }}
            transition={{ type:'spring', damping:25, stiffness:200 }}
            style={{ width:240, background:'#080808', borderRight:'1px solid #1a1a1a', display:'flex', flexDirection:'column', flexShrink:0 }}>

            {/* Header */}
            <div style={{ padding:'16px 14px', borderBottom:'1px solid #1a1a1a' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#7b2fff', letterSpacing:1 }}>
                    LANG<span style={{ color:'#00ff88' }}>BOT</span>
                  </div>
                  <div style={{ fontSize:9, color:'#333', marginTop:1 }}>_v2.0 // online</div>
                </div>
                <button onClick={() => setSidebarOpen(false)} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:14, fontFamily:mono }}>✕</button>
              </div>
              <button onClick={() => { setActiveConvId(null); setMessages([]); setMeta(null); }}
                style={{ width:'100%', padding:'8px', fontSize:11, fontFamily:mono, background:'transparent', border:'1px solid #7b2fff44', color:'#7b2fff', borderRadius:3, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => { e.target.style.background='#7b2fff22'; e.target.style.borderColor='#7b2fff'; }}
                onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.borderColor='#7b2fff44'; }}>
                + new_chat()
              </button>
            </div>

            {/* Search */}
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #111' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="// search..." className="input-field" style={{ fontSize:11, padding:'6px 10px' }} />
            </div>

            {/* Conversations */}
            <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
              {filtered.length === 0 && (
                <div style={{ textAlign:'center', color:'#222', fontSize:11, marginTop:20 }}>// no sessions</div>
              )}
              {filtered.map(conv => (
                <div key={conv.id} style={{ position:'relative' }}
                  onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity='1'}
                  onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity='0'}>
                  <button onClick={() => loadConversation(conv.id)}
                    className={`sidebar-item ${conv.id === activeConvId ? 'sidebar-item-active' : ''}`}
                    style={{ width:'100%', paddingRight:28 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.title}</div>
                      <div style={{ fontSize:9, color:'#222', marginTop:1 }}>{new Date(conv.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </button>
                  <button className="del-btn" onClick={e => deleteConv(e, conv.id)}
                    style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', opacity:0, background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:12, transition:'all 0.15s', fontFamily:mono }}
                    onMouseEnter={e => e.target.style.color='#ff4455'}
                    onMouseLeave={e => e.target.style.color='#333'}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* User */}
            <div style={{ padding:'10px', borderTop:'1px solid #1a1a1a' }}>
              <button onClick={() => navigate('/profile')}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'none', border:'none', cursor:'pointer', padding:'6px', borderRadius:3, transition:'all 0.15s', fontFamily:mono }}
                onMouseEnter={e => e.currentTarget.style.background='#7b2fff11'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ width:26, height:26, borderRadius:3, background:'#7b2fff22', border:'1px solid #7b2fff44', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#7b2fff', flexShrink:0 }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:11, color:'#888' }}>@{user?.username}</div>
                  <div style={{ fontSize:9, color:'#333' }}>// view profile</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Topbar */}
        <div style={{ height:44, background:'#080808', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:16, fontFamily:mono }}>☰</button>
          )}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, overflowX:'auto' }}>
            {meta && (
              <>
                <span style={{ fontSize:10, color:'#7b2fff', border:'1px solid #7b2fff33', padding:'2px 8px', borderRadius:3 }}>
                  {LANG_FLAGS[meta.detectedLanguage] || '🌐'} lang::{meta.detectedLanguage}
                </span>
                <span style={{ fontSize:10, color:'#444', border:'1px solid #1a1a1a', padding:'2px 8px', borderRadius:3 }}>
                  intent::{meta.detectedIntent}
                </span>
                {meta.memoriesUsed > 0 && (
                  <span style={{ fontSize:10, color:'#00ff88', border:'1px solid #00ff8833', padding:'2px 8px', borderRadius:3 }}>
                    mem::{meta.memoriesUsed}
                  </span>
                )}
              </>
            )}
          </div>
          <button onClick={logout} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:11, fontFamily:mono }}
            onMouseEnter={e => e.target.style.color='#ff4455'}
            onMouseLeave={e => e.target.style.color='#333'}>
            logout()
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 20px' }}>
          {messages.length === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', textAlign:'center' }}>
              <div style={{ fontSize:32, fontWeight:700, color:'#7b2fff', letterSpacing:2, marginBottom:8 }} className="animate-flicker">
                LANG<span style={{ color:'#00ff88' }}>BOT</span>
              </div>
              <div style={{ fontSize:11, color:'#333', marginBottom:4 }}>// multilingual ai terminal</div>
              <div style={{ fontSize:11, color:'#222', marginBottom:32 }}>// type in any language to begin session</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', maxWidth:400 }}>
                {EXAMPLES.map(ex => (
                  <motion.button key={ex} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={() => setInput(ex)}
                    style={{ fontSize:12, color:'#444', border:'1px solid #1a1a1a', background:'transparent', padding:'6px 14px', borderRadius:3, cursor:'pointer', fontFamily:mono, transition:'all 0.15s' }}
                    onMouseEnter={e => { e.target.style.color='#00ff88'; e.target.style.borderColor='#00ff8844'; }}
                    onMouseLeave={e => { e.target.style.color='#444'; e.target.style.borderColor='#1a1a1a'; }}>
                    &gt; {ex}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
              <AnimatePresence>
                {messages.map(msg => <Message key={msg.id} msg={msg} />)}
              </AnimatePresence>
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ flexShrink:0, padding:'12px 20px', background:'#080808', borderTop:'1px solid #1a1a1a' }}>
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            {listening && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#ff4455', animation:'pulse 1s infinite' }} />
                <span style={{ fontSize:10, color:'#ff4455', fontFamily:mono }}>// recording input...</span>
              </motion.div>
            )}
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, background:'#0c0c0c', border:'1px solid #1a1a1a', borderRadius:4, padding:'8px 10px' }}
              onFocus={e => e.currentTarget.style.borderColor='#7b2fff44'}
              onBlur={e => e.currentTarget.style.borderColor='#1a1a1a'}>
              <div style={{ fontSize:12, color:'#7b2fff', flexShrink:0, paddingBottom:6, fontFamily:mono }}>$</div>
              <textarea value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                placeholder="type in any language..."
                rows={1} disabled={loading}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e0e0e0', fontSize:13, fontFamily:mono, resize:'none', maxHeight:120, lineHeight:1.5, paddingBottom:4 }} />
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                  onClick={listening ? stopListening : startListening}
                  style={{ width:30, height:30, borderRadius:3, border: listening ? '1px solid #ff445544' : '1px solid #1a1a1a', background:'transparent', color: listening ? '#ff4455' : '#333', cursor:'pointer', fontSize:14, fontFamily:mono, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                  {listening ? '⏹' : '🎤'}
                </motion.button>
                <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                  onClick={sendMessage} disabled={loading || !input.trim()}
                  style={{ width:30, height:30, borderRadius:3, background: input.trim() ? '#7b2fff' : 'transparent', border:'1px solid ' + (input.trim() ? '#7b2fff' : '#1a1a1a'), color: input.trim() ? '#000' : '#333', cursor: input.trim() ? 'pointer' : 'default', fontSize:14, fontFamily:mono, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                  →
                </motion.button>
              </div>
            </div>
            <div style={{ textAlign:'center', fontSize:9, color:'#1a1a1a', marginTop:6, fontFamily:mono }}>
              // langbot_v2 · llama-3.3-70b · 100+ languages · enter to send
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
