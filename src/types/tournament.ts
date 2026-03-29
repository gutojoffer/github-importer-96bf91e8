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
  /** Points accumulated in a best-of series */
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
}

export const FINISH_POINTS: Record<FinishType, number> = {
  spin: 1,
  over: 1,
  burst: 2,
  extreme: 1,
};

export const DEFAULT_AVATARS = [
  '🔵', '🔴', '🟢', '🟡', '🟣', '⚡', '🔥', '💎', '🌀', '⭐',
];
