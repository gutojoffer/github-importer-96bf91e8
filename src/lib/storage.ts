import { Player, PlayerStats, Tournament, TournamentStanding, CIRCUIT_POINTS, CIRCUIT_POINTS_DEFAULT } from '@/types/tournament';

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
export function getPlayers(): Player[] { return load(KEYS.players, []); }
export function savePlayers(p: Player[]) { save(KEYS.players, p); }
export function addPlayer(p: Player) { const all = getPlayers(); all.push(p); savePlayers(all); }
export function deletePlayer(id: string) { savePlayers(getPlayers().filter(p => p.id !== id)); }

// Stats (now circuit-points based)
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

/** Award circuit points to players based on final standings */
export function awardCircuitPoints(standings: TournamentStanding[]) {
  const all = getAllStats();
  const now = new Date();
  const { weekKey, monthKey } = getTimeKeys(now);

  for (const s of standings) {
    let idx = all.findIndex(st => st.playerId === s.playerId && st.weekKey === weekKey);
    if (idx === -1) {
      all.push({ playerId: s.playerId, wins: 0, losses: 0, finishWins: 0, extremeFinishWins: 0, points: 0, weekKey, monthKey });
      idx = all.length - 1;
    }
    all[idx].points += s.circuitPoints;
    all[idx].wins += s.wins;
    all[idx].losses += s.losses;
  }

  saveAllStats(all);
}

/** Legacy: still used during match scoring for tracking W/L in arena, but no longer adds points */
export function updatePlayerStats(playerId: string, won: boolean, _finishPoints: number) {
  // Points are now awarded only via circuit points at tournament end.
  // This function is kept for match-level W/L tracking during arena play (no point changes).
  void playerId; void won; void _finishPoints;
}

// Tournaments
export function getTournaments(): Tournament[] { return load(KEYS.tournaments, []); }
export function saveTournaments(t: Tournament[]) { save(KEYS.tournaments, t); }
export function getActiveTournament(): Tournament | null { return load(KEYS.activeTournament, null); }
export function saveActiveTournament(t: Tournament | null) { save(KEYS.activeTournament, t); }

// Completed tournaments history
export function getCompletedTournaments(): Tournament[] { return load(KEYS.completedTournaments, []); }
export function saveCompletedTournament(t: Tournament) {
  const all = getCompletedTournaments();
  all.unshift(t); // newest first
  save(KEYS.completedTournaments, all);
}

/** Calculate final standings from a tournament's match history */
export function calculateStandings(tournament: Tournament): TournamentStanding[] {
  const winsMap = new Map<string, number>();
  const lossesMap = new Map<string, number>();

  // Init all players
  for (const pid of tournament.playerIds) {
    winsMap.set(pid, 0);
    lossesMap.set(pid, 0);
  }

  // Count W/L from all rounds
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.isBye) {
        // Bye = auto win
        winsMap.set(match.player1Id, (winsMap.get(match.player1Id) || 0) + 1);
        continue;
      }
      if (match.result) {
        const winnerId = match.result.winnerId;
        const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
        winsMap.set(winnerId, (winsMap.get(winnerId) || 0) + 1);
        lossesMap.set(loserId, (lossesMap.get(loserId) || 0) + 1);
      }
    }
  }

  // Sort by wins desc, then losses asc
  const sorted = tournament.playerIds
    .map(pid => ({
      playerId: pid,
      wins: winsMap.get(pid) || 0,
      losses: lossesMap.get(pid) || 0,
    }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return sorted.map((entry, i) => ({
    ...entry,
    placement: i + 1,
    circuitPoints: CIRCUIT_POINTS[i + 1] ?? CIRCUIT_POINTS_DEFAULT,
  }));
}

// Leaderboard helpers
export function getWeeklyLeaderboard(): { playerId: string; points: number; wins: number; losses: number }[] {
  const now = new Date();
  const { weekKey } = getTimeKeys(now);
  return aggregateStats(s => s.weekKey === weekKey);
}

export function getMonthlyLeaderboard(): { playerId: string; points: number; wins: number; losses: number }[] {
  const now = new Date();
  const { monthKey } = getTimeKeys(now);
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

/** Seed mock completed tournaments for demo purposes */
export function seedMockTournaments() {
  const existing = getCompletedTournaments();
  if (existing.length > 0) return; // already seeded

  const players = getPlayers();
  if (players.length < 3) return; // need at least 3 players

  const pids = players.map(p => p.id);

  const mockTournaments: Tournament[] = [
    {
      id: 'mock-1',
      name: 'Copa Blader X',
      playerIds: pids.slice(0, Math.min(pids.length, 6)),
      rounds: [],
      currentRound: 0,
      arenaCount: 2,
      totalRounds: 3,
      pointsToWin: 4,
      status: 'completed',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      finalStandings: pids.slice(0, Math.min(pids.length, 6)).map((pid, i) => ({
        playerId: pid,
        placement: i + 1,
        wins: Math.max(5 - i, 1),
        losses: i,
        circuitPoints: CIRCUIT_POINTS[i + 1] ?? CIRCUIT_POINTS_DEFAULT,
      })),
    },
    {
      id: 'mock-2',
      name: 'Torneio Relâmpago',
      playerIds: pids.slice(0, Math.min(pids.length, 4)),
      rounds: [],
      currentRound: 0,
      arenaCount: 1,
      totalRounds: 2,
      pointsToWin: 3,
      status: 'completed',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      finalStandings: pids.slice(0, Math.min(pids.length, 4)).map((pid, i) => ({
        playerId: pid,
        placement: i + 1,
        wins: Math.max(4 - i, 1),
        losses: i,
        circuitPoints: CIRCUIT_POINTS[i + 1] ?? CIRCUIT_POINTS_DEFAULT,
      })),
    },
  ];

  for (const t of mockTournaments) {
    saveCompletedTournament(t);
  }
}
