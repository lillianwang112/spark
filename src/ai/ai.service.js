// ── THE abstraction layer — ALL AI calls route through here ──
// NEVER call Puter.js or any AI API directly from a component.
// Change VITE_AI_BACKEND env var to swap backends without touching anything else.

import AICache from './cache.js';
import {
  discoveryCardsPrompt,
  nodeChildrenPrompt,
  explainerPrompt,
  personalitySummaryPrompt,
  journeyNarrativePrompt,
  interactiveDiagramPrompt,
} from './prompts.js';
import { parseAIJson } from '../utils/helpers.js';
import { hashPath } from '../utils/helpers.js';

const AI_BACKEND = import.meta.env.VITE_AI_BACKEND || 'puter';
const TIMEOUT_MS = 12000;
const inflight = new Map();

// ── Wait for Puter.js to load (async script) ──
// Short timeout so network failures fail fast rather than hanging
function waitForPuter(timeoutMs = 5000) {
  if (window.puter) return Promise.resolve(window.puter);
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.puter) return resolve(window.puter);
      if (Date.now() - start > timeoutMs) return reject(new Error('Puter.js failed to load'));
      setTimeout(check, 100);
    };
    check();
  });
}

// ── Low-level: multi-turn chat (preserves conversation history) ──
async function chat(messages, systemPrompt) {
  if (AI_BACKEND === 'puter') {
    const puter = await waitForPuter();
    if (!puter) throw new Error('Puter.js not loaded');
    const response = await puter.ai.chat(messages, {
      system: systemPrompt,
      model: 'google/gemini-2.5-flash',
    });
    return typeof response === 'string'
      ? response
      : response?.message?.content?.[0]?.text || response?.message?.content || String(response);
  } else {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }
}

// ── Low-level: single completion ──
async function complete(prompt, systemPrompt) {
  if (AI_BACKEND === 'puter') {
    // HACKATHON: Puter.js (free, no API key)
    // KNOWN ISSUE: blocked on eduroam — use mobile hotspot for demo
    const puter = await waitForPuter();
    if (!puter) throw new Error('Puter.js not loaded');
    const response = await puter.ai.chat(prompt, {
      system: systemPrompt,
      model: 'google/gemini-2.5-flash',
    });
    // Puter returns string or object — normalize
    return typeof response === 'string'
      ? response
      : response?.message?.content?.[0]?.text || response?.message?.content || String(response);
  } else {
    // PRODUCTION: Claude API
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }
}

// ── Timeout wrapper ──
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI call timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ── Fallbacks for every prompt type ──
const FALLBACKS = {
  discoveryCards: () => [
    { text: "Why do bees build perfect hexagons?", domain: "math", emoji: "🐝", imageQuery: "honeycomb hexagon geometry", kind: "mechanism", description: "Nature keeps choosing efficiency in places that look magical." },
    { text: "How does Spotify know what you'll play next?", domain: "cs", emoji: "🎵", imageQuery: "music recommendation algorithm", kind: "systems", description: "Prediction gets eerie when taste turns into data." },
    { text: "Why do some languages have no word for 'no'?", domain: "languages", emoji: "🗣️", imageQuery: "linguistics language diversity", kind: "question", description: "A tiny word can reveal a whole worldview." },
    { text: "What makes a joke actually funny — scientifically?", domain: "philosophy", emoji: "😂", imageQuery: "humor psychology brain", kind: "paradox", description: "Humor lives right where logic and surprise collide." },
  ],
  nodeChildren: () => null, // null signals topicGraph to use its richer encyclopedia fallback
  explainer: (params) => `${params?.currentNode || 'This topic'} is a fascinating area of study. It connects to many things you might already know, and opens doors to even more. Keep exploring — the deeper you go, the more interesting it gets.`,
  personalitySummary: () => "You're drawn to the edges of things — where one field bleeds into another. You don't just learn; you connect.",
  journeyNarrative: () => "Your curiosity took some interesting turns. Keep following what pulls you.",
  interactiveDiagram: () => null, // No fallback — just don't show if AI fails
};

// ── Cache key builders ──
function getCacheKey(type, params) {
  const ageGroup = params.ageGroup || params.userContext?.ageGroup || 'college';
  switch (type) {
    case 'discoveryCards':
      return `dc:${ageGroup}:${(params.topInterests || []).join(',')}:${params.mode || 'default'}`;
    case 'nodeChildren':
      return `nc:${hashPath(params.currentPath)}:${params.currentNode}:${ageGroup}`;
    case 'explainer':
      return `ex:${hashPath(params.currentPath)}:${params.currentNode}:${ageGroup}:${params.personality || 'spark'}`;
    case 'personalitySummary':
      return `ps:${(params.topDomains || []).join(',')}:${params.explorationStyle}`;
    case 'journeyNarrative':
      return `jn:${params.period}:${hashPath(params.nodeSequence)}`;
    case 'interactiveDiagram':
      return `id:${hashPath(params.currentPath)}:${params.currentNode}:${params.ageGroup || 'college'}`;
    default:
      return `${type}:${JSON.stringify(params).slice(0, 100)}`;
  }
}

// ── Prompt builders ──
function buildPrompt(type, params) {
  switch (type) {
    case 'discoveryCards':     return discoveryCardsPrompt(params);
    case 'nodeChildren':       return nodeChildrenPrompt(params);
    case 'explainer':          return explainerPrompt(params);
    case 'personalitySummary': return personalitySummaryPrompt(params);
    case 'journeyNarrative':     return journeyNarrativePrompt(params);
    case 'interactiveDiagram':   return interactiveDiagramPrompt(params);
    default: throw new Error(`Unknown prompt type: ${type}`);
  }
}

// ── Main API ──
const AIService = {
  // Multi-turn conversation — maintains full history across turns
  async chat(messages, systemPrompt) {
    return withTimeout(chat(messages, systemPrompt), TIMEOUT_MS * 1.5);
  },

  // Raw completion (use sparingly — prefer .call())
  async complete(prompt, systemPrompt) {
    return withTimeout(complete(prompt, systemPrompt), TIMEOUT_MS);
  },

  // Structured call with cache + retry + fallback
  async call(type, params, options = {}) {
    const cacheKey = getCacheKey(type, params);

    // 1. Check cache
    if (!options.skipCache) {
      const cached = AICache.get(type, cacheKey);
      if (cached !== null) return cached;
    }

    const requestKey = `${type}:${cacheKey}`;
    if (inflight.has(requestKey)) {
      return inflight.get(requestKey);
    }

    const request = (async () => {
      // 2. Build prompt
      const { prompt, systemPrompt } = buildPrompt(type, params);

      // 3. Try with timeout, retry once on failure
      let result;
      try {
        result = await withTimeout(complete(prompt, systemPrompt), TIMEOUT_MS);
      } catch (err) {
        console.warn(`[AIService] First attempt failed for ${type}:`, err.message);
        try {
          result = await withTimeout(complete(prompt, systemPrompt), TIMEOUT_MS);
        } catch (err2) {
          console.warn(`[AIService] Both attempts failed for ${type}:`, err2?.message ?? String(err2));
          return FALLBACKS[type]?.(params) ?? null;
        }
      }

      // 4. Parse JSON types
      const jsonTypes = ['discoveryCards', 'nodeChildren'];
      if (jsonTypes.includes(type)) {
        const parsed = parseAIJson(result);
        if (!parsed) {
          console.warn(`[AIService] JSON parse failed for ${type}, using fallback`);
          return FALLBACKS[type]?.(params) ?? null;
        }
        AICache.set(type, cacheKey, parsed);
        return parsed;
      }

      // 5. String types
      AICache.set(type, cacheKey, result);
      return result;
    })();

    inflight.set(requestKey, request);
    try {
      return await request;
    } finally {
      inflight.delete(requestKey);
    }
  },

  // Pre-generate: fire and cache, don't return (called proactively)
  async preGenerate(type, params) {
    const cacheKey = getCacheKey(type, params);
    // Skip if already cached
    if (AICache.get(type, cacheKey) !== null) return;
    // Fire in background
    this.call(type, params).catch(() => {/* swallow — it's a pre-gen */});
  },
};

export default AIService;
