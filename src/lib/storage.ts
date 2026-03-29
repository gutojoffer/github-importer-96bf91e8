import { Player, PlayerStats, Tournament } from '@/types/tournament';

const KEYS = {
  players: 'bbx_players',
  stats: 'bbx_stats',
  tournaments: 'bbx_tournaments',
  activeTournament: 'bbx_active_tournament',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Players
export function getPlayers(): Player[] { return load(KEYS.players, []); }
export function savePlayers(p: Player[]) { save(KEYS.players, p); }
export function addPlayer(p: Player) { const all = getPlayers(); all.push(p); savePlayers(all); }
export function deletePlayer(id: string) { savePlayers(getPlayers().filter(p => p.id !== id)); }

// Stats
export function getAllStats(): PlayerStats[] { return load(KEYS.stats, []); }
export function saveAllStats(s: PlayerStats[]) { save(KEYS.stats, s); }

export function getOrCreateStats(playerId: string): PlayerStats {
  const now = new Date();
  const weekNum = getWeekNumber(now);
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const all = getAllStats();
  let stats = all.find(s => s.playerId === playerId && s.weekKey === weekKey);
  if (!stats) {
    stats = { playerId, wins: 0, losses: 0, finishWins: 0, extremeFinishWins: 0, points: 0, weekKey, monthKey };
    all.push(stats);
    saveAllStats(all);
  }
  return stats;
}

export function updatePlayerStats(playerId: string, won: boolean, isExtreme: boolean) {
  const all = getAllStats();
  const now = new Date();
  const weekNum = getWeekNumber(now);
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let idx = all.findIndex(s => s.playerId === playerId && s.weekKey === weekKey);
  if (idx === -1) {
    all.push({ playerId, wins: 0, losses: 0, finishWins: 0, extremeFinishWins: 0, points: 0, weekKey, monthKey });
    idx = all.length - 1;
  }

  if (won) {
    all[idx].wins++;
    if (isExtreme) { all[idx].extremeFinishWins++; all[idx].points += 3; }
    else { all[idx].finishWins++; all[idx].points += 1; }
  } else {
    all[idx].losses++;
  }

  saveAllStats(all);
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}

// Tournaments
export function getTournaments(): Tournament[] { return load(KEYS.tournaments, []); }
export function saveTournaments(t: Tournament[]) { save(KEYS.tournaments, t); }
export function getActiveTournament(): Tournament | null { return load(KEYS.activeTournament, null); }
export function saveActiveTournament(t: Tournament | null) { save(KEYS.activeTournament, t); }

// Leaderboard helpers
export function getWeeklyLeaderboard(): { playerId: string; points: number; wins: number; losses: number }[] {
  const now = new Date();
  const weekNum = getWeekNumber(now);
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  return aggregateStats(s => s.weekKey === weekKey);
}

export function getMonthlyLeaderboard(): { playerId: string; points: number; wins: number; losses: number }[] {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return aggregateStats(s => s.monthKey === monthKey);
}

function aggregateStats(filter: (s: PlayerStats) => boolean) {
  const all = getAllStats().filter(filter);
  const map = new Map<string, { points: number; wins: number; losses: number }>();
  for (const s of all) {
    const cur = map.get(s.playerId) || { points: 0, wins: 0, losses: 0 };
    cur.points += s.points;
    cur.wins += s.wins;
    cur.losses += s.losses;
    map.set(s.playerId, cur);
  }
  return Array.from(map.entries())
    .map(([playerId, data]) => ({ playerId, ...data }))
    .sort((a, b) => b.points - a.points);
}
