// ── All 7 prompt type templates ──
// Each returns { prompt, systemPrompt }

import { getSystemPrompt } from './personalities.js';

// ── TYPE 1: Discovery Card Generation ──
export function discoveryCardsPrompt({ ageGroup, topInterests, domains, personality, mode, majorMode = false, majorField = null }) {
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

  // College major exploration mode — completely different card framing
  if (majorMode) {
    const fieldContext = majorField ? `The user is exploring "${majorField}" as a potential major.` : 'The user is exploring college majors.';
    const prompt = `${fieldContext} They are a high school student trying to figure out what to study.

Generate 4 discovery cards that surface DISPOSITION SIGNALS — not abstract concepts, but concrete day-in-the-life scenarios that reveal whether someone would thrive in a field.

Each card should feel like: "You're in a real situation. Does this excite you or exhaust you?"

Examples of good major exploration cards:
- "You're in a lab at 11pm, running an experiment for the third time. Does that sound exciting or exhausting?"
- "You just found a bug that's been crashing an app for 10,000 users. Do you want to be the one who fixes it?"
- "You're reading a paper about why a policy failed. You have an idea for why. Do you want to write that argument?"

Rules:
- Each card must be a SCENARIO, not a question about facts
- Scenarios must reveal: do you like making vs understanding, working alone vs collaborating, open problems vs right answers
- Each must secretly map to one of these domains: ${domainsStr}
- Under 18 words per card
- Description (under 20 words) says what kind of person tends to love this field
- Make them feel real and visceral, not hypothetical
- Mix domains: don't put all STEM or all humanities

Return ONLY valid JSON array, no markdown fences:
[{"text": "...", "domain": "...", "emoji": "...", "imageQuery": "...", "kind": "disposition", "description": "..."}]`;
    return { prompt, systemPrompt };
  }

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
  // Limit path to last 3 elements to prevent context overload and label echoing
  const pathArr = Array.isArray(currentPath) ? currentPath : [currentPath];
  const recentPath = pathArr.slice(-3);
  const pathStr = recentPath.join(' → ');
  const parentLabels = pathArr.map((p) => String(p).toLowerCase());
  const interestsStr = topInterests?.join(', ') || 'general curiosity';

  const prompt = `The user is exploring the node "${currentNode}". Recent path: ${pathStr}.

Generate 4-6 child topic nodes to explore from "${currentNode}".

STRICT LABEL RULES — violations will break the UI:
- Each label must be a NOVEL, SPECIFIC topic name (e.g. "Gödel's Incompleteness" not "How ${currentNode} works")
- NEVER reuse any ancestor label: ${parentLabels.join(', ')}
- NEVER use colon-prefix formatting like ":category: name" or "${currentNode}: subtopic"
- NEVER make a label that is just "${currentNode}" + a generic suffix ("in real life", "and you", "basics")
- Labels must be 2-5 words, specific enough to search for on Wikipedia
- Mix: some go deeper into "${currentNode}", some branch sideways to surprising connections
- Include at least one counterintuitive or non-obvious angle
- Tailor descriptions to age group "${ageGroup}" and interests: ${interestsStr}
- Each description: one compelling sentence, max 15 words

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

// ── TYPE 7: Key Takeaways ──
export function keyTakeawaysPrompt({ currentNode, currentPath, ageGroup }) {
  const systemPrompt = `You are an expert educator who distills complex concepts into memorable, punchy insights.`;
  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath || currentNode;
  const limit = ageGroup === 'little_explorer' ? 12 : 20;

  const prompt = `Generate exactly 3 key takeaways about "${currentNode}" (learning path: ${pathStr}).

Rules:
- Age group: ${ageGroup}. Each under ${limit} words.
- Takeaway 1: A foundational "aha" — something that reframes how you see it
- Takeaway 2: A surprising or counterintuitive fact
- Takeaway 3: A "so what" — why this actually matters
- Each is a full sentence. Punchy, not textbook.
- No bullet points or numbering in the text itself.

Return ONLY valid JSON array, no markdown fences:
["Takeaway one.", "Takeaway two.", "Takeaway three."]`;

  return { prompt, systemPrompt };
}

// ── TYPE 8: Quick Quiz ──
export function quickQuizPrompt({ currentNode, currentPath, ageGroup }) {
  const systemPrompt = `You create engaging quiz questions that test genuine conceptual understanding.`;
  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath || currentNode;

  const prompt = `Create 1 multiple-choice quiz question about "${currentNode}" (path: ${pathStr}).

Age group: ${ageGroup}.
- Test conceptual understanding, not memorization
- Make it genuinely interesting — a question that makes you think
- One answer is clearly correct; the other three are plausible but wrong
- Keep the question under 20 words
- Each option under 10 words

Return ONLY valid JSON, no markdown:
{"question":"...","options":["A option","B option","C option","D option"],"correct":0,"explanation":"One sentence why the answer is correct."}

"correct" is a 0-indexed integer (0=first option).`;

  return { prompt, systemPrompt };
}

// ── TYPE 8: Research Frontier ──
export function researchFrontierPrompt({ currentNode, currentPath, ageGroup, personality }) {
  const systemPrompt = getSystemPrompt(personality, ageGroup);
  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath || currentNode;

  const prompt = `The user has gone ${currentPath?.length || 1}+ levels deep exploring "${currentNode}" (path: ${pathStr}).

Generate a research frontier briefing. Return ONLY valid JSON (no markdown fences):
{
  "bridge": {
    "overview": "2-3 sentence honest framing of what this research area is really about",
    "prerequisites": [
      {"concept": "...", "why": "why you need this for the frontier", "difficulty": "beginner|intermediate|advanced"}
    ]
  },
  "papers": [
    {
      "title": "...",
      "authors": "...(Last name et al or single name)",
      "year": 1900,
      "question": "what problem was this paper actually solving, in plain language",
      "insight": "what they found and why it mattered",
      "context": "what came before, what this made possible",
      "accessibility": "accessible|intermediate|technical"
    }
  ],
  "openQuestions": [
    {
      "type": "recurring|disagreement|adjacency",
      "title": "short title for the question",
      "question": "the open question in plain language",
      "why": "why it's hard, what's been tried",
      "excitement": "what a breakthrough would unlock"
    }
  ]
}

Rules:
- bridge.prerequisites: 3-5 concepts, honest about difficulty
- papers: 3-4 real or plausibly real landmark papers in narrative order (oldest to newest), showing evolution of thinking
- openQuestions: exactly 3 questions, one of each type (recurring, disagreement, adjacency)
- Calibrate language to age group: "${ageGroup}"
- Be intellectually honest — this is about genuine frontier territory, not textbook content`;

  return { prompt, systemPrompt };
}

// ── TYPE 9: Research Contribution ──
export function researchContributionPrompt({ currentNode, openQuestion, ageGroup, personality }) {
  const systemPrompt = getSystemPrompt(personality, ageGroup);

  const prompt = `The user is interested in working on this open research question:
"${openQuestion.question}" (in the area of ${currentNode})

Generate a research entry profile. Return ONLY valid JSON (no markdown fences):
{
  "workType": "theoretical|empirical|computational|experimental|interdisciplinary",
  "prerequisites": ["specific technical prerequisite 1", "..."],
  "environment": "description of what the research environment looks like (lab, solo, industry, etc.)",
  "firstStep": {
    "action": "concrete first step description",
    "resource": "specific paper/dataset/tool/person to contact"
  },
  "researchers": [
    {"name": "...", "affiliation": "...", "relevance": "why they're working on this specifically"}
  ]
}

Rules:
- Be concrete and actionable
- firstStep should be something achievable in a week
- researchers: 2-3 real or plausible researchers
- Calibrate to "${ageGroup}"`;

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

// ── TYPE 10: Major Decision Layer ──
export function majorDecisionPrompt({ topDomains, majorField, ageGroup, personality }) {
  const systemPrompt = getSystemPrompt(personality, ageGroup);

  const fieldContext = majorField ? `They were specifically exploring "${majorField}".` : 'They were exploring college majors generally.';

  const prompt = `A high school student just finished a round of major exploration discovery cards. ${fieldContext}
Their top domains by engagement: ${(topDomains || []).join(', ')}.

Based on these signals, generate a personalized college major recommendation.
Return ONLY valid JSON (no markdown):
{
  "insight": "2-3 sentences about what their picks reveal about them as a learner — specific, honest, not generic",
  "fields": [
    {
      "name": "field name",
      "emoji": "single emoji",
      "match": "strong|moderate",
      "why": "1-2 sentences about why this fits based on their specific picks",
      "tradeoff": "1 honest sentence about what's hard about this field"
    }
  ]
}

Rules:
- Generate exactly 3 fields
- First field should be the strongest match
- Be honest about trade-offs — not everything is roses
- Reference their actual domain picks, not just generic advice
- Match language difficulty to age group: ${ageGroup}`;

  return { prompt, systemPrompt };
}
