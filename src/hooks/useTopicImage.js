import { useState, useEffect } from 'react';

// Fetches a topic image from Wikipedia's free thumbnail API.
// Returns { imageUrl, imageTitle, loading, error }
// Falls back silently — if no image, returns null imageUrl.
export function useTopicImage(topicName, enabled = true) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageTitle, setImageTitle] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!topicName || !enabled) return;
    let cancelled = false;
    setLoading(true);

    const controller = new AbortController();
    const query = encodeURIComponent(topicName);

    fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${query}&prop=pageimages|pageterms&format=json&pithumbsize=600&pilimit=1&wbptterms=description&origin=*`,
      { signal: controller.signal }
    )
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const pages = data.query?.pages;
        if (!pages) return;
        const page = pages[Object.keys(pages)[0]];
        if (page?.thumbnail?.source) {
          setImageUrl(page.thumbnail.source);
          setImageTitle(page.title || topicName);
        }
      })
      .catch(() => {}) // fail silently
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; controller.abort(); };
  }, [topicName, enabled]);

  return { imageUrl, imageTitle, loading };
}
