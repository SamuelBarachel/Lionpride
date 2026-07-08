import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Send, Bot, Sparkles, RefreshCw } from 'lucide-react';

const SUGGESTIONS = [
  'What is the best feed for growing Boer goats?',
  'How often should I deworm my goats?',
  'Signs of common goat diseases I should watch for?',
  'When is the best time to sell goats for maximum profit?',
  'How to improve my herd\'s average weight gain?',
  'What vaccinations do goats need annually?',
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '**Hello! I\'m LionAI** 🦁\n\nI\'m your expert goat farming assistant, powered by advanced AI. Ask me anything about:\n- Goat health, diseases & treatments\n- Feeding & nutrition strategies\n- Buying & selling for maximum profit\n- Herd management best practices\n\nHow can I help your Lionpride farm today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (msg) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const r = await api.post('/ai/chat', { message: text, context: 'herd' });
      setMessages(m => [...m, { role: 'assistant', content: r.data.response }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to get response. Please try again.';
      setMessages(m => [...m, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally { setLoading(false); }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const r = await api.get('/ai/insights');
      setInsights(r.data.insights);
    } catch { toast.error('Could not load insights'); }
    finally { setLoadingInsights(false); }
  };

  const formatMessage = (text) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-bold text-slate-100 mb-1">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <p key={i} className="flex gap-2 text-slate-300 mb-0.5"><span className="text-gold-400 flex-shrink-0">•</span>{line.slice(2)}</p>;
        }
        if (/^\d+\.\s/.test(line)) {
          return <p key={i} className="text-slate-300 mb-0.5 pl-2">{line}</p>;
        }
        if (line.trim() === '') return <div key={i} className="h-2" />;
        // Handle inline bold
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <p key={i} className="text-slate-300 mb-0.5">{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-slate-100 font-semibold">{p}</strong> : p)}</p>;
      });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
            <Bot size={20} className="text-gold-400" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100">LionAI</h1>
            <p className="text-xs text-emerald-400">● Online · Llama 3</p>
          </div>
        </div>
        <button
          onClick={loadInsights}
          disabled={loadingInsights}
          className="flex items-center gap-1.5 text-xs font-medium text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-2 rounded-xl hover:bg-gold-500/20 transition-colors"
        >
          {loadingInsights ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Insights
        </button>
      </div>

      {/* Insights panel */}
      {insights && (
        <div className="mx-4 mb-3 card border-gold-500/20 bg-gold-500/5 p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-gold-400" />
            <p className="text-xs font-semibold text-gold-400">AI Insights for Your Farm</p>
            <button onClick={() => setInsights(null)} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">✕</button>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">{formatMessage(insights)}</div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${msg.role === 'user'
              ? 'bg-gold-500 text-slate-950 rounded-br-sm'
              : 'bg-slate-800 border border-slate-700 rounded-bl-sm'
            }`}>
              {msg.role === 'user'
                ? <p className="text-sm font-medium">{msg.content}</p>
                : <div className="text-sm leading-relaxed">{formatMessage(msg.content)}</div>
              }
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 flex-shrink-0">
          <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="flex-shrink-0 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-xl transition-colors max-w-[200px] text-left leading-tight">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pt-2 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="input-field flex-1"
            placeholder="Ask about your goats…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-gold-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-gold-500/20 transition-all active:scale-95"
          >
            <Send size={18} className="text-slate-950" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">Powered by Groq + Llama 3</p>
      </div>
    </div>
  );
}
