import { Match, Tournament, TournamentRound, EliminationSize } from '@/types/tournament';

export function suggestRounds(playerCount: number): number {
  if (playerCount <= 1) return 0;
  return Math.max(1, Math.ceil(Math.log2(playerCount)));
}

function createMatch(p1: string, p2: string, arenaIndex: number, roundIndex: number): Match {
  return {
    id: crypto.randomUUID(),
    player1Id: p1,
    player2Id: p2,
    arenaIndex,
    roundIndex,
    player1Points: 0,
    player2Points: 0,
  };
}

function createByeMatch(playerId: string, roundIndex: number): Match {
  return {
    id: crypto.randomUUID(),
    player1Id: playerId,
    player2Id: '',
    arenaIndex: -1,
    roundIndex,
    player1Points: 0,
    player2Points: 0,
    isBye: true,
    result: { winnerId: playerId, finishType: 'spin' },
  };
}

export function generateFirstRound(playerIds: string[], arenaCount: number): TournamentRound {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const matches: Match[] = [];
  let byePlayerId: string | undefined;

  if (shuffled.length % 2 !== 0) {
    const byeIdx = Math.floor(Math.random() * shuffled.length);
    byePlayerId = shuffled.splice(byeIdx, 1)[0];
    matches.push(createByeMatch(byePlayerId, 0));
  }

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    matches.push(createMatch(shuffled[i], shuffled[i + 1], Math.floor(i / 2) % arenaCount, 0));
  }

  return { index: 0, matches, completed: false, byePlayerId };
}

export function generateSwissRound(tournament: Tournament): TournamentRound | null {
  const roundIndex = tournament.currentRound;
  if (roundIndex >= tournament.totalRounds) return null;

  const activePlayerIds = tournament.playerIds.filter(id => !(tournament.droppedPlayerIds || []).includes(id));
  if (activePlayerIds.length < 2) return null;

  const pointsMap = new Map<string, number>();
  for (const pid of activePlayerIds) pointsMap.set(pid, 0);

  const playedPairs = new Set<string>();
  const byeHistory = new Set<string>();

  for (const round of tournament.rounds) {
    if (round.byePlayerId) byeHistory.add(round.byePlayerId);
    for (const match of round.matches) {
      if (match.result && !match.isBye) {
        const cur = pointsMap.get(match.result.winnerId) || 0;
        pointsMap.set(match.result.winnerId, cur + 1);
      }
      if (!match.isBye) {
        const pairKey = [match.player1Id, match.player2Id].sort().join('-');
        playedPairs.add(pairKey);
      }
    }
  }

  const sorted = [...activePlayerIds].sort((a, b) => {
    const diff = (pointsMap.get(b) || 0) - (pointsMap.get(a) || 0);
    return diff !== 0 ? diff : Math.random() - 0.5;
  });

  const matches: Match[] = [];
  let byePlayerId: string | undefined;

  if (sorted.length % 2 !== 0) {
    const candidates = sorted.filter(id => !byeHistory.has(id));
    const byePlayer = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : sorted[sorted.length - 1];
    byePlayerId = byePlayer;
    const idx = sorted.indexOf(byePlayer);
    sorted.splice(idx, 1);
    matches.push(createByeMatch(byePlayer, roundIndex));
  }

  const paired = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    if (paired.has(sorted[i])) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      if (paired.has(sorted[j])) continue;
      const pairKey = [sorted[i], sorted[j]].sort().join('-');
      if (!playedPairs.has(pairKey)) {
        matches.push(createMatch(sorted[i], sorted[j], matches.filter(m => !m.isBye).length % tournament.arenaCount, roundIndex));
        paired.add(sorted[i]);
        paired.add(sorted[j]);
        break;
      }
    }
    if (!paired.has(sorted[i])) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (!paired.has(sorted[j])) {
          matches.push(createMatch(sorted[i], sorted[j], matches.filter(m => !m.isBye).length % tournament.arenaCount, roundIndex));
          paired.add(sorted[i]);
          paired.add(sorted[j]);
          break;
        }
      }
    }
  }

  return { index: roundIndex, matches, completed: false, byePlayerId };
}

/** Get Swiss standings for qualifying into elimination */
export function getSwissStandings(tournament: Tournament): { playerId: string; wins: number; losses: number }[] {
  const activePlayerIds = tournament.playerIds.filter(id => !(tournament.droppedPlayerIds || []).includes(id));
  const winsMap = new Map<string, number>();
  const lossesMap = new Map<string, number>();
  for (const pid of activePlayerIds) { winsMap.set(pid, 0); lossesMap.set(pid, 0); }

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.isBye) {
        winsMap.set(match.player1Id, (winsMap.get(match.player1Id) || 0) + 1);
        continue;
      }
      if (match.result) {
        const winnerId = match.result.winnerId;
        const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
        if (activePlayerIds.includes(winnerId)) winsMap.set(winnerId, (winsMap.get(winnerId) || 0) + 1);
        if (activePlayerIds.includes(loserId)) lossesMap.set(loserId, (lossesMap.get(loserId) || 0) + 1);
      }
    }
  }

  return activePlayerIds
    .map(pid => ({ playerId: pid, wins: winsMap.get(pid) || 0, losses: lossesMap.get(pid) || 0 }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
}

/** Generate elimination bracket from qualified player IDs (seeded 1st vs last, etc.) */
export function generateEliminationBracket(qualifiedIds: string[], arenaCount: number, pointsToWin: number): TournamentRound[] {
  const size = qualifiedIds.length;
  if (size < 2) return [];

  // Seeded pairing: 1 vs N, 2 vs N-1, etc.
  const seeded = [...qualifiedIds];
  const totalRoundsNeeded = Math.ceil(Math.log2(size));
  const rounds: TournamentRound[] = [];

  // Generate first round of elimination
  const firstRoundMatches: Match[] = [];
  const paired: string[] = [];

  // If not a perfect power of 2, some players get byes
  const perfectSize = Math.pow(2, totalRoundsNeeded);
  const byeCount = perfectSize - size;

  // Top seeds get byes
  const byePlayers = seeded.slice(0, byeCount);
  const matchPlayers = seeded.slice(byeCount);

  // Pair remaining: top seed vs bottom seed
  for (let i = 0; i < matchPlayers.length / 2; i++) {
    const p1 = matchPlayers[i];
    const p2 = matchPlayers[matchPlayers.length - 1 - i];
    firstRoundMatches.push(createMatch(p1, p2, i % arenaCount, 0));
  }

  // Add bye matches for top seeds
  for (const byePlayer of byePlayers) {
    firstRoundMatches.push(createByeMatch(byePlayer, 0));
  }

  const roundLabels = getRoundLabels(totalRoundsNeeded);

  rounds.push({
    index: 0,
    matches: firstRoundMatches,
    completed: false,
    label: roundLabels[0],
  });

  return rounds;
}

/** Generate next elimination round from winners of current round */
export function generateNextEliminationRound(
  currentRound: TournamentRound,
  roundIndex: number,
  arenaCount: number,
  totalEliminationRounds: number
): TournamentRound | null {
  const winners = currentRound.matches
    .filter(m => m.result)
    .map(m => m.result!.winnerId);

  if (winners.length < 2) return null;

  const matches: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      matches.push(createMatch(winners[i], winners[i + 1], Math.floor(i / 2) % arenaCount, roundIndex));
    } else {
      // Odd number (shouldn't happen in proper bracket) - bye
      matches.push(createByeMatch(winners[i], roundIndex));
    }
  }

  const roundLabels = getRoundLabels(totalEliminationRounds);

  return {
    index: roundIndex,
    matches,
    completed: false,
    label: roundLabels[roundIndex] || `Rodada ${roundIndex + 1}`,
  };
}

function getRoundLabels(totalRounds: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < totalRounds; i++) {
    const remaining = totalRounds - i;
    if (remaining === 1) labels.push('FINAL');
    else if (remaining === 2) labels.push('SEMIFINAL');
    else if (remaining === 3) labels.push('QUARTAS DE FINAL');
    else labels.push(`RODADA ${i + 1}`);
  }
  return labels;
}
