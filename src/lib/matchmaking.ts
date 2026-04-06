import { Match, Tournament, TournamentRound } from '@/types/tournament';

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

  // Handle odd number of players
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

  // Handle odd players - give bye to someone who hasn't had one
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
