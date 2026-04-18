// Image search for explainer and discovery cards
// Uses LoremFlickr (Flickr CC-licensed photos, keyword-based, no API key needed)
// Format: https://loremflickr.com/{w}/{h}/{keyword1,keyword2}

// Domain keyword seeds — used as secondary fallback when node label yields weak results
const DOMAIN_IMAGE_QUERIES = {
  math:         ['mathematics,equations', 'geometry,patterns', 'fibonacci,spiral'],
  science:      ['science,laboratory', 'microscope,biology', 'physics,experiment'],
  cs:           ['programming,code', 'circuit,technology', 'data,visualization'],
  art:          ['painting,canvas,studio', 'watercolor,abstract', 'sculpture,museum'],
  music:        ['piano,instrument', 'orchestra,concert', 'guitar,music'],
  history:      ['ancient,ruins', 'historical,library', 'museum,artifacts'],
  literature:   ['book,reading,light', 'library,shelves', 'writing,notebook'],
  philosophy:   ['meditation,thinking', 'greek,temple', 'brain,neurons'],
  engineering:  ['blueprints,design', 'bridge,structure', 'mechanical,gears'],
  languages:    ['world,map,languages', 'linguistics,books', 'multilingual'],
  cooking:      ['cooking,kitchen', 'spices,colorful', 'chef,restaurant'],
  sports:       ['sports,athletics', 'stadium,crowd', 'running,track'],
  dance:        ['ballet,dance,stage', 'hiphop,dance', 'contemporary,dance'],
  film:         ['cinema,camera,movie', 'film,projector', 'director,clapperboard'],
  architecture: ['architecture,building', 'interior,light,modern', 'cityscape,urban'],
};

function toKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(',');
}

// Get image URLs for a node (returns array of image objects)
export function getImageUrls(nodeLabel, domain, count = 2) {
  const primaryKeywords = toKeywords(nodeLabel);
  const fallbackOptions = DOMAIN_IMAGE_QUERIES[domain] || ['nature,abstract,colorful'];
  const fallbackKeywords = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];

  const images = [
    {
      url: `https://loremflickr.com/600/400/${primaryKeywords || domain}`,
      alt: `Visual representation of ${nodeLabel}`,
      query: nodeLabel,
    },
  ];

  if (count > 1) {
    images.push({
      url: `https://loremflickr.com/600/400/${fallbackKeywords}`,
      alt: `${domain} concept visualization`,
      query: fallbackKeywords,
    });
  }

  return images.slice(0, count);
}

// Preload image and check if it loads
export function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    setTimeout(() => resolve(false), 5000);
  });
}
