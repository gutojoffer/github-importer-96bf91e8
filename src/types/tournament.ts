export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatar: string; // URL or avatar key
  createdAt: string;
}

export interface PlayerStats {
  playerId: string;
  wins: number;
  losses: number;
  finishWins: number;
  extremeFinishWins: number;
  points: number;
  weekKey: string; // e.g. "2026-W13"
  monthKey: string; // e.g. "2026-03"
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
}

export interface TournamentRound {
  index: number;
  matches: Match[];
  completed: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  playerIds: string[];
  rounds: TournamentRound[];
  currentRound: number;
  arenaCount: number;
  totalRounds: number;
  status: 'setup' | 'active' | 'completed';
  createdAt: string;
}

export const FINISH_POINTS: Record<FinishType, number> = {
  spin: 1,
  over: 1,
  burst: 1,
  extreme: 3,
};

export const DEFAULT_AVATARS = [
  '🔵', '🔴', '🟢', '🟡', '🟣', '⚡', '🔥', '💎', '🌀', '⭐',
];
