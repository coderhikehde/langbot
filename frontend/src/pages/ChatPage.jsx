import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const LANG_FLAGS = {
  en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', it: '��🇹',
  ja: '🇯🇵', zh: '🇨🇳', ar: '🇸🇦', pt: '��🇷', ru: '🇷🇺',
  ko: '🇰🇷', hi: '🇮🇳', nl: '��🇱', pl: '🇵🇱', tr: '🇹🇷',
};

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadConversations() {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data);
    } catch (err) { console.error(err); }
  }

  async function loadConversation(convId) {
    try {
      const res = await chatApi.getConversation(convId);
      setActiveConvId(convId);
      setMessages(res.data.messages);
    } catch (err) { console.error(err); }
  }

  async function sendMessage() {
    if (!inputText.trim() || isLoading) return;
    const messageText = inputText.trim();
    setInputText('');
    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, { id: tempId, role: 'USER', content: messageText }]);
    setIsLoading(true);
    try {
      const res = await chatApi.sendMessage(messageText, activeConvId);
      const { conversationId, responseText, detectedLanguage, detectedIntent, memoriesUsed } = res.data;
      setActiveConvId(conversationId);
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: 'u-' + Date.now(), role: 'USER', content: messageText, language: detectedLanguage },
        { id: 'b-' + Date.now(), role: 'ASSISTANT', content: responseText, language: detectedLanguage },
      ]);
      setLastMeta({ detectedLanguage, detectedIntent, memoriesUsed });
      loadConversations();
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Failed to send message');
    } finally { setIsLoading(false); }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser. Use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInputText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice input error. Try again.');
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  return (
    <div style={s.container}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e1e2e', color: '#cdd6f4', border: '1px solid #313244' } }} />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25 }} style={s.sidebar}>
            <div style={s.sidebarTop}>
              <span style={s.sidebarLogo}>🌍 LangBot</span>
              <button onClick={() => setSidebarOpen(false)} style={s.closeBtn}>✕</button>
            </div>
            <button onClick={() => { setActiveConvId(null); setMessages([]); setLastMeta(null); }} style={s.newChatBtn}>
              + New Chat
            </button>
            <div style={s.convList}>
              {conversations.length === 0 && (
                <p style={s.noConvs}>No conversations yet</p>
              )}
              {conversations.map(conv => (
                <motion.button key={conv.id} onClick={() => loadConversation(conv.id)}
                  whileHover={{ backgroundColor: '#313244' }}
                  style={{ ...s.convItem, ...(conv.id === activeConvId ? s.convItemActive : {}) }}>
                  <span style={s.convTitle}>{conv.title}</span>
                  <span style={s.convDate}>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                </motion.button>
              ))}
            </div>
            <div style={s.sidebarBottom}>
              <button onClick={() => navigate('/profile')} style={s.profileBtn}>
                <div style={s.profileAvatar}>{user?.username?.[0]?.toUpperCase()}</div>
                <span style={s.profileName}>@{user?.username}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={s.menuBtn}>☰</button>
          )}
          <div style={s.metaRow}>
            {lastMeta && (
              <>
                <span style={s.badge}>{LANG_FLAGS[lastMeta.detectedLanguage] || '🌐'} {lastMeta.detectedLanguage}</span>
                <span style={s.badge}>🎯 {lastMeta.detectedIntent}</span>
                {lastMeta.memoriesUsed > 0 && (
                  <span style={{ ...s.badge, background: '#1e3a2e', color: '#a6e3a1' }}>
                    🧠 {lastMeta.memoriesUsed} memor{lastMeta.memoriesUsed > 1 ? 'ies' : 'y'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={s.messagesArea}>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.emptyState}>
              <div style={s.emptyEmoji}>🌍</div>
              <h2 style={s.emptyTitle}>Start a conversation</h2>
              <p style={s.emptyHint}>Type in any language — I'll respond in the same one</p>
              <div style={s.exampleBtns}>
                {['Hello!', 'Bonjour!', 'こんにちは!', 'مرحبا!', 'नमस्ते!'].map(ex => (
                  <motion.button key={ex} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setInputText(ex)} style={s.exampleBtn}>{ex}</motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={msg.role === 'USER' ? s.userRow : s.botRow}>
                {msg.role === 'ASSISTANT' && <div style={s.botAvatar}>🤖</div>}
                <div style={msg.role === 'USER' ? s.userBubble : s.botBubble}>
                  <p style={s.msgText}>{msg.content}</p>
                  {msg.language && (
                    <span style={s.langTag}>{LANG_FLAGS[msg.language] || '🌐'} {msg.language}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.botRow}>
              <div style={s.botAvatar}>🤖</div>
              <div style={s.botBubble}>
                <div style={s.typingDots}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} style={s.dot}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={s.inputArea}>
          <div style={s.inputBox}>
            <textarea value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder="Type in any language... (Enter to send)"
              style={s.textarea} disabled={isLoading} rows={1} />
            <div style={s.inputActions}>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={isListening ? stopListening : startListening}
                style={{ ...s.micBtn, ...(isListening ? s.micActive : {}) }}
                title="Voice input">
                {isListening ? '⏹' : '🎤'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                style={s.sendBtn}>
                ➤
              </motion.button>
            </div>
          </div>
          {isListening && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.listeningText}>
              🔴 Listening... speak now
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#1e1e2e', fontFamily: "'Inter', system-ui, sans-serif", color: '#cdd6f4', overflow: 'hidden' },
  sidebar: { width: 280, background: '#181825', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 12px' },
  sidebarLogo: { fontSize: 16, fontWeight: 800, color: '#cdd6f4' },
  closeBtn: { background: 'none', border: 'none', color: '#6c7086', cursor: 'pointer', fontSize: 16, padding: 4 },
  newChatBtn: { margin: '0 12px 12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  convList: { flex: 1, overflowY: 'auto', padding: '0 8px' },
  noConvs: { textAlign: 'center', color: '#45475a', fontSize: 13, marginTop: 20 },
  convItem: { display: 'flex', flexDirection: 'column', width: '100%', background: 'transparent', border: 'none', color: '#a6adc8', padding: '10px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'background 0.15s', fontFamily: 'inherit' },
  convItemActive: { background: '#313244', color: '#cdd6f4' },
  convTitle: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convDate: { fontSize: 11, color: '#45475a', marginTop: 2 },
  sidebarBottom: { borderTop: '1px solid #313244', padding: 12 },
  profileBtn: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '8px 4px', borderRadius: 8, fontFamily: 'inherit' },
  profileAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 },
  profileName: { fontSize: 13, fontWeight: 600 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { background: '#181825', borderBottom: '1px solid #313244', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 },
  menuBtn: { background: 'none', border: 'none', color: '#cdd6f4', cursor: 'pointer', fontSize: 20, padding: '0 8px 0 0' },
  metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  badge: { background: '#313244', color: '#a6adc8', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  emptyState: { textAlign: 'center', margin: 'auto', padding: '40px 20px' },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#cdd6f4' },
  emptyHint: { margin: '0 0 24px', fontSize: 14, color: '#6c7086' },
  exampleBtns: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  exampleBtn: { background: '#313244', border: '1px solid #45475a', color: '#cdd6f4', padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  botRow: { display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 },
  botAvatar: { fontSize: 24, flexShrink: 0, marginBottom: 4 },
  userBubble: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', maxWidth: '65%' },
  botBubble: { background: '#181825', border: '1px solid #313244', color: '#cdd6f4', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', maxWidth: '65%' },
  msgText: { margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: 14 },
  langTag: { fontSize: 11, opacity: 0.6, marginTop: 6, display: 'block' },
  typingDots: { display: 'flex', gap: 4, padding: '4px 0' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' },
  inputArea: { background: '#181825', borderTop: '1px solid #313244', padding: '16px 20px' },
  inputBox: { display: 'flex', gap: 8, alignItems: 'flex-end', background: '#11111b', border: '1px solid #313244', borderRadius: 14, padding: '8px 8px 8px 16px' },
  textarea: { flex: 1, border: 'none', background: 'transparent', padding: '6px 0', fontSize: 14, color: '#cdd6f4', outline: 'none', resize: 'none', fontFamily: 'inherit', maxHeight: 120, lineHeight: 1.5 },
  inputActions: { display: 'flex', gap: 6, alignItems: 'center' },
  micBtn: { background: '#313244', border: 'none', borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  micActive: { background: '#3b1a1a', border: '1px solid #f38ba8' },
  sendBtn: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  listeningText: { margin: '8px 0 0', fontSize: 12, color: '#f38ba8', textAlign: 'center' },
};
