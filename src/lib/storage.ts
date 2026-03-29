import { Player, PlayerStats, Tournament, TournamentStanding, PLACEMENT_XP, PLACEMENT_XP_DEFAULT } from '@/types/tournament';

const KEYS = {
  players: 'bbx_players',
  stats: 'bbx_stats',
  tournaments: 'bbx_tournaments',
  activeTournament: 'bbx_active_tournament',
  completedTournaments: 'bbx_completed_tournaments',
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
export function getPlayers(): Player[] {
  return load<Player[]>(KEYS.players, []).map(p => ({ ...p, xp: p.xp ?? 0 }));
}
export function savePlayers(p: Player[]) { save(KEYS.players, p); }
export function addPlayer(p: Player) { const all = getPlayers(); all.push(p); savePlayers(all); }
export function deletePlayer(id: string) { savePlayers(getPlayers().filter(p => p.id !== id)); }

export function getPlayerById(id: string): Player | undefined {
  return getPlayers().find(p => p.id === id);
}

// Stats
export function getAllStats(): PlayerStats[] { return load(KEYS.stats, []); }
export function saveAllStats(s: PlayerStats[]) { save(KEYS.stats, s); }

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}
function getTimeKeys(d: Date) {
  const weekNum = getWeekNumber(d);
  return {
    weekKey: `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`,
    monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
  };
}

/** Award XP to players based on final standings */
export function awardXP(standings: TournamentStanding[]) {
  const players = getPlayers();
  for (const s of standings) {
    const p = players.find(pl => pl.id === s.playerId);
    if (p) {
      p.xp = (p.xp || 0) + s.xpAwarded;
    }
  }
  savePlayers(players);

  // Also update stats for leaderboard
  const all = getAllStats();
  const now = new Date();
  const { weekKey, monthKey } = getTimeKeys(now);
  for (const s of standings) {
    let idx = all.findIndex(st => st.playerId === s.playerId && st.weekKey === weekKey);
    if (idx === -1) {
      all.push({ playerId: s.playerId, wins: 0, losses: 0, finishWins: 0, extremeFinishWins: 0, points: 0, weekKey, monthKey });
      idx = all.length - 1;
    }
    all[idx].points += s.xpAwarded;
    all[idx].wins += s.wins;
    all[idx].losses += s.losses;
  }
  saveAllStats(all);
}

export function updatePlayerStats(_playerId: string, _won: boolean, _pts: number) {
  // XP is now awarded only at tournament end
}

// Tournaments
export function getTournaments(): Tournament[] { return load(KEYS.tournaments, []); }
export function saveTournaments(t: Tournament[]) { save(KEYS.tournaments, t); }
export function getActiveTournament(): Tournament | null { return load(KEYS.activeTournament, null); }
export function saveActiveTournament(t: Tournament | null) { save(KEYS.activeTournament, t); }

export function getCompletedTournaments(): Tournament[] { return load(KEYS.completedTournaments, []); }
export function saveCompletedTournament(t: Tournament) {
  const all = getCompletedTournaments();
  all.unshift(t);
  save(KEYS.completedTournaments, all);
}

/** Calculate final standings from a tournament's match history */
export function calculateStandings(tournament: Tournament): TournamentStanding[] {
  const winsMap = new Map<string, number>();
  const lossesMap = new Map<string, number>();
  for (const pid of tournament.playerIds) { winsMap.set(pid, 0); lossesMap.set(pid, 0); }
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.isBye) { winsMap.set(match.player1Id, (winsMap.get(match.player1Id) || 0) + 1); continue; }
      if (match.result) {
        const winnerId = match.result.winnerId;
        const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
        winsMap.set(winnerId, (winsMap.get(winnerId) || 0) + 1);
        lossesMap.set(loserId, (lossesMap.get(loserId) || 0) + 1);
      }
    }
  }
  const sorted = tournament.playerIds
    .map(pid => ({ playerId: pid, wins: winsMap.get(pid) || 0, losses: lossesMap.get(pid) || 0 }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  return sorted.map((entry, i) => ({
    ...entry,
    placement: i + 1,
    xpAwarded: PLACEMENT_XP[i + 1] ?? PLACEMENT_XP_DEFAULT,
  }));
}

// Leaderboard
export function getWeeklyLeaderboard() {
  const now = new Date();
  const { weekKey } = getTimeKeys(now);
  return aggregateStats(s => s.weekKey === weekKey);
}
export function getMonthlyLeaderboard() {
  const now = new Date();
  const { monthKey } = getTimeKeys(now);
  return aggregateStats(s => s.monthKey === monthKey);
}
function aggregateStats(filter: (s: PlayerStats) => boolean) {
  const all = getAllStats().filter(filter);
  const map = new Map<string, { points: number; wins: number; losses: number }>();
  for (const s of all) {
    const cur = map.get(s.playerId) || { points: 0, wins: 0, losses: 0 };
    cur.points += s.points; cur.wins += s.wins; cur.losses += s.losses;
    map.set(s.playerId, cur);
  }
  return Array.from(map.entries()).map(([playerId, data]) => ({ playerId, ...data })).sort((a, b) => b.points - a.points);
}

/** Create an upcoming tournament */
export function createUpcomingTournament(t: Tournament) {
  const all = getTournaments();
  all.push(t);
  saveTournaments(all);
}

/** Register player to upcoming tournament */
export function registerPlayerToTournament(tournamentId: string, playerId: string) {
  const all = getTournaments();
  const t = all.find(t => t.id === tournamentId);
  if (t && !t.playerIds.includes(playerId)) {
    t.playerIds.push(playerId);
    saveTournaments(all);
  }
}
