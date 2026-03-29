import { Match, Tournament, TournamentRound } from '@/types/tournament';

export function suggestRounds(playerCount: number): number {
  if (playerCount <= 1) return 0;
  return Math.max(1, Math.ceil(Math.log2(playerCount)));
}

export function generateFirstRound(playerIds: string[], arenaCount: number): TournamentRound {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const matches: Match[] = [];

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    matches.push({
      id: crypto.randomUUID(),
      player1Id: shuffled[i],
      player2Id: shuffled[i + 1],
      arenaIndex: matches.length % arenaCount,
      roundIndex: 0,
    });
  }

  return { index: 0, matches, completed: false };
}

export function generateSwissRound(tournament: Tournament): TournamentRound | null {
  const roundIndex = tournament.currentRound;
  if (roundIndex >= tournament.totalRounds) return null;

  // Calculate points per player from previous rounds
  const pointsMap = new Map<string, number>();
  for (const pid of tournament.playerIds) pointsMap.set(pid, 0);

  const playedPairs = new Set<string>();

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.result) {
        const cur = pointsMap.get(match.result.winnerId) || 0;
        pointsMap.set(match.result.winnerId, cur + 1);
      }
      const pairKey = [match.player1Id, match.player2Id].sort().join('-');
      playedPairs.add(pairKey);
    }
  }

  // Sort players by points (desc), then shuffle within same points
  const sorted = [...tournament.playerIds].sort((a, b) => {
    const diff = (pointsMap.get(b) || 0) - (pointsMap.get(a) || 0);
    return diff !== 0 ? diff : Math.random() - 0.5;
  });

  const paired = new Set<string>();
  const matches: Match[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (paired.has(sorted[i])) continue;

    for (let j = i + 1; j < sorted.length; j++) {
      if (paired.has(sorted[j])) continue;

      const pairKey = [sorted[i], sorted[j]].sort().join('-');
      if (!playedPairs.has(pairKey)) {
        matches.push({
          id: crypto.randomUUID(),
          player1Id: sorted[i],
          player2Id: sorted[j],
          arenaIndex: matches.length % tournament.arenaCount,
          roundIndex,
        });
        paired.add(sorted[i]);
        paired.add(sorted[j]);
        break;
      }
    }

    // Fallback: if no unpaired opponent found, allow repeat
    if (!paired.has(sorted[i])) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (!paired.has(sorted[j])) {
          matches.push({
            id: crypto.randomUUID(),
            player1Id: sorted[i],
            player2Id: sorted[j],
            arenaIndex: matches.length % tournament.arenaCount,
            roundIndex,
          });
          paired.add(sorted[i]);
          paired.add(sorted[j]);
          break;
        }
      }
    }
  }

  return { index: roundIndex, matches, completed: false };
}
