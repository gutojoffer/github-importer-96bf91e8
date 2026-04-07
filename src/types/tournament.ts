export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  createdAt: string;
  xp: number;
}

export interface PlayerStats {
  playerId: string;
  wins: number;
  losses: number;
  finishWins: number;
  extremeFinishWins: number;
  points: number;
  weekKey: string;
  monthKey: string;
}

export type FinishType = 'spin' | 'over' | 'burst' | 'extreme';

export interface MatchResult {
  winnerId: string;
  finishType: FinishType;
}

export interface ScoreAction {
  id: string;
  playerId: string;
  finishType: FinishType;
  points: number;
  timestamp: string;
  undone?: boolean;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  result?: MatchResult;
  arenaIndex: number;
  roundIndex: number;
  isBye?: boolean;
  isWalkover?: boolean;
  player1Points: number;
  player2Points: number;
  scoreLog?: ScoreAction[];
}

export interface TournamentRound {
  index: number;
  matches: Match[];
  completed: boolean;
  byePlayerId?: string;
  /** Label for elimination rounds */
  label?: string;
}

export type EliminationSize = 4 | 8 | 16 | null;
export type TournamentPhase = 'swiss' | 'elimination' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  date: string;
  registrationDeadline: string;
  playerIds: string[];
  droppedPlayerIds?: string[];
  rounds: TournamentRound[];
  currentRound: number;
  arenaCount: number;
  totalRounds: number;
  pointsToWin: number;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: string;
  finalStandings?: TournamentStanding[];
  maxPlayers?: number;
  /** Elimination phase config */
  eliminationSize?: EliminationSize;
  /** Current phase of the tournament */
  phase?: TournamentPhase;
  /** Elimination bracket rounds (separate from swiss rounds) */
  eliminationRounds?: TournamentRound[];
  /** Current elimination round index */
  currentEliminationRound?: number;
  /** IDs of players who qualified for elimination */
  eliminationPlayerIds?: string[];
}

export interface TournamentStanding {
  playerId: string;
  placement: number;
  wins: number;
  losses: number;
  xpAwarded: number;
  dropped?: boolean;
}

export const FINISH_POINTS: Record<FinishType, number> = {
  spin: 1,
  over: 2,
  burst: 2,
  extreme: 3,
};

export const POINTS_TO_WIN = 4;

/** XP awarded by placement */
export const PLACEMENT_XP: Record<number, number> = {
  1: 50,
  2: 30,
  3: 15,
};
export const PLACEMENT_XP_DEFAULT = 5;

export const DEFAULT_AVATARS = [
  '🔵', '🔴', '🟢', '🟡', '🟣', '⚡', '🔥', '💎', '🌀', '⭐',
];

/** Elo tier system */
export interface EloTier {
  name: string;
  divisions: number;
  color: string;
  minXP: number;
}

export const ELO_TIERS: EloTier[] = [
  { name: 'Ferro', divisions: 3, color: '0 0% 45%', minXP: 0 },
  { name: 'Prata', divisions: 3, color: '210 10% 70%', minXP: 300 },
  { name: 'Ouro', divisions: 3, color: '45 80% 55%', minXP: 600 },
  { name: 'Platina', divisions: 3, color: '185 50% 60%', minXP: 900 },
  { name: 'Diamante', divisions: 3, color: '200 80% 70%', minXP: 1200 },
  { name: 'Mestre', divisions: 0, color: '270 60% 60%', minXP: 1500 },
  { name: 'Grão-Mestre', divisions: 0, color: '0 75% 55%', minXP: 1700 },
  { name: 'Profissional', divisions: 0, color: '45 90% 50%', minXP: 2000 },
];

export function getEloFromXP(xp: number): { tier: EloTier; division: number | null; label: string } {
  let currentTier = ELO_TIERS[0];
  for (let i = ELO_TIERS.length - 1; i >= 0; i--) {
    if (xp >= ELO_TIERS[i].minXP) {
      currentTier = ELO_TIERS[i];
      break;
    }
  }

  if (currentTier.divisions === 0) {
    return { tier: currentTier, division: null, label: currentTier.name };
  }

  const xpInTier = xp - currentTier.minXP;
  const tierIdx = ELO_TIERS.indexOf(currentTier);
  const nextTier = ELO_TIERS[tierIdx + 1];
  const tierRange = nextTier ? nextTier.minXP - currentTier.minXP : 300;
  const divisionSize = tierRange / currentTier.divisions;

  const divisionProgress = Math.floor(xpInTier / divisionSize);
  const division = Math.max(1, currentTier.divisions - Math.min(divisionProgress, currentTier.divisions - 1));

  return { tier: currentTier, division, label: `${currentTier.name} ${division}` };
}
