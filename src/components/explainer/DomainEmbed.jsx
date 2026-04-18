import { useState } from 'react';
import { motion } from 'framer-motion';
void motion;

// Maps topic nodes to best-in-class embeds for specific domains
// Priority: embed > generated diagram > image

const EMBED_CONFIGS = {
  // Desmos for math visualization
  math: (node) => {
    const label = (node.label || '').toLowerCase();
    if (label.includes('graph') || label.includes('function') || label.includes('calculus') ||
        label.includes('parabola') || label.includes('derivative') || label.includes('integral')) {
      return { type: 'desmos', show: true };
    }
    return null;
  },
  // PhET for physics/chemistry
  science: (node) => {
    const label = (node.label || '').toLowerCase();
    if (label.includes('wave') || label.includes('circuit') || label.includes('force') ||
        label.includes('quantum') || label.includes('atom') || label.includes('molecule')) {
      // Return a PhET-style embed
      return { type: 'phet_suggestion', show: true, label: node.label };
    }
    return null;
  },
};

function DesmosEmbed({ color }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[16px] overflow-hidden"
      style={{ border: `1px solid ${color}22`, height: 220 }}
    >
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: `${color}0C` }}>
        <p className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color }}>
          📊 Interactive Graph — Desmos
        </p>
        <a
          href="https://www.desmos.com/calculator"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-mono"
          style={{ color }}
        >
          Open full ↗
        </a>
      </div>
      <iframe
        src="https://www.desmos.com/calculator?embed"
        width="100%"
        height="180"
        frameBorder="0"
        title="Interactive graph"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0.3, transition: 'opacity 0.3s', display: 'block' }}
      />
    </motion.div>
  );
}

export function getDomainEmbed(node) {
  if (!node) return null;
  const domain = node.domain || '';
  const embedFn = EMBED_CONFIGS[domain];
  if (!embedFn) return null;
  return embedFn(node);
}

export default function DomainEmbed({ node, color }) {
  const embed = getDomainEmbed(node);
  if (!embed) return null;

  if (embed.type === 'desmos') {
    return <DesmosEmbed color={color} />;
  }

  // PhET suggestion — just show a link card since embedding PhET requires specific sim URLs
  if (embed.type === 'phet_suggestion') {
    return (
      <motion.a
        href="https://phet.colorado.edu/en/simulations/filter?subjects=physics,chemistry&type=html&sort=alpha&view=grid"
        target="_blank"
        rel="noreferrer"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-[14px] px-4 py-3 no-underline hover:opacity-80 transition-opacity"
        style={{ background: `${color}0C`, border: `1px solid ${color}20`, display: 'flex' }}
      >
        <span className="text-xl">⚗️</span>
        <div>
          <p className="font-display text-sm font-semibold text-text-primary">
            Interactive PhET Simulation
          </p>
          <p className="font-body text-xs text-text-secondary">
            Explore {embed.label} with a free interactive simulation → phet.colorado.edu
          </p>
        </div>
        <span className="text-text-muted text-xs ml-auto">↗</span>
      </motion.a>
    );
  }

  return null;
}
