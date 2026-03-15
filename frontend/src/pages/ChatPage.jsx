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

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
      <div className="card px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-surface-500"
              animate={{ y:[0,-4,0] }} transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'USER';
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs flex-shrink-0 mb-0.5">🤖</div>
      )}
      <div className={`max-w-[65%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'card text-surface-100 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        {msg.language && (
          <span className="text-xs text-surface-600 px-1">
            {LANG_FLAGS[msg.language] || '🌐'} {msg.language}
          </span>
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
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  async function loadConversations() {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data);
    } catch {}
  }

  async function loadConversation(id) {
    try {
      const res = await chatApi.getConversation(id);
      setActiveConvId(id);
      setMessages(res.data.messages);
      setMeta(null);
    } catch {}
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const tempId = 'temp-' + Date.now();
    setMessages(p => [...p, { id:tempId, role:'USER', content:text }]);
    setLoading(true);
    try {
      const res = await chatApi.sendMessage(text, activeConvId);
      const { conversationId, responseText, detectedLanguage, detectedIntent, memoriesUsed } = res.data;
      setActiveConvId(conversationId);
      setMessages(p => [
        ...p.filter(m => m.id !== tempId),
        { id:'u-'+Date.now(), role:'USER', content:text, language:detectedLanguage },
        { id:'b-'+Date.now(), role:'ASSISTANT', content:responseText, language:detectedLanguage },
      ]);
      setMeta({ detectedLanguage, detectedIntent, memoriesUsed });
      loadConversations();
    } catch {
      setMessages(p => p.filter(m => m.id !== tempId));
      toast.error('Failed to send');
    } finally { setLoading(false); }
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Use Chrome for voice input'); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.onstart = () => setListening(true);
    r.onresult = e => setInput(Array.from(e.results).map(r => r[0].transcript).join(''));
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error('Voice error'); };
    recognitionRef.current = r;
    r.start();
  }

  function stopListening() { recognitionRef.current?.stop(); setListening(false); }

  function newChat() { setActiveConvId(null); setMessages([]); setMeta(null); }

  async function deleteConversation(e, id) {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      setConversations(p => p.filter(c => c.id !== id));
      if (activeConvId === id) newChat();
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  }

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-surface-950 text-surface-100 overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background:'#18181b', color:'#fafafa', border:'1px solid #27272a', fontSize:14 }
      }} />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ x:-280, opacity:0 }} animate={{ x:0, opacity:1 }}
            exit={{ x:-280, opacity:0 }} transition={{ type:'spring', damping:25, stiffness:200 }}
            className="w-64 flex-shrink-0 bg-surface-900 border-r border-surface-800 flex flex-col">

            {/* Sidebar header */}
            <div className="p-4 border-b border-surface-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌍</span>
                  <span className="font-bold text-surface-50">LangBot</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="btn-ghost p-1.5 text-surface-500">✕</button>
              </div>
              <button onClick={newChat}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm h-9">
                <span>+</span> New Chat
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..." className="input-field text-xs py-2" />
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {filteredConvs.length === 0 && (
                <p className="text-center text-surface-600 text-xs mt-8">No conversations yet</p>
              )}
              <AnimatePresence>
                {filteredConvs.map(conv => (
                  <motion.div key={conv.id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="group relative">
                    <button onClick={() => loadConversation(conv.id)}
                      className={`sidebar-item w-full py-2.5 ${conv.id === activeConvId ? 'sidebar-item-active' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-surface-600 mt-0.5">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <button onClick={e => deleteConversation(e, conv.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 transition-all text-xs p-1">
                      🗑
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* User profile */}
            <div className="p-3 border-t border-surface-800">
              <button onClick={() => navigate('/profile')}
                className="sidebar-item w-full">
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">@{user?.username}</p>
                  <p className="text-xs text-surface-600">View profile</p>
                </div>
                <span className="text-surface-600 text-xs">→</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-12 bg-surface-900 border-b border-surface-800 flex items-center px-4 gap-3 flex-shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-1.5 text-surface-400">☰</button>
          )}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {meta && (
              <div className="flex items-center gap-2">
                <span className="badge bg-surface-800 text-surface-300">
                  {LANG_FLAGS[meta.detectedLanguage] || '🌐'} {meta.detectedLanguage}
                </span>
                <span className="badge bg-surface-800 text-surface-300">
                  🎯 {meta.detectedIntent}
                </span>
                {meta.memoriesUsed > 0 && (
                  <span className="badge bg-brand-900/50 text-brand-300 border border-brand-800">
                    🧠 {meta.memoriesUsed} {meta.memoriesUsed > 1 ? 'memories' : 'memory'}
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={logout} className="btn-ghost text-xs text-surface-500">Sign out</button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🌍</div>
              <h2 className="text-xl font-bold text-surface-200 mb-2">Start a conversation</h2>
              <p className="text-surface-500 text-sm mb-8 max-w-sm">
                Type in any language — I'll detect it and respond in the same one
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {EXAMPLES.map(ex => (
                  <motion.button key={ex} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={() => setInput(ex)}
                    className="badge bg-surface-800 border border-surface-700 text-surface-300 hover:border-brand-600 hover:text-brand-300 transition-colors cursor-pointer py-2 px-3 text-sm">
                    {ex}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map(msg => <Message key={msg.id} msg={msg} />)}
              </AnimatePresence>
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 px-4 py-4 bg-surface-950 border-t border-surface-800">
          <div className="max-w-3xl mx-auto">
            {listening && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">Listening... speak now</span>
              </motion.div>
            )}
            <div className="flex items-end gap-2 card px-4 py-3 focus-within:border-surface-700 transition-colors">
              <textarea ref={textareaRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                placeholder="Type in any language... (Enter to send, Shift+Enter for new line)"
                rows={1} disabled={loading}
                className="flex-1 bg-transparent text-sm text-surface-100 placeholder-surface-600 outline-none resize-none max-h-32 leading-relaxed"
                style={{ scrollbarWidth:'none' }} />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                  onClick={listening ? stopListening : startListening}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
                    listening ? 'bg-red-900/50 border border-red-700 text-red-400' : 'bg-surface-800 hover:bg-surface-700 text-surface-400'
                  }`}>
                  {listening ? '⏹' : '🎤'}
                </motion.button>
                <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                  onClick={sendMessage} disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white text-sm transition-colors">
                  →
                </motion.button>
              </div>
            </div>
            <p className="text-center text-surface-700 text-xs mt-2">
              LangBot · Powered by Llama 3.3 70B · 100+ languages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
