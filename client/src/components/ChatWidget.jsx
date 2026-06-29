import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am MedScan AI Health Assistant. How can I help you with your medicines, prescriptions, or health questions today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const { data } = await api.get('/chat/suggestions');
      setSuggestions(data.data || []);
    } catch (err) {
      // ignore
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMsg = { role: 'user', content: query };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const apiHistory = updatedMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/chat/message', {
        message: query,
        history: apiHistory.slice(-6), // Send last 6 messages for context
      });

      if (data.data && data.data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
        if (data.data.suggestions && data.data.suggestions.length > 0) {
          setSuggestions(data.data.suggestions);
        }
      }
    } catch (err) {
      toast.error('Failed to connect to AI Assistant');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an issue connecting to the server. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            borderRadius: '50px',
            padding: '12px 20px',
            boxShadow: '0 8px 24px rgba(15,118,110,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.95rem',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <Bot size={22} />
          <span>Ask MedScan AI</span>
          <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
            <Sparkles size={10} /> Live
          </span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          className="card"
          style={{
            width: 380,
            height: 520,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            border: '1px solid var(--primary-200)',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary), #0D9488)',
              color: 'white',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: 6 }}>
                <Bot size={20} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>AI Health Assistant</h4>
                <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.9 }}>Powered by Groq Llama 3.3</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages List */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--surface-1)',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: msg.role === 'user' ? 'var(--secondary)' : 'var(--primary-100)',
                    color: msg.role === 'user' ? 'white' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    background: msg.role === 'user' ? 'var(--secondary)' : 'var(--white)',
                    color: msg.role === 'user' ? 'white' : 'var(--text)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} />
                </div>
                <div style={{ background: 'var(--white)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> AI is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 6, overflowX: 'auto' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '50px',
                    background: 'var(--white)',
                    border: '1px solid var(--primary-200)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  💡 {s}
                </button>
              ))}
            </div>
          )}

          {/* Disclaimer Banner */}
          <div style={{ background: 'var(--warning-50)', padding: '4px 12px', fontSize: '0.68rem', color: 'var(--warning-700)', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--border-light)' }}>
            <AlertTriangle size={12} /> Consult a doctor for medical emergencies.
          </div>

          {/* Input Area */}
          <div style={{ padding: 10, background: 'var(--white)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ask about medicines, dosage..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn btn-primary btn-icon"
              style={{ flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
