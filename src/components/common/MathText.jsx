import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function renderKatex(tex, display) {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode: display,
      trust: false,
      strict: false,
    });
  } catch {
    return tex;
  }
}

// Split text into text/inline-math/block-math segments
function splitMath(text) {
  if (!text) return [];
  const parts = [];
  // $$...$$ (display) must be matched before $...$ (inline)
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('$$')) {
      parts.push({ type: 'block', content: raw.slice(2, -2).trim() });
    } else {
      parts.push({ type: 'inline', content: raw.slice(1, -1).trim() });
    }
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });
  return parts;
}

export default function MathText({ text, className = '', as: Tag = 'span' }) {
  const parts = useMemo(() => splitMath(text), [text]);
  if (!text) return null;

  // Fast path: no math delimiters
  if (parts.length === 1 && parts[0].type === 'text') {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      {parts.map((part, i) => {
        if (part.type === 'inline') {
          return (
            <span
              key={i}
              className="katex-inline"
              dangerouslySetInnerHTML={{ __html: renderKatex(part.content, false) }}
            />
          );
        }
        if (part.type === 'block') {
          return (
            <span
              key={i}
              className="katex-block my-2 overflow-x-auto block"
              dangerouslySetInnerHTML={{ __html: renderKatex(part.content, true) }}
            />
          );
        }
        return <span key={i}>{part.content}</span>;
      })}
    </Tag>
  );
}
