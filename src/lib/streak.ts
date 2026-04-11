import { Tournament } from '@/types/tournament';

/**
 * Compute current win streak for a player in a tournament
 * by walking completed rounds in reverse order.
 */
export function getPlayerStreak(tournament: Tournament, playerId: string): number {
  const allRounds = [...(tournament.rounds || [])];
  let streak = 0;

  // Walk rounds from latest to earliest
  for (let i = allRounds.length - 1; i >= 0; i--) {
    const round = allRounds[i];
    if (!round.completed) continue;

    const match = round.matches.find(
      m => (m.player1Id === playerId || m.player2Id === playerId) && m.result
    );
    if (!match) continue;

    if (match.result!.winnerId === playerId) {
      streak++;
    } else {
      break; // streak broken
    }
  }

  return streak;
}

/**
 * Build a map of playerId → streak for the active tournament
 */
export function getStreakMap(tournament: Tournament): Record<string, number> {
  const map: Record<string, number> = {};
  for (const pid of tournament.playerIds) {
    map[pid] = getPlayerStreak(tournament, pid);
  }
  return map;
}
