import { supabase } from '@/integrations/supabase/client';
import { Player, PlayerStats, Tournament, TournamentStanding, PLACEMENT_XP, PLACEMENT_XP_DEFAULT, getRankingPoints } from '@/types/tournament';

async function getLigaId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ──────────── Players ────────────

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('id, name, nickname, avatar, xp, created_at').order('created_at', { ascending: true });
  if (error) { console.error('getPlayers error:', error); return []; }
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    nickname: row.nickname || '',
    avatar: row.avatar || '🔵',
    xp: row.xp ?? 0,
    createdAt: row.created_at,
  }));
}

export async function savePlayers(players: Player[]) {
  const ligaId = await getLigaId();
  const rows = players.map(p => ({
    id: p.id,
    name: p.name,
    nickname: p.nickname,
    avatar: p.avatar,
    xp: p.xp ?? 0,
    created_at: p.createdAt,
    liga_id: ligaId,
  }));
  const { error } = await supabase.from('players').upsert(rows, { onConflict: 'id' });
  if (error) console.error('savePlayers error:', error);
}

export async function addPlayer(p: Player) {
  const ligaId = await getLigaId();
  const { error } = await supabase.from('players').insert({
    id: p.id,
    name: p.name,
    nickname: p.nickname,
    avatar: p.avatar,
    xp: p.xp ?? 0,
    created_at: p.createdAt,
    liga_id: ligaId,
  });
  if (error) console.error('addPlayer error:', error);
}

export async function updatePlayer(id: string, patch: Partial<Player>) {
  const row: { name?: string; nickname?: string; avatar?: string; xp?: number } = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.nickname !== undefined) row.nickname = patch.nickname;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.xp !== undefined) row.xp = patch.xp;
  const { error } = await supabase.from('players').update(row).eq('id', id);
  if (error) console.error('updatePlayer error:', error);
}

export async function deletePlayer(id: string) {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) console.error('deletePlayer error:', error);
}



export async function getPlayerById(id: string): Promise<Player | undefined> {
  const { data } = await supabase.from('players').select('id, name, nickname, avatar, xp, created_at').eq('id', id).single();
  if (!data) return undefined;
  return { id: data.id, name: data.name, nickname: data.nickname || '', avatar: data.avatar || '🔵', xp: data.xp ?? 0, createdAt: data.created_at };
}

// ──────────── Stats ────────────

export async function getAllStats(): Promise<PlayerStats[]> {
  const { data, error } = await supabase.from('player_stats').select('player_id, wins, losses, finish_wins, extreme_finish_wins, points, week_key, month_key');
  if (error) { console.error('getAllStats error:', error); return []; }
  return (data || []).map(row => ({
    playerId: row.player_id,
    wins: row.wins,
    losses: row.losses,
    finishWins: row.finish_wins,
    extremeFinishWins: row.extreme_finish_wins,
    points: row.points,
    weekKey: row.week_key,
    monthKey: row.month_key,
  }));
}

export async function saveAllStats(stats: PlayerStats[]) {
  const ligaId = await getLigaId();
  for (const s of stats) {
    const { error } = await supabase.from('player_stats').upsert({
      player_id: s.playerId,
      wins: s.wins,
      losses: s.losses,
      finish_wins: s.finishWins,
      extreme_finish_wins: s.extremeFinishWins,
      points: s.points,
      week_key: s.weekKey,
      month_key: s.monthKey,
      liga_id: ligaId,
    });
    if (error) console.error('saveAllStats error:', error);
  }
}

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

export async function awardXP(standings: TournamentStanding[]) {
  const ligaId = await getLigaId();
  const players = await getPlayers();
  for (const s of standings) {
    const p = players.find(pl => pl.id === s.playerId);
    if (p) {
      p.xp = (p.xp || 0) + s.xpAwarded;
      await supabase.from('players').update({ xp: p.xp }).eq('id', p.id);
    }
  }

  const now = new Date();
  const { weekKey, monthKey } = getTimeKeys(now);
  for (const s of standings) {
    const { data: existing } = await supabase
      .from('player_stats')
      .select('id, points, wins, losses')
      .eq('player_id', s.playerId)
      .eq('week_key', weekKey)
      .maybeSingle();

    if (existing) {
      await supabase.from('player_stats').update({
        points: existing.points + s.rankingPoints,
        wins: existing.wins + s.wins,
        losses: existing.losses + s.losses,
      }).eq('id', existing.id);
    } else {
      await supabase.from('player_stats').insert({
        player_id: s.playerId,
        wins: s.wins,
        losses: s.losses,
        finish_wins: 0,
        extreme_finish_wins: 0,
        points: s.rankingPoints,
        week_key: weekKey,
        month_key: monthKey,
        liga_id: ligaId,
      });
    }
  }
}

// ──────────── Tournaments ────────────

function tournamentFromRow(row: any): Tournament {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    registrationDeadline: row.signup_deadline || '',
    playerIds: row.player_ids || [],
    rounds: (row.rounds as any[]) || [],
    currentRound: row.current_round ?? 0,
    arenaCount: row.arena_count ?? 1,
    totalRounds: row.total_rounds ?? 3,
    pointsToWin: row.points_to_win ?? 4,
    status: row.status as Tournament['status'],
    createdAt: row.created_at,
    finalStandings: row.final_standings as TournamentStanding[] | undefined,
    maxPlayers: row.max_players ?? undefined,
  };
}

function tournamentToRow(t: Tournament, ligaId: string) {
  return {
    id: t.id,
    name: t.name,
    date: t.date,
    signup_deadline: t.registrationDeadline || '',
    player_ids: t.playerIds,
    rounds: t.rounds as any,
    current_round: t.currentRound,
    arena_count: t.arenaCount,
    total_rounds: t.totalRounds,
    points_to_win: t.pointsToWin,
    status: t.status,
    created_at: t.createdAt,
    final_standings: t.finalStandings as any,
    max_players: t.maxPlayers ?? null,
    liga_id: ligaId,
  };
}

export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase.from('tournaments').select('id, name, date, signup_deadline, player_ids, rounds, current_round, arena_count, total_rounds, points_to_win, status, created_at, final_standings, max_players').order('created_at', { ascending: false });
  if (error) { console.error('getTournaments error:', error); return []; }
  return (data || []).map(tournamentFromRow);
}

export async function saveTournaments(tournaments: Tournament[]) {
  const ligaId = await getLigaId();
  const rows = tournaments.map(t => tournamentToRow(t, ligaId));
  const { error } = await supabase.from('tournaments').upsert(rows, { onConflict: 'id' });
  if (error) console.error('saveTournaments error:', error);
}

export async function getActiveTournament(): Promise<Tournament | null> {
  const { data } = await supabase.from('tournaments').select('id, name, date, signup_deadline, player_ids, rounds, current_round, arena_count, total_rounds, points_to_win, status, created_at, final_standings, max_players').eq('status', 'active').limit(1).maybeSingle();
  return data ? tournamentFromRow(data) : null;
}

export async function saveActiveTournament(t: Tournament | null) {
  if (!t) return;
  const ligaId = await getLigaId();
  const { error } = await supabase.from('tournaments').upsert(tournamentToRow(t, ligaId), { onConflict: 'id' });
  if (error) console.error('saveActiveTournament error:', error);
}

export async function getCompletedTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase.from('tournaments').select('id, name, date, signup_deadline, player_ids, rounds, current_round, arena_count, total_rounds, points_to_win, status, created_at, final_standings, max_players').eq('status', 'completed').order('created_at', { ascending: false });
  if (error) { console.error('getCompletedTournaments error:', error); return []; }
  return (data || []).map(tournamentFromRow);
}

export async function saveCompletedTournament(t: Tournament) {
  const ligaId = await getLigaId();
  const { error } = await supabase.from('tournaments').upsert(tournamentToRow(t, ligaId), { onConflict: 'id' });
  if (error) console.error('saveCompletedTournament error:', error);
}

export function calculateStandings(tournament: Tournament): TournamentStanding[] {
  const winsMap = new Map<string, number>();
  const lossesMap = new Map<string, number>();
  const droppedSet = new Set(tournament.droppedPlayerIds || []);
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

  for (const round of (tournament.eliminationRounds || [])) {
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
    .map(pid => ({
      playerId: pid,
      wins: winsMap.get(pid) || 0,
      losses: lossesMap.get(pid) || 0,
      dropped: droppedSet.has(pid),
    }))
    .sort((a, b) => {
      if (a.dropped !== b.dropped) return a.dropped ? 1 : -1;
      return b.wins - a.wins || a.losses - b.losses;
    });

  return sorted.map((entry, i) => ({
    playerId: entry.playerId,
    wins: entry.wins,
    losses: entry.losses,
    placement: i + 1,
    xpAwarded: entry.dropped ? 0 : (PLACEMENT_XP[i + 1] ?? PLACEMENT_XP_DEFAULT),
    rankingPoints: getRankingPoints(i + 1, entry.dropped),
    dropped: entry.dropped,
  }));
}

// ──────────── Leaderboard ────────────

export async function getWeeklyLeaderboard() {
  const now = new Date();
  const { weekKey } = getTimeKeys(now);
  return aggregateStats(s => s.weekKey === weekKey);
}

export async function getMonthlyLeaderboard() {
  const now = new Date();
  const { monthKey } = getTimeKeys(now);
  return aggregateStats(s => s.monthKey === monthKey);
}

async function aggregateStats(filter: (s: PlayerStats) => boolean) {
  const all = (await getAllStats()).filter(filter);
  const map = new Map<string, { points: number; wins: number; losses: number }>();
  for (const s of all) {
    const cur = map.get(s.playerId) || { points: 0, wins: 0, losses: 0 };
    cur.points += s.points; cur.wins += s.wins; cur.losses += s.losses;
    map.set(s.playerId, cur);
  }
  return Array.from(map.entries()).map(([playerId, data]) => ({ playerId, ...data })).sort((a, b) => b.points - a.points);
}

export async function createUpcomingTournament(t: Tournament) {
  const ligaId = await getLigaId();
  const { error } = await supabase.from('tournaments').insert(tournamentToRow(t, ligaId));
  if (error) console.error('createUpcomingTournament error:', error);
}

export async function registerPlayerToTournament(tournamentId: string, playerId: string) {
  const { data } = await supabase.from('tournaments').select('player_ids').eq('id', tournamentId).single();
  if (!data) return;
  const playerIds = data.player_ids || [];
  if (!playerIds.includes(playerId)) {
    playerIds.push(playerId);
    await supabase.from('tournaments').update({ player_ids: playerIds }).eq('id', tournamentId);
  }
}

export async function deleteTournament(id: string) {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) console.error('deleteTournament error:', error);
}
