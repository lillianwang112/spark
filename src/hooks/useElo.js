import { useCallback } from 'react';
import { useUserContext } from './useUserContext.jsx';
import { updateElo, getRankedDomains, getTopDomains, getBottomDomains } from '../models/elo.js';

export function useElo() {
  const { eloScores, updateElo: setEloScores } = useUserContext();

  const recordPick = useCallback((winnerId, loserIds, round, totalRounds) => {
    const updated = updateElo(winnerId, loserIds, eloScores, round, totalRounds);
    setEloScores(updated);
    return updated;
  }, [eloScores, setEloScores]);

  const ranked = getRankedDomains(eloScores);
  const topDomains = getTopDomains(eloScores, 3);
  const bottomDomains = getBottomDomains(eloScores, 3);

  return {
    eloScores,
    ranked,
    topDomains,
    bottomDomains,
    recordPick,
  };
}
