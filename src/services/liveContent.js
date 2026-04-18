function dedupeBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stripHtml(text = '') {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function buildWikiUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
}

export async function fetchWikipediaTopic(query) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=4&format=json&origin=*`;
  const searchData = await fetchJson(searchUrl);
  const results = searchData?.query?.search || [];
  const best = results[0];

  if (!best?.title) {
    return { summary: null, related: [] };
  }

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(best.title)}`;
  let summary = null;
  try {
    const summaryData = await fetchJson(summaryUrl, { headers: { Accept: 'application/json' } });
    summary = {
      title: summaryData.title || best.title,
      description: summaryData.description || '',
      extract: summaryData.extract || stripHtml(best.snippet),
      url: summaryData.content_urls?.desktop?.page || buildWikiUrl(best.title),
      image: summaryData.originalimage?.source || summaryData.thumbnail?.source || null,
    };
  } catch {
    summary = {
      title: best.title,
      description: '',
      extract: stripHtml(best.snippet),
      url: buildWikiUrl(best.title),
      image: null,
    };
  }

  const related = results.slice(1, 4).map((item) => ({
    title: item.title,
    snippet: stripHtml(item.snippet),
    url: buildWikiUrl(item.title),
  }));

  return { summary, related };
}

function trimSentence(text = '', maxLength = 260) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength);
  const lastBreak = Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('; '), sliced.lastIndexOf(', '));
  return `${(lastBreak > 80 ? sliced.slice(0, lastBreak) : sliced).trim()}…`;
}

export async function fetchWikimediaImages(query, count = 4) {
  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${Math.max(count * 2, 6)}&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*`;
  const data = await fetchJson(commonsUrl);
  const pages = Object.values(data?.query?.pages || {});

  const images = pages
    .map((page) => {
      const title = String(page.title || '').replace(/^File:/, '');
      const imageInfo = page.imageinfo?.[0];
      const url = imageInfo?.thumburl || imageInfo?.url || null;
      if (!url) return null;
      return {
        title,
        alt: title.replace(/[_-]/g, ' '),
        url,
        sourceUrl: imageInfo?.descriptionurl || null,
      };
    })
    .filter(Boolean);

  return dedupeBy(images, (item) => item.url).slice(0, count);
}

export async function fetchOpenAlexPapers(query, count = 4) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${count}&sort=relevance_score:desc`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } });

  return (data?.results || []).map((work) => {
    const authors = (work.authorships || [])
      .slice(0, 3)
      .map((auth) => auth.author?.display_name)
      .filter(Boolean);
    const venue = work.primary_location?.source?.display_name || '';
    const landingUrl = work.primary_location?.landing_page_url || work.doi || work.id || null;

    return {
      id: work.id,
      title: work.display_name,
      year: work.publication_year,
      venue,
      authors,
      citedByCount: work.cited_by_count || 0,
      url: landingUrl,
    };
  }).filter((paper) => paper.title && paper.url);
}

async function fetchWikipediaLinks(title, count = 12) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(title)}&pllimit=${Math.max(count * 3, 24)}&format=json&origin=*`;
  const data = await fetchJson(url);
  const pages = Object.values(data?.query?.pages || {});
  const page = pages[0];
  return (page?.links || [])
    .map((link) => link.title)
    .filter(Boolean);
}

function isUsefulWikiLink(title, baseTitle) {
  const value = String(title || '').trim();
  if (!value) return false;
  if (value === baseTitle) return false;
  if (value.startsWith('List of ') || value.startsWith('Category:') || value.startsWith('Help:')) return false;
  if (/^[0-9]+$/.test(value)) return false;
  if (value.length > 42) return false;
  return true;
}

async function fetchPageExtracts(titles) {
  if (!titles.length) return new Map();
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(titles.join('|'))}&format=json&origin=*`;
  const data = await fetchJson(url);
  const pages = Object.values(data?.query?.pages || {});
  return new Map(
    pages
      .map((page) => [page.title, trimSentence(page.extract || '', 180)])
      .filter(([title]) => Boolean(title))
  );
}

export async function fetchTopicImages(query, count = 3) {
  const [wiki, commons] = await Promise.allSettled([
    fetchWikipediaTopic(query),
    fetchWikimediaImages(query, count + 1),
  ]);

  const wikiImage = wiki.status === 'fulfilled' ? wiki.value?.summary?.image : null;
  const wikiTitle = wiki.status === 'fulfilled' ? wiki.value?.summary?.title : query;
  const commonsImages = commons.status === 'fulfilled' ? commons.value : [];

  const merged = [
    wikiImage ? {
      title: wikiTitle,
      alt: `Illustration of ${wikiTitle}`,
      url: wikiImage,
      sourceUrl: wiki.status === 'fulfilled' ? wiki.value?.summary?.url : null,
    } : null,
    ...commonsImages,
  ].filter(Boolean);

  return dedupeBy(merged, (item) => item.url).slice(0, count);
}

export async function fetchTopicContent(query, options = {}) {
  const imageCount = options.imageCount || 4;
  const paperCount = options.paperCount || 4;

  const [wiki, images, papers] = await Promise.allSettled([
    fetchWikipediaTopic(query),
    fetchTopicImages(query, imageCount),
    fetchOpenAlexPapers(query, paperCount),
  ]);

  return {
    summary: wiki.status === 'fulfilled' ? wiki.value.summary : null,
    related: wiki.status === 'fulfilled' ? wiki.value.related : [],
    images: images.status === 'fulfilled' ? images.value : [],
    papers: papers.status === 'fulfilled' ? papers.value : [],
  };
}

export async function fetchGroundedExplainer(query, fallbackDescription = '') {
  const content = await fetchTopicContent(query, { imageCount: 2, paperCount: 2 });
  const summary = content.summary;

  if (!summary?.extract) {
    if (!fallbackDescription) return null;
    return trimSentence(fallbackDescription, 220);
  }

  const parts = [trimSentence(summary.extract, 420)];

  if (content.papers.length > 0) {
    const topPaper = content.papers[0];
    const paperLine = [
      topPaper.title,
      [topPaper.venue, topPaper.year].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ');
    if (paperLine) {
      parts.push(`A good place to go next is "${paperLine}" if you want research-level depth.`);
    }
  } else if (content.related.length > 0) {
    const relatedList = content.related.slice(0, 2).map((item) => item.title).join(' and ');
    parts.push(`Useful next threads are ${relatedList}.`);
  }

  return parts.filter(Boolean).join('\n\n');
}

export async function fetchSpecificTopicChildren(query, domain = 'general', count = 6) {
  const wiki = await fetchWikipediaTopic(query);
  const baseTitle = wiki.summary?.title || query;
  const rawLinks = await fetchWikipediaLinks(baseTitle, count);
  const linkTitles = dedupeBy(
    rawLinks.filter((title) => isUsefulWikiLink(title, baseTitle)),
    (title) => title.toLowerCase()
  ).slice(0, count + 3);

  const extracts = await fetchPageExtracts(linkTitles.slice(0, count));

  return linkTitles.slice(0, count).map((title, index) => ({
    id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${index + 1}`,
    label: title,
    description: extracts.get(title) || `${title} is a key idea connected to ${baseTitle}.`,
    kind: index === 0 ? 'mechanism' : index === 1 ? 'question' : index === 2 ? 'connection' : index === 3 ? 'experiment' : 'paradox',
    difficulty: index < 2 ? 'beginner' : index < 4 ? 'intermediate' : 'advanced',
    surpriseFactor: index >= 4,
    domain,
    path: [baseTitle, title],
  }));
}
