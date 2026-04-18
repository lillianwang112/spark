// ── Course Enrichment — fetches real educational data to ground AI lesson generation ──
// Uses Wikipedia REST API (no CORS issues, open access) + fallback strategies

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKI_CONTENT = 'https://en.wikipedia.org/w/api.php';

// Fetch Wikipedia REST summary — short paragraph, good for hook context
export async function fetchWikiSummary(topic, signal) {
  try {
    const res = await fetch(`${WIKI_REST}/${encodeURIComponent(topic)}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      extract: data.extract || null,
      description: data.description || null,
      thumbnail: data.thumbnail?.source || null,
    };
  } catch {
    return null;
  }
}

// Fetch Wikipedia intro section — richer, 3-5 paragraphs
export async function fetchWikiIntro(topic, signal) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'extracts',
      exintro: 'true',
      exsentences: '8',
      explaintext: 'true',
      titles: topic,
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`${WIKI_CONTENT}?${params}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined) return null;
    return page.extract?.trim() || null;
  } catch {
    return null;
  }
}

// Main entry: returns a sourceContext string to inject into AI lesson prompt
// Tries wiki summary first, then intro, gracefully degrades to null
export async function fetchLessonSourceContext(lessonTitle, topic, signal) {
  // Try lesson-specific Wikipedia article first
  const [lessonSummary, topicSummary] = await Promise.allSettled([
    fetchWikiSummary(lessonTitle, signal),
    fetchWikiSummary(topic, signal),
  ]);

  const lessonData = lessonSummary.status === 'fulfilled' ? lessonSummary.value : null;
  const topicData = topicSummary.status === 'fulfilled' ? topicSummary.value : null;

  const parts = [];

  if (lessonData?.extract) {
    parts.push(`Wikipedia on "${lessonTitle}": ${lessonData.extract}`);
  }
  if (topicData?.extract && topicData.extract !== lessonData?.extract) {
    parts.push(`Wikipedia on "${topic}": ${topicData.extract}`);
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

// Batch fetch Wikipedia summaries for a list of topics (used in pre-warming)
export async function batchFetchSummaries(topics, delayMs = 200) {
  const results = {};
  for (const topic of topics) {
    results[topic] = await fetchWikiSummary(topic);
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}
