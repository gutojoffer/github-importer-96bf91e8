import { supabase } from '@/integrations/supabase/client';
import { Player, PlayerStats, Tournament, TournamentStanding, getRankingPoints, getTournamentXP } from '@/types/tournament';
import { enviarNotificacoesTorneioPublicado } from '@/lib/notificacoes';
import { cacheMemory, invalidate } from '@/lib/cache';

async function getLigaId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ──────────── Players ────────────

export async function getPlayers(): Promise<Player[]> {
  let ligaId: string | null = null;
  try { ligaId = await getLigaId(); } catch { /* anon */ }
  return cacheMemory(`players:${ligaId || 'anon'}`, 30_000, () => fetchPlayers(ligaId));
}

async function fetchPlayers(ligaId: string | null): Promise<Player[]> {

  const playersQuery = ligaId
    ? supabase.from('players').select('id, name, nickname, avatar, xp, created_at').eq('liga_id', ligaId).order('created_at', { ascending: true })
    : supabase.from('players').select('id, name, nickname, avatar, xp, created_at').order('created_at', { ascending: true }).limit(500);

  const [playersRes, profilesRes, tempRes] = await Promise.all([
    playersQuery,
    supabase.from('profiles').select('id, nome_blader, avatar_blader_url, xp_total').eq('tem_perfil_blader', true).not('nome_blader', 'is', null).limit(1000),
    ligaId
      ? supabase.from('bladers_temp').select('id, nome, apelido, avatar_url, created_at, vinculado_a').eq('organizador_id', ligaId)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  if (playersRes.error) console.error('getPlayers error:', playersRes.error);

  const profileById = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));
  const byId = new Map<string, Player>();

  for (const row of playersRes.data || []) {
    const prof = profileById.get(row.id);
    byId.set(row.id, {
      id: row.id,
      name: prof?.nome_blader || row.name,
      nickname: row.nickname || '',
      avatar: prof?.avatar_blader_url || row.avatar || '🔵',
      xp: prof?.xp_total ?? row.xp ?? 0,
      createdAt: row.created_at,
    });
  }

  // Union profile-bladers not present in players table (self-registered)
  for (const prof of profilesRes.data || []) {
    if (byId.has(prof.id)) continue;
    byId.set(prof.id, {
      id: prof.id,
      name: prof.nome_blader,
      nickname: '',
      avatar: prof.avatar_blader_url || '🔵',
      xp: prof.xp_total ?? 0,
      createdAt: new Date().toISOString(),
    });
  }

  // Union temp bladers (still unlinked) from this organizer
  for (const t of (tempRes as any).data || []) {
    if (t.vinculado_a) continue;
    if (byId.has(t.id)) continue;
    byId.set(t.id, {
      id: t.id,
      name: t.nome || t.apelido || 'Blader',
      nickname: t.apelido || '',
      avatar: t.avatar_url || '🔵',
      xp: 0,
      createdAt: t.created_at || new Date().toISOString(),
    });
  }

  return Array.from(byId.values());
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
  invalidate('players:');
  invalidate('player:');
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
  invalidate('players:');
}

export async function updatePlayer(id: string, patch: Partial<Player>) {
  const row: { name?: string; nickname?: string; avatar?: string; xp?: number } = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.nickname !== undefined) row.nickname = patch.nickname;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.xp !== undefined) row.xp = patch.xp;
  const { error } = await supabase.from('players').update(row).eq('id', id);
  if (error) console.error('updatePlayer error:', error);
  invalidate('players:');
  invalidate(`player:${id}`);
}

export async function deletePlayer(id: string) {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) console.error('deletePlayer error:', error);
  invalidate('players:');
  invalidate(`player:${id}`);
}



export async function getPlayerById(id: string): Promise<Player | undefined> {
  return cacheMemory(`player:${id}`, 30_000, async () => {
    const [playerRes, profRes, tempRes] = await Promise.all([
      supabase.from('players').select('id, name, nickname, avatar, xp, created_at').eq('id', id).maybeSingle(),
      supabase.from('profiles').select('id, nome_blader, avatar_blader_url, xp_total').eq('id', id).maybeSingle(),
      supabase.from('bladers_temp').select('id, nome, apelido, avatar_url, created_at').eq('id', id).maybeSingle(),
    ]);
    const p = playerRes.data;
    const prof = profRes.data;
    const t = tempRes.data;
    if (!p && !prof && !t) return undefined as any;
    return {
      id,
      name: prof?.nome_blader || p?.name || t?.nome || t?.apelido || 'Blader',
      nickname: p?.nickname || t?.apelido || '',
      avatar: prof?.avatar_blader_url || p?.avatar || t?.avatar_url || '🔵',
      xp: prof?.xp_total ?? p?.xp ?? 0,
      createdAt: p?.created_at || t?.created_at || new Date().toISOString(),
    };
  });
}

// ──────────── Stats ────────────

export async function getAllStats(): Promise<PlayerStats[]> {
  return cacheMemory('player_stats:all', 60_000, async () => {
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
  });
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

  // Batch XP updates in parallel
  const xpUpdates = standings
    .map(s => {
      const p = players.find(pl => pl.id === s.playerId);
      if (!p) return null;
      p.xp = (p.xp || 0) + s.xpAwarded;
      return supabase.from('players').update({ xp: p.xp }).eq('id', p.id).then();
    })
    .filter(Boolean);
  await Promise.all(xpUpdates);

  // Batch stats: fetch all existing stats in one query
  const now = new Date();
  const { weekKey, monthKey } = getTimeKeys(now);
  const playerIds = standings.map(s => s.playerId);

  const { data: existingStats } = await supabase
    .from('player_stats')
    .select('id, player_id, points, wins, losses')
    .in('player_id', playerIds)
    .eq('week_key', weekKey);

  const existingMap = new Map((existingStats || []).map(s => [s.player_id, s]));

  const updates: PromiseLike<any>[] = [];
  const inserts: any[] = [];

  for (const s of standings) {
    const existing = existingMap.get(s.playerId);
    if (existing) {
      updates.push(
        supabase.from('player_stats').update({
          points: existing.points + s.rankingPoints,
          wins: existing.wins + s.wins,
          losses: existing.losses + s.losses,
        }).eq('id', existing.id).then()
      );
    } else {
      inserts.push({
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

  const ops: PromiseLike<any>[] = [...updates];
  if (inserts.length) ops.push(supabase.from('player_stats').insert(inserts));
  await Promise.all(ops);
  invalidate('player_stats:');
  invalidate('players:');
}

export async function applyTournamentResults(tournamentId: string, standings: TournamentStanding[]) {
  const { error } = await (supabase as any).rpc('apply_tournament_results', {
    _torneio_id: tournamentId,
    _standings: standings,
  });
  if (error) {
    console.error('applyTournamentResults error:', error);
    throw error;
  }
}

// ──────────── Tournaments ────────────

function tournamentFromRow(row: any): Tournament {
  const inscricaoIds = Array.isArray(row.inscricoes)
    ? row.inscricoes.map((i: any) => i.blader_id || i.blader_temp_id).filter(Boolean)
    : [];
  const playerIds = Array.from(new Set([...(row.player_ids || []), ...inscricaoIds]));
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    registrationDeadline: row.signup_deadline || '',
    playerIds,
    rounds: (row.rounds as any[]) || [],
    currentRound: row.current_round ?? 0,
    arenaCount: row.arena_count ?? 1,
    totalRounds: row.total_rounds ?? 3,
    pointsToWin: row.points_to_win ?? 4,
    status: row.status as Tournament['status'],
    createdAt: row.created_at,
    finalStandings: row.final_standings as TournamentStanding[] | undefined,
    maxPlayers: row.max_players ?? undefined,
    localNome: row.local_nome ?? undefined,
    localEndereco: row.local_endereco ?? undefined,
    localCidade: row.local_cidade ?? undefined,
    localEstado: row.local_estado ?? undefined,
    horarioInicio: row.horario_inicio ?? undefined,
    horarioFim: row.horario_fim ?? undefined,
    descricao: row.descricao ?? undefined,
    imagemUrl: row.imagem_url ?? undefined,
    premio: row.premio ?? undefined,
    regras: row.regras ?? undefined,
    ligaId: row.liga_id ?? undefined,
    enrolledCount: playerIds.length,
    modalidade: (row.modalidade as 'individual' | 'times') ?? 'individual',
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
    local_nome: t.localNome ?? null,
    local_endereco: t.localEndereco ?? null,
    local_cidade: t.localCidade ?? null,
    local_estado: t.localEstado ?? null,
    horario_inicio: t.horarioInicio ?? null,
    horario_fim: t.horarioFim ?? null,
    descricao: t.descricao ?? null,
    imagem_url: t.imagemUrl ?? null,
    premio: t.premio ?? null,
    regras: t.regras ?? null,
    modalidade: t.modalidade ?? 'individual',
  };
}

export async function getTournaments(): Promise<Tournament[]> {
  const ligaId = await getLigaId();
  // Selecionar apenas colunas necessarias e filtrar pela liga do organizador
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, date, signup_deadline, player_ids, rounds, current_round, arena_count, total_rounds, points_to_win, status, created_at, final_standings, max_players, liga_id, local_nome, local_endereco, local_cidade, local_estado, horario_inicio, horario_fim, descricao, imagem_url, premio, regras, modalidade, inscricoes(blader_id, blader_temp_id)')
    .eq('liga_id', ligaId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getTournaments error:', error); return []; }
  return (data || []).map(tournamentFromRow);
}

export async function getTournamentParticipants(tournamentId: string): Promise<Player[]> {
  const { data: inscricoes, error } = await supabase
    .from('inscricoes')
    .select('blader_id, blader_temp_id, inscrito_em')
    .eq('torneio_id', tournamentId)
    .eq('status', 'confirmado')
    .order('inscrito_em', { ascending: true });

  if (error) { console.error('getTournamentParticipants error:', error); return []; }

  const profileIds = (inscricoes || []).map(row => row.blader_id).filter(Boolean) as string[];
  const tempIds = (inscricoes || []).map(row => row.blader_temp_id).filter(Boolean) as string[];
  const [profilesRes, tempRes] = await Promise.all([
    profileIds.length
      ? supabase.from('profiles').select('id, nome_blader, avatar_blader_url').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    tempIds.length
      ? supabase.from('bladers_temp').select('id, nome, apelido, avatar_url').in('id', tempIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profilesById = new Map((profilesRes.data || []).map(row => [row.id, row]));
  const tempById = new Map((tempRes.data || []).map(row => [row.id, row]));

  const participants = new Map<string, Player>();
  for (const row of inscricoes || []) {
    const id = row.blader_id || row.blader_temp_id;
    if (!id || participants.has(id)) continue;
    const profile = row.blader_id ? profilesById.get(row.blader_id) : null;
    const temp = row.blader_temp_id ? tempById.get(row.blader_temp_id) : null;
    const name = profile?.nome_blader || temp?.nome || temp?.apelido || 'Blader';
    participants.set(id, {
      id,
      name,
      nickname: temp?.apelido || '',
      avatar: profile?.avatar_blader_url || temp?.avatar_url || '🔵',
      xp: 0,
      createdAt: row.inscrito_em || new Date().toISOString(),
    });
  }
  return Array.from(participants.values());
}

export async function saveTournaments(tournaments: Tournament[]) {
  const ligaId = await getLigaId();
  const rows = tournaments.map(t => tournamentToRow(t, ligaId));
  const { error } = await supabase.from('tournaments').upsert(rows, { onConflict: 'id' });
  if (error) console.error('saveTournaments error:', error);
}

export async function getActiveTournament(): Promise<Tournament | null> {
  const { data } = await supabase.from('tournaments').select('*').eq('status', 'active').limit(1).maybeSingle();
  return data ? tournamentFromRow(data) : null;
}

export async function saveActiveTournament(t: Tournament | null) {
  if (!t) return;
  const ligaId = await getLigaId();
  const { error } = await supabase.from('tournaments').upsert(tournamentToRow(t, ligaId), { onConflict: 'id' });
  if (error) console.error('saveActiveTournament error:', error);
}

export async function getCompletedTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase.from('tournaments').select('*').eq('status', 'completed').order('created_at', { ascending: false });
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
  const pointsMap = new Map<string, number>();
  const streakMap = new Map<string, number>();
  const maxStreakMap = new Map<string, number>();
  const droppedSet = new Set(tournament.droppedPlayerIds || []);
  for (const pid of tournament.playerIds) { winsMap.set(pid, 0); lossesMap.set(pid, 0); pointsMap.set(pid, 0); streakMap.set(pid, 0); maxStreakMap.set(pid, 0); }

  const processRounds = (rounds: typeof tournament.rounds) => {
    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.isBye) { winsMap.set(match.player1Id, (winsMap.get(match.player1Id) || 0) + 1); continue; }
        // Accumulate points
        pointsMap.set(match.player1Id, (pointsMap.get(match.player1Id) || 0) + (match.player1Points || 0));
        pointsMap.set(match.player2Id, (pointsMap.get(match.player2Id) || 0) + (match.player2Points || 0));
        if (match.result) {
          const winnerId = match.result.winnerId;
          const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
          winsMap.set(winnerId, (winsMap.get(winnerId) || 0) + 1);
          lossesMap.set(loserId, (lossesMap.get(loserId) || 0) + 1);
          const winnerStreak = (streakMap.get(winnerId) || 0) + 1;
          streakMap.set(winnerId, winnerStreak);
          maxStreakMap.set(winnerId, Math.max(maxStreakMap.get(winnerId) || 0, winnerStreak));
          streakMap.set(loserId, 0);
        }
      }
    }
  };

  processRounds(tournament.rounds);
  processRounds(tournament.eliminationRounds || []);

  const sorted = tournament.playerIds
    .map(pid => ({
      playerId: pid,
      wins: winsMap.get(pid) || 0,
      losses: lossesMap.get(pid) || 0,
      totalPoints: pointsMap.get(pid) || 0,
      dropped: droppedSet.has(pid),
    }))
    .sort((a, b) => {
      if (a.dropped !== b.dropped) return a.dropped ? 1 : -1;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalPoints - a.totalPoints; // Tiebreak by total points
    });

  return sorted.map((entry, i) => ({
    playerId: entry.playerId,
    wins: entry.wins,
    losses: entry.losses,
    placement: i + 1,
    xpAwarded: getTournamentXP(i + 1, entry.wins, entry.dropped),
    rankingPoints: getRankingPoints(i + 1, entry.dropped),
    streakMax: maxStreakMap.get(entry.playerId) || 0,
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
  if (error) {
    console.error('createUpcomingTournament error:', error);
    return;
  }
  // Notificar todos os bladers sobre o novo torneio publicado
  enviarNotificacoesTorneioPublicado({
    id: t.id,
    name: t.name,
    horario_inicio: (t as any).horario_inicio ?? (t as any).date ?? null,
    local_cidade: (t as any).local_cidade ?? null,
    local_estado: (t as any).local_estado ?? null,
    local_nome: (t as any).local_nome ?? null,
  }).catch(() => {});
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
