function normalizePath(pathOrNode) {
  if (!pathOrNode) return [];
  if (Array.isArray(pathOrNode)) return pathOrNode.filter(Boolean);
  if (Array.isArray(pathOrNode.path)) return pathOrNode.path.filter(Boolean);
  return [];
}

export function encodeThreadPath(pathOrNode) {
  const path = normalizePath(pathOrNode);
  return encodeURIComponent(
    path
      .map((segment) => String(segment).trim().replace(/\s+/g, '-'))
      .join('/')
  );
}

export function buildThreadUrl(pathOrNode, origin = window.location.origin) {
  return `${origin}/?thread=${encodeThreadPath(pathOrNode)}`;
}

export async function copyThreadUrl(pathOrNode) {
  const url = buildThreadUrl(pathOrNode);

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return url;
  }

  const input = document.createElement('input');
  input.value = url;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
  return url;
}
