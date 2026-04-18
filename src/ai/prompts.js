// ── All 7 prompt type templates ──
// Each returns { prompt, systemPrompt }

import { getSystemPrompt } from './personalities.js';

// ── TYPE 1: Discovery Card Generation ──
export function discoveryCardsPrompt({ ageGroup, topInterests, domains, personality, mode }) {
  const systemPrompt = getSystemPrompt(personality, ageGroup);

  const domainsStr = domains?.join(', ') || 'any domain';
  const interestsStr = topInterests?.length
    ? topInterests.join(', ')
    : 'no established interests yet';

  const modeInstruction = mode === 'surprise'
    ? 'Generate cards from domains the user has NOT explored yet or has low interest in.'
    : mode === 'similar'
    ? `Focus on domains similar to or related to: ${interestsStr}`
    : '';

  const prompt = `Generate 4 discovery card prompts for a user with age group: ${ageGroup}.
Their top interests so far are: ${interestsStr}.
${modeInstruction}

Rules:
- Each prompt must be a concrete question or scenario, NEVER an abstract domain label
- Each must be under 12 words
- Each must secretly represent one of these domains: ${domainsStr}
- Do NOT name the domain explicitly in the card text
- Give each card a branch kind from this set: question, mechanism, paradox, connection, experiment, objection, counterfactual, craft
- Include a secondary description under 16 words that sharpens why the card is interesting
- Tailor language difficulty to age group "${ageGroup}"
- Make each card feel surprising, specific, and intriguing
- For little_explorer: use simple words, concrete examples, wonder-inducing
- For student: culturally relevant, relatable, slightly edgy
- For college/adult: intellectually provocative, counterintuitive

Return ONLY valid JSON array, no markdown fences:
[{"text": "...", "domain": "...", "emoji": "...", "imageQuery": "...", "kind": "...", "description": "..."}]`;

  return { prompt, systemPrompt };
}

// ── TYPE 2: Node Children Generation ──
export function nodeChildrenPrompt({ currentNode, currentPath, ageGroup, topInterests, personality }) {
  const systemPrompt = getSystemPrompt(personality, ageGroup);
  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath;
  const interestsStr = topInterests?.join(', ') || 'general curiosity';

  const prompt = `The user is exploring the node "${currentNode}". Their path here was: ${pathStr}.

Generate 4-6 child nodes to expand from this point.

Rules:
- Mix depth with breadth — some go deeper into "${currentNode}", some branch out sideways
- Include at least one surprising or non-obvious child node
- Include at least one accessible to beginners, one deeper than expected
- Tailor labels and descriptions to age group "${ageGroup}"
- Connect to their interests when natural: ${interestsStr}
- Each description should be one compelling sentence that makes you want to go deeper
- Descriptions for little_explorer: exciting and concrete, max 10 words
- Descriptions for student/college/adult: intriguing and specific, max 15 words

Return ONLY valid JSON array, no markdown fences:
[{"id": "snake_case_id", "label": "...", "description": "...", "difficulty": "beginner|intermediate|advanced", "surpriseFactor": true|false}]`;

  return { prompt, systemPrompt };
}

// ── TYPE 3: The Explainer ──
export function explainerPrompt({ currentNode, currentPath, ageGroup, name, knowledgeState, topInterests, explorationStyle, personality }) {
  const systemPrompt = getSystemPrompt(personality, ageGroup);
  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath || currentNode;
  const interestsStr = topInterests?.join(', ') || 'general curiosity';
  const wordLimit = ['little_explorer', 'student'].includes(ageGroup) ? 200 : 300;

  const prompt = `Explain "${currentNode}" to ${name || 'the user'}.

Profile: age_group=${ageGroup}, path=${pathStr}, knowledge_state=${knowledgeState || 'new'}, interests=${interestsStr}, style=${explorationStyle || 'balanced'}

Structure your response in EXACTLY this order:
1. HOOK — One surprising or counterintuitive sentence (max 20 words). Make it land.
2. CORE — The central idea in plain language calibrated to ${ageGroup} (2-3 sentences)
3. ANALOGY — A vivid analogy connecting to one of their interests: ${interestsStr}
4. EXAMPLE — Something concrete they can picture or interact with
5. TEASER — One thing that goes deeper from here, phrased as a doorway not a summary

Under ${wordLimit} words total. Never use jargon without explaining it. Never be condescending.
Write in 3 short paragraphs separated by blank lines:
- Paragraph 1 = hook + core
- Paragraph 2 = analogy + example
- Paragraph 3 = teaser only
Do not use headers, numbering, or bullet points.
Do not start with "Sure" or "Of course" or any filler.`;

  return { prompt, systemPrompt };
}

// ── TYPE 4: Personality Summary ──
export function personalitySummaryPrompt({ topDomains, explorationStyle, avgDepth, surprisingPath, dominantKnowledge, badge }) {
  const systemPrompt = `Write a warm, insightful one-paragraph personality summary. Be specific. Sound like a perceptive friend who has been watching someone explore.`;

  const prompt = `Domains they're most drawn to: ${topDomains?.join(', ')}
Exploration style: ${explorationStyle}
Average depth they go: ${avgDepth} levels
Most surprising path they took: ${surprisingPath}
Knowledge: mostly ${dominantKnowledge || 'curious and new to most things'}
Notable badge earned: ${badge || 'none yet'}

Write under 60 words. Second person ("You..."). No generic phrases like "wide range of interests" or "love of learning". Be specific and insightful. Make it feel like it was written by someone who actually paid attention.`;

  return { prompt, systemPrompt };
}

// ── TYPE 6: Interactive Diagram ──
export function interactiveDiagramPrompt({ currentNode, currentPath, ageGroup, topInterests }) {
  const systemPrompt = `You are an expert at creating interactive educational visualizations. Generate clean, self-contained HTML with embedded CSS and JavaScript. The visualization must be beautiful, educational, and interactive.`;

  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath || currentNode;
  const interests = topInterests?.slice(0, 3).join(', ') || 'general learning';
  const complexity = ['little_explorer', 'student'].includes(ageGroup) ? 'simple and playful' : 'sophisticated and precise';

  const prompt = `Create a self-contained interactive HTML visualization for "${currentNode}" (path: ${pathStr}).

User age group: ${ageGroup}. Make it ${complexity}. Their interests: ${interests}.

Requirements:
- Fully self-contained HTML document (no external dependencies, no CDN links)
- Interactive: at minimum hoverable/clickable elements that reveal information
- Educational: genuinely helps understand the concept, not just decorative
- Beautiful: clean design with #FF6B35 (ember orange) as accent color, #FFFDF7 background
- Responsive: works in a 320px wide container
- For little_explorer: colorful, tactile, game-like
- For college/adult: technically precise, data-rich, reveals depth

Good visualizations for this concept might include: animated diagrams, interactive formulas, step-by-step processes, comparison charts, cause-effect relationships, or anything that makes the abstract concrete.

Return ONLY the complete HTML document starting with <!DOCTYPE html>, no explanation, no markdown.`;

  return { prompt, systemPrompt };
}

// ── TYPE 5: Journey Narrative ──
export function journeyNarrativePrompt({ period, nodeSequence, domainList, style, name, personality, ageGroup }) {
  const systemPrompt = getSystemPrompt(personality || 'spark', ageGroup || 'college');
  const nodes = Array.isArray(nodeSequence) ? nodeSequence.join(' → ') : nodeSequence;
  const domains = Array.isArray(domainList) ? domainList.join(', ') : domainList;

  const prompt = `Generate a short learning narrative for ${name || 'this explorer'}'s ${period}.
Nodes explored in sequence: ${nodes}
Domains touched: ${domains}
Their typical style: ${style || 'varied'}

Rules:
- 2-3 sentences. Second person. Warm and specific.
- Include one insightful pattern observation — what does this sequence reveal about them?
- Never say "great job" or "keep it up" or "you're doing amazing"
- Sound like a perceptive friend, not a teacher
- For lifetime view: end with one forward-looking sentence about where their curiosity might go next`;

  return { prompt, systemPrompt };
}
