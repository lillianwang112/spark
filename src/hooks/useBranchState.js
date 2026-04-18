// Calculates branch state for a saved track node based on SRS timing and activity
import { useMemo } from 'react';
import { BRANCH_STATES, BRANCH_THRESHOLDS } from '../utils/constants.js';
import { daysSince } from '../utils/helpers.js';

// Pure function: derive branch state from node data + current time
export function deriveBranchState(node) {
  if (!node) return BRANCH_STATES.HEALTHY;

  const { mode, srsData, timestamp, lastTended, branchState } = node;

  // Flowering: only achievable in mastering mode (set explicitly, not derived here)
  if (branchState === BRANCH_STATES.FLOWERING) return BRANCH_STATES.FLOWERING;

  // Dormant: no interaction for 60+ days
  const daysSinceActivity = daysSince(lastTended || timestamp);
  if (daysSinceActivity >= BRANCH_THRESHOLDS.WILTING_TO_DORMANT_IDLE) {
    return BRANCH_STATES.DORMANT;
  }

  // For mastering mode with SRS data
  if (mode === 'mastering' && srsData) {
    const overdueDays = srsData.nextReview
      ? Math.max(0, Math.ceil((Date.now() - new Date(srsData.nextReview)) / (1000 * 60 * 60 * 24)))
      : 0;

    if (overdueDays >= BRANCH_THRESHOLDS.THIRSTY_TO_WILTING_SRS) {
      return BRANCH_STATES.WILTING;
    }
    if (overdueDays >= BRANCH_THRESHOLDS.HEALTHY_TO_THIRSTY_SRS) {
      return BRANCH_STATES.THIRSTY;
    }
  }

  // For exploring mode: activity-based only
  if (daysSinceActivity >= BRANCH_THRESHOLDS.THIRSTY_TO_WILTING_IDLE) {
    return BRANCH_STATES.WILTING;
  }
  if (daysSinceActivity >= BRANCH_THRESHOLDS.HEALTHY_TO_THIRSTY_IDLE) {
    return BRANCH_STATES.THIRSTY;
  }

  return BRANCH_STATES.HEALTHY;
}

// Visual config for each branch state
export const BRANCH_STATE_CONFIG = {
  [BRANCH_STATES.FLOWERING]: {
    emoji: '🌸',
    label: 'Flowering',
    saturation: 1.0,
    glowColor: '#FFD700',
    glowOpacity: 0.6,
    lineWidth: 3,
    dotSize: 14,
  },
  [BRANCH_STATES.HEALTHY]: {
    emoji: '🌿',
    label: 'Healthy',
    saturation: 1.0,
    glowColor: null,
    glowOpacity: 0,
    lineWidth: 2,
    dotSize: 10,
  },
  [BRANCH_STATES.THIRSTY]: {
    emoji: '🍂',
    label: 'Thirsty',
    saturation: 0.7,
    glowColor: '#FFA62B',
    glowOpacity: 0.3,
    lineWidth: 2,
    dotSize: 9,
  },
  [BRANCH_STATES.WILTING]: {
    emoji: '🥀',
    label: 'Wilting',
    saturation: 0.4,
    glowColor: null,
    glowOpacity: 0,
    lineWidth: 1.5,
    dotSize: 8,
  },
  [BRANCH_STATES.DORMANT]: {
    emoji: '🪵',
    label: 'Dormant',
    saturation: 0,
    glowColor: null,
    glowOpacity: 0,
    lineWidth: 1,
    dotSize: 7,
  },
};

export function getBranchCareMessage(node, branchState) {
  const daysSinceActivity = daysSince(node?.lastTended || node?.timestamp);

  switch (branchState) {
    case BRANCH_STATES.FLOWERING:
      return 'This branch is thriving.';
    case BRANCH_STATES.THIRSTY:
      return node?.mode === 'mastering'
        ? 'A quick review would bring this back into rhythm.'
        : `You last visited ${daysSinceActivity} days ago. A small detour would wake it up.`;
    case BRANCH_STATES.WILTING:
      return node?.mode === 'mastering'
        ? 'This branch is overdue for care. Review it before it fades.'
        : 'This rabbit hole has been quiet for a while. Revisit it to bring the color back.';
    case BRANCH_STATES.DORMANT:
      return 'Sleeping, not lost. One visit is enough to wake it up.';
    default:
      return 'Healthy and ready for another step.';
  }
}

// Hook: derive branch state for a single track node
export function useBranchState(node) {
  return useMemo(() => {
    const state = deriveBranchState(node);
    const config = BRANCH_STATE_CONFIG[state];
    const message = getBranchCareMessage(node, state);
    const needsAttention = [BRANCH_STATES.THIRSTY, BRANCH_STATES.WILTING, BRANCH_STATES.DORMANT].includes(state);
    return { state, config, message, needsAttention };
  }, [node]);
}

// Get display color for a branch given domain color + state
export function getBranchDisplayColor(domainColor, branchState) {
  const config = BRANCH_STATE_CONFIG[branchState] || BRANCH_STATE_CONFIG[BRANCH_STATES.HEALTHY];

  if (branchState === BRANCH_STATES.FLOWERING) return '#FFD700';
  if (branchState === BRANCH_STATES.DORMANT) return '#8B8B7A';

  if (config.saturation >= 1.0) return domainColor;

  // Desaturate hex color by saturation factor
  return desaturateHex(domainColor, config.saturation);
}

function desaturateHex(hex, factor) {
  if (!hex || !hex.startsWith('#')) return hex;
  try {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = Math.round(r * factor + gray * (1 - factor));
    g = Math.round(g * factor + gray * (1 - factor));
    b = Math.round(b * factor + gray * (1 - factor));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return hex;
  }
}
