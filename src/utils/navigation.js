export const OPEN_DEEP_DIVE_EVENT = 'spark:open-deep-dive';

export function openDeepDive(node) {
  window.dispatchEvent(new CustomEvent(OPEN_DEEP_DIVE_EVENT, { detail: node }));
}
