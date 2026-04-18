import { useState, useEffect, useRef, useCallback } from 'react';
import Ember from '../ember/Ember.jsx';
import AIService from '../../ai/ai.service.js';
import { getSystemPrompt } from '../../ai/personalities.js';

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

export default function TeachingSession({ node, userContextObj, onExit }) {
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [emberMood, setEmberMood] = useState('thinking');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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
    <div className="flex flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(42,42,42,0.08)' }}
      >
        <Ember mood={emberMood} size="sm" glowIntensity={emberMood === 'thinking' ? 0.9 : 0.6} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">Teaching session</p>
          <p className="font-display font-semibold text-text-primary text-base leading-tight truncate">{node.label}</p>
        </div>
        <button
          onClick={onExit}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[rgba(42,42,42,0.05)] text-xs font-body text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="overflow-y-auto px-5 py-4 space-y-4"
        style={{ maxHeight: '44vh', minHeight: '180px' }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center gap-2 text-text-muted py-2">
            <Ember mood="thinking" size="xs" glowIntensity={0.7} />
            <span className="font-body text-sm italic">Ember is preparing...</span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
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
                className={`max-w-[85%] rounded-[18px] px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-spark-ember text-white rounded-br-sm'
                    : 'bg-[rgba(42,42,42,0.06)] text-text-primary rounded-bl-sm'
                }`}
              >
                <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {isLoading && messages.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex-shrink-0">
              <Ember mood="thinking" size="xs" glowIntensity={0.8} />
            </div>
            <div className="bg-[rgba(42,42,42,0.06)] rounded-[18px] rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-5 pb-4 pt-3"
        style={{ borderTop: '1px solid rgba(42,42,42,0.08)' }}
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
            className="flex-1 bg-[rgba(42,42,42,0.05)] rounded-full px-4 py-2.5 font-body text-sm text-text-primary placeholder-text-muted outline-none border border-transparent focus:border-[rgba(255,107,53,0.35)] transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || (isLoading && messages.length === 0)}
            className="px-4 py-2.5 rounded-full bg-spark-ember text-white font-medium text-sm disabled:opacity-40 hover:bg-orange-600 active:scale-95 transition-all"
          >
            →
          </button>
        </div>
        <p className="mt-2 text-[10px] font-body text-text-muted text-center">Enter to send</p>
      </div>
    </div>
  );
}
