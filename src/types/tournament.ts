export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  createdAt: string;
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

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  result?: MatchResult;
  arenaIndex: number;
  roundIndex: number;
  isBye?: boolean;
  player1Points: number;
  player2Points: number;
}

export interface TournamentRound {
  index: number;
  matches: Match[];
  completed: boolean;
  byePlayerId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  playerIds: string[];
  rounds: TournamentRound[];
  currentRound: number;
  arenaCount: number;
  totalRounds: number;
  pointsToWin: number;
  status: 'setup' | 'active' | 'completed';
  createdAt: string;
  /** Final standings after tournament ends */
  finalStandings?: TournamentStanding[];
}

export interface TournamentStanding {
  playerId: string;
  placement: number;
  wins: number;
  losses: number;
  circuitPoints: number;
}

export const FINISH_POINTS: Record<FinishType, number> = {
  spin: 1,
  over: 1,
  burst: 2,
  extreme: 1,
};

/** Circuit points awarded by final placement */
export const CIRCUIT_POINTS: Record<number, number> = {
  1: 1000,
  2: 700,
  3: 500,
};
export const CIRCUIT_POINTS_DEFAULT = 100; // 4th place and beyond

export const DEFAULT_AVATARS = [
  '🔵', '🔴', '🟢', '🟡', '🟣', '⚡', '🔥', '💎', '🌀', '⭐',
];
