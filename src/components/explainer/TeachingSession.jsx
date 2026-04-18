import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import AIService from '../../ai/ai.service.js';
import { getSystemPrompt } from '../../ai/personalities.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

function buildSystemPrompt(node, userContextObj) {
  const { ageGroup, name, topInterests, personality } = userContextObj || {};
  const interests = topInterests?.join(', ') || 'general curiosity';
  const base = getSystemPrompt(personality || 'spark', ageGroup || 'college');
  return `${base}

You are teaching "${node.label}" step by step to ${name || 'the user'} (age group: ${ageGroup || 'college'}).
Teaching rules:
- Teach ONE small concept per message, under 80 words
- After each explanation, ask ONE short question to check understanding
- If they get it: briefly affirm and advance to the next concept
- If confused: reframe using their interests (${interests}) or a completely different angle
- Never say "Great!" or "Excellent!" hollowly — react authentically
- Build from absolute basics toward something genuinely interesting about ${node.label}
- Keep the learner active — this is a conversation, not a lecture`;
}

function buildOpeningPrompt(node, userContextObj) {
  const { ageGroup, topInterests } = userContextObj || {};
  const interests = topInterests?.slice(0, 2).join(' and ') || 'things around them';
  return `Start teaching "${node.label}" to someone (age group: "${ageGroup}", interests: ${interests}). Open with ONE surprising hook sentence about this topic, then ask what they already know or think about "${node.label}". Stay under 70 words. Be direct, warm, and engaging.`;
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-muted"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function TeachingSession({ node, userContextObj, onExit }) {
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [emberMood, setEmberMood] = useState('thinking');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const color = DOMAIN_COLORS[node?.domain] || '#FF6B35';
  const systemPrompt = buildSystemPrompt(node, userContextObj);

  useEffect(() => {
    let cancelled = false;
    const openingPrompt = buildOpeningPrompt(node, userContextObj);
    const initialHistory = [{ role: 'user', content: openingPrompt }];

    AIService.chat(initialHistory, systemPrompt)
      .then((response) => {
        if (cancelled) return;
        setHistory([...initialHistory, { role: 'assistant', content: response }]);
        setMessages([{ role: 'assistant', content: response }]);
        setEmberMood('curious');
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 300);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = `Let's explore ${node.label} together. What do you already know about it — or what made you curious?`;
        setHistory([...initialHistory, { role: 'assistant', content: fallback }]);
        setMessages([{ role: 'assistant', content: fallback }]);
        setEmberMood('curious');
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    const userInput = input.trim();
    if (!userInput || isLoading) return;

    const userMsg = { role: 'user', content: userInput };
    const newMessages = [...messages, userMsg];
    const newHistory = [...history, userMsg];

    setMessages(newMessages);
    setHistory(newHistory);
    setInput('');
    setIsLoading(true);
    setEmberMood('thinking');

    try {
      const response = await AIService.chat(newHistory, systemPrompt);
      const emberMsg = { role: 'assistant', content: response };
      setMessages([...newMessages, emberMsg]);
      setHistory([...newHistory, emberMsg]);
      setEmberMood('proud');
      setTimeout(() => setEmberMood('attentive'), 2500);
    } catch {
      const fallback = { role: 'assistant', content: "Got a bit tangled — try rephrasing that?" };
      setMessages([...newMessages, fallback]);
      setHistory([...newHistory, fallback]);
      setEmberMood('sheepish');
    }

    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, isLoading, messages, history, systemPrompt]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 360 }}>
      {/* Gradient header with domain color */}
      <div
        className="flex items-center gap-3 px-5 pt-4 pb-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}18 0%, ${color}08 60%, transparent 100%)`,
          borderBottom: `1px solid ${color}20`,
        }}
      >
        {/* Ambient glow behind Ember */}
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${color}22, transparent 70%)` }}
          aria-hidden="true"
        />
        <Ember mood={emberMood} size="sm" glowIntensity={emberMood === 'thinking' ? 0.9 : 0.65} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: `${color}CC` }}>
            Teaching session · {node.domain || 'topic'}
          </p>
          <p className="font-display font-semibold text-text-primary text-base leading-tight truncate">{node.label}</p>
        </div>
        <button
          onClick={onExit}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[rgba(42,42,42,0.06)] text-xs font-body text-text-muted hover:text-text-primary hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[32px]"
        >
          ← Back
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        style={{ maxHeight: '42vh', minHeight: '200px' }}
      >
        {isLoading && messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 py-4 text-text-muted"
          >
            <Ember mood="thinking" size="xs" glowIntensity={0.8} />
            <span className="font-body text-sm">Ember is preparing your first lesson...</span>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 mt-1 w-5 h-5">
                    <Ember
                      mood={i === messages.length - 1 ? emberMood : 'idle'}
                      size="xs"
                      glowIntensity={0.4}
                    />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-[18px] px-4 py-3 ${
                    msg.role === 'user'
                      ? 'rounded-br-sm text-white shadow-[0_4px_12px_rgba(255,107,53,0.3)]'
                      : 'rounded-bl-sm text-text-primary shadow-[0_2px_8px_rgba(42,42,42,0.06)]'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { background: `linear-gradient(135deg, ${color}, ${color}CC)` }
                      : { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(42,42,42,0.07)' }
                  }
                >
                  <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isLoading && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-5 h-5 flex-shrink-0">
              <Ember mood="thinking" size="xs" glowIntensity={0.8} />
            </div>
            <div
              className="rounded-[18px] rounded-bl-sm px-4 py-3 shadow-[0_2px_8px_rgba(42,42,42,0.06)]"
              style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(42,42,42,0.07)' }}
            >
              <TypingDots />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-5 pb-5 pt-3"
        style={{ borderTop: `1px solid ${color}14` }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isLoading && messages.length === 0 ? 'Ember is thinking...' : 'Reply to Ember...'}
            disabled={isLoading && messages.length === 0}
            className="flex-1 rounded-full px-4 py-2.5 font-body text-sm text-text-primary placeholder-text-muted outline-none transition-all disabled:opacity-50"
            style={{
              background: 'rgba(42,42,42,0.05)',
              border: `1px solid transparent`,
              boxShadow: 'none',
            }}
            onFocus={(e) => { e.target.style.border = `1px solid ${color}50`; e.target.style.boxShadow = `0 0 0 3px ${color}12`; }}
            onBlur={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.boxShadow = 'none'; }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || (isLoading && messages.length === 0)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2.5 rounded-full text-white font-medium text-sm disabled:opacity-40 transition-colors"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
          >
            →
          </motion.button>
        </div>
        <p className="mt-2 text-[10px] font-body text-text-muted text-center opacity-70">
          ↵ Enter to send · shift+enter for new line
        </p>
      </div>
    </div>
  );
}
