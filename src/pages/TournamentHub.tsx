import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tournament, Player, FinishType, FINISH_POINTS, DEFAULT_AVATARS, ScoreAction, EliminationSize } from '@/types/tournament';
import { suggestRounds, generateFirstRound, generateSwissRound, getSwissStandings, generateEliminationBracket, generateNextEliminationRound } from '@/lib/matchmaking';
import { getTournamentParticipants, saveActiveTournament, saveTournaments } from '@/lib/storage';
import { getPlayerStreak } from '@/lib/streak';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import PlayerCard from '@/components/PlayerCard';
import VersusScreen from '@/components/VersusScreen';
import ResultButtons from '@/components/ResultButtons';
import ByeBanner from '@/components/ByeBanner';
import TournamentHUD from '@/components/TournamentHUD';
import VictorySplash from '@/components/VictorySplash';
import ConfirmDialog from '@/components/ConfirmDialog';
import ConfirmResultModal from '@/components/ConfirmResultModal';
import CorrectResultModal from '@/components/CorrectResultModal';
import BracketTree from '@/components/BracketTree';
import EliminationBracket from '@/components/EliminationBracket';
import EliminationTransition from '@/components/EliminationTransition';
import FinishOverlay from '@/components/FinishOverlay';
import LigaLogo from '@/components/LigaLogo';
import EloBadge from '@/components/EloBadge';
import BladerTournamentModal from '@/components/blader/BladerTournamentModal';
import EnrollBladersModal from '@/components/EnrollBladersModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus, Play, Lightbulb, Calendar, Users, Trophy, XOctagon, Award,
  CheckCircle, Camera, UserPlus, X, Search, Check, Trash2, UserMinus, Undo2, Ban, Swords, Pencil, Clock, History,
} from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'active';

export default function TournamentHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const players = usePlayerStore(s => s.players);
  const loadPlayers = usePlayerStore(s => s.load);
  const addPlayerToStore = usePlayerStore(s => s.add);

  const {
    tournaments, activeTournament, load: loadTournaments,
    createTournament, deleteTournament: deleteTournamentStore,
    setActiveTournament, updateActive, endTournament, cancelTournament: cancelTournamentStore,
    enrollPlayer, unenrollPlayer, updateTournament, refreshList,
  } = useTournamentStore();

  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const upcomingTournaments = useMemo(() => tournaments.filter(t => t.status === 'upcoming'), [tournaments]);
  const completedTournaments = useMemo(() => tournaments.filter(t => t.status === 'completed'), [tournaments]);
  const listStats = useMemo(() => ({
    upcoming: upcomingTournaments.length,
    active: tournaments.filter(t => t.status === 'active').length,
    completed: completedTournaments.length,
    totalPlayers: new Set(tournaments.flatMap(t => t.playerIds)).size,
  }), [tournaments, upcomingTournaments, completedTournaments]);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [tName, setTName] = useState('');
  const [tDate, setTDate] = useState('');
  const [tMaxPlayers, setTMaxPlayers] = useState(32);
  const [tEliminationSize, setTEliminationSize] = useState<EliminationSize>(null);
  const [tDescricao, setTDescricao] = useState('');
  const [tHorarioInicio, setTHorarioInicio] = useState('');
  const [tHorarioFim, setTHorarioFim] = useState('');
  const [tLocalNome, setTLocalNome] = useState('');
  const [tLocalEndereco, setTLocalEndereco] = useState('');
  const [tLocalCidade, setTLocalCidade] = useState('');
  const [tLocalEstado, setTLocalEstado] = useState('');
  const [tPremio, setTPremio] = useState('');
  const [tRegras, setTRegras] = useState('');
  const [tArenaCount, setTArenaCount] = useState(1);
  const [tModalidade, setTModalidade] = useState<'individual' | 'times'>('individual');

  // Edit tournament
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [detailsTournament, setDetailsTournament] = useState<Tournament | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editMaxPlayers, setEditMaxPlayers] = useState(32);
  const [editEliminationSize, setEditEliminationSize] = useState<EliminationSize>(null);

  // Enroll modal state
  const [enrollTournament, setEnrollTournament] = useState<Tournament | null>(null);

  // Start config
  const [startingTournament, setStartingTournament] = useState<Tournament | null>(null);
  const [arenaCount, setArenaCount] = useState(2);
  const [rounds, setRounds] = useState(3);
  const [pointsToWin, setPointsToWin] = useState(4);
  const [startEliminationSize, setStartEliminationSize] = useState<EliminationSize>(null);

  // Match state
  const [victoryWinner, setVictoryWinner] = useState<Player | null>(null);
  const [victoryFinish, setVictoryFinish] = useState<string | undefined>();
  const [vsKey, setVsKey] = useState(0);
  const [finishOverlay, setFinishOverlay] = useState<FinishType | null>(null);
  const [selectedArena, setSelectedArena] = useState(0);

  // Elimination transition
  const [showEliminationTransition, setShowEliminationTransition] = useState(false);

  // Pending result confirmation
  const [pendingResult, setPendingResult] = useState<{
    matchId: string; winnerId: string; finishType: FinishType; isElimination: boolean;
    tournament: Tournament; p1Points: number; p2Points: number;
    player1Id: string; player2Id: string;
  } | null>(null);

  // Correction modal
  const [showCorrectModal, setShowCorrectModal] = useState(false);

  // Confirmations
  const [confirmEndTournament, setConfirmEndTournament] = useState(false);
  const [confirmCancelTournament, setConfirmCancelTournament] = useState(false);
  const [confirmDeleteTournament, setConfirmDeleteTournament] = useState<string | null>(null);
  const [confirmRemovePlayer, setConfirmRemovePlayer] = useState<string | null>(null);
  const [confirmDropPlayer, setConfirmDropPlayer] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
    loadTournaments().then(() => {
      const store = useTournamentStore.getState();
      if (store.activeTournament) {
        setView('active');
        getTournamentParticipants(store.activeTournament.id).then(participants => {
          if (participants.length === 0) return;
          const ids = participants.map(p => p.id);
          usePlayerStore.setState(s => ({ players: [...s.players.filter(p => !ids.includes(p.id)), ...participants], loaded: true }));
        });
      }
    });
  }, []);

  const getPlayer = useCallback((id: string) => players.find(p => p.id === id), [players]);
  const toModalTournament = useCallback((t: Tournament) => ({
    id: t.id,
    name: t.name,
    date: t.date,
    status: t.status,
    liga_id: t.ligaId || null,
    player_ids: t.playerIds,
    max_players: t.maxPlayers || null,
    local_nome: t.localNome || null,
    local_endereco: t.localEndereco || null,
    local_cidade: t.localCidade || null,
    local_estado: t.localEstado || null,
    horario_inicio: t.horarioInicio || null,
    horario_fim: t.horarioFim || null,
    descricao: t.descricao || null,
    imagem_url: t.imagemUrl || null,
    premio: t.premio || null,
    regras: t.regras || null,
    arena_count: t.arenaCount,
  }), []);
  const suggested = startingTournament ? suggestRounds(startingTournament.playerIds.length) : 3;

  // (enrollModalTournament removed — handled inside BladerTournamentModal)

  // ─── Create Tournament ───
  const handleCreate = useCallback(() => {
    if (!tName.trim() || (!tDate && !tHorarioInicio)) { toast.error('Preencha nome e data!'); return; }
    const dateVal = tDate || (tHorarioInicio ? tHorarioInicio.split('T')[0] : '');
    const t: Tournament = {
      id: crypto.randomUUID(), name: tName.trim(), date: dateVal,
      registrationDeadline: dateVal, playerIds: [], rounds: [],
      currentRound: 0, arenaCount: tArenaCount, totalRounds: 3, pointsToWin: 4,
      status: 'upcoming', createdAt: new Date().toISOString(), maxPlayers: tMaxPlayers,
      eliminationSize: tEliminationSize,
      descricao: tDescricao.trim() || undefined,
      horarioInicio: tHorarioInicio || undefined,
      horarioFim: tHorarioFim || undefined,
      localNome: tLocalNome.trim() || undefined,
      localEndereco: tLocalEndereco.trim() || undefined,
      localCidade: tLocalCidade.trim() || undefined,
      localEstado: tLocalEstado || undefined,
      premio: tPremio.trim() || undefined,
      regras: tRegras.trim() || undefined,
    };
    createTournament(t);
    setShowCreate(false);
    setTName(''); setTDate(''); setTEliminationSize(null);
    setTDescricao(''); setTHorarioInicio(''); setTHorarioFim('');
    setTLocalNome(''); setTLocalEndereco(''); setTLocalCidade(''); setTLocalEstado('');
    setTPremio(''); setTRegras(''); setTArenaCount(1);
    toast.success('Torneio criado!');
  }, [tName, tDate, tMaxPlayers, tEliminationSize, tArenaCount, tDescricao, tHorarioInicio, tHorarioFim, tLocalNome, tLocalEndereco, tLocalCidade, tLocalEstado, tPremio, tRegras, createTournament]);

  // ─── Edit Tournament ───
  const openEditModal = useCallback((t: Tournament) => {
    setEditingTournament(t);
    setEditName(t.name);
    setEditDate(t.date);
    setEditMaxPlayers(t.maxPlayers || 32);
    setEditEliminationSize(t.eliminationSize || null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTournament) return;
    if (!editName.trim() || !editDate) { toast.error('Preencha nome e data!'); return; }
    updateTournament(editingTournament.id, {
      name: editName.trim(),
      date: editDate,
      maxPlayers: editMaxPlayers,
      eliminationSize: editEliminationSize,
    });
    setEditingTournament(null);
    toast.success('Torneio atualizado!');
  }, [editingTournament, editName, editDate, editMaxPlayers, editEliminationSize, updateTournament]);

  // Enrollment / quick-add are handled inside BladerTournamentModal (organizer mode).

  // ─── Start Tournament ───
  const handleStartTournament = useCallback(async () => {
    if (!startingTournament) return;
    const t = tournaments.find(tr => tr.id === startingTournament.id) || startingTournament;
    const participants = await getTournamentParticipants(t.id);
    const participantIds = participants.length >= 2 ? participants.map(p => p.id) : t.playerIds;
    if (participantIds.length < 2) { toast.error('Mínimo 2 jogadores inscritos!'); return; }
    if (participants.length > 0) {
      usePlayerStore.setState({ players: [...players.filter(p => !participantIds.includes(p.id)), ...participants], loaded: true });
    }
    const firstRound = generateFirstRound(participantIds, arenaCount);
    const active: Tournament = {
      ...t, playerIds: participantIds, status: 'active', arenaCount, totalRounds: rounds,
      pointsToWin, rounds: [firstRound], currentRound: 0,
      eliminationSize: startEliminationSize || t.eliminationSize,
      phase: 'swiss',
    };
    // Update in place (do NOT delete + recreate — that races with the upsert
    // and can leave the tournament missing or orphan inscricoes).
    setActiveTournament(active);
    setStartingTournament(null);
    setView('active');
    toast.success('🌀 Torneio iniciado! Let it rip!');
  }, [startingTournament, arenaCount, rounds, pointsToWin, startEliminationSize, tournaments, setActiveTournament, players]);

  // ─── Match Scoring (OPTIMISTIC) ───
  const handleScorePoint = useCallback((matchId: string, winnerId: string, finishType: FinishType, isElimination = false) => {
    if (!activeTournament) return;
    const t: Tournament = {
      ...activeTournament,
      rounds: activeTournament.rounds.map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) })),
      eliminationRounds: (activeTournament.eliminationRounds || []).map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) })),
    };

    const roundsArray = isElimination ? t.eliminationRounds! : t.rounds;
    const currentRoundIdx = isElimination ? (t.currentEliminationRound || 0) : t.currentRound;
    const currentRound = roundsArray[currentRoundIdx];
    if (!currentRound) return;

    const matchIdx = currentRound.matches.findIndex(m => m.id === matchId);
    if (matchIdx === -1) return;
    const match = currentRound.matches[matchIdx];
    const pts = FINISH_POINTS[finishType];

    // Trigger finish overlay
    setFinishOverlay(finishType);

    const action: ScoreAction = {
      id: crypto.randomUUID(), playerId: winnerId, finishType, points: pts,
      timestamp: new Date().toISOString(),
    };
    match.scoreLog = [...(match.scoreLog || []), action];

    if (winnerId === match.player1Id) match.player1Points += pts;
    else match.player2Points += pts;

    const ptw = t.pointsToWin;
    if (match.player1Points >= ptw || match.player2Points >= ptw) {
      // Show confirmation modal instead of auto-registering
      updateActive(t); // Save points first
      setPendingResult({
        matchId, winnerId, finishType, isElimination, tournament: t,
        p1Points: match.player1Points, p2Points: match.player2Points,
        player1Id: match.player1Id, player2Id: match.player2Id,
      });
      return;
    }

    updateActive(t);
  }, [activeTournament, updateActive]);

  // ─── Confirm match result ───
  const handleConfirmResult = useCallback(() => {
    if (!pendingResult) return;
    const t: Tournament = {
      ...pendingResult.tournament,
      rounds: pendingResult.tournament.rounds.map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) })),
      eliminationRounds: (pendingResult.tournament.eliminationRounds || []).map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) })),
    };

    const roundsArray = pendingResult.isElimination ? t.eliminationRounds! : t.rounds;
    const currentRoundIdx = pendingResult.isElimination ? (t.currentEliminationRound || 0) : t.currentRound;
    const currentRound = roundsArray[currentRoundIdx];
    if (!currentRound) { setPendingResult(null); return; }

    const match = currentRound.matches.find(m => m.id === pendingResult.matchId);
    if (!match) { setPendingResult(null); return; }

    const matchWinnerId = match.player1Points >= t.pointsToWin ? match.player1Id : match.player2Id;
    match.result = { winnerId: matchWinnerId, finishType: pendingResult.finishType };
    match.matchStatus = 'completed';

    // All matches are active simultaneously — no queue promotion needed
    const winner = getPlayer(matchWinnerId);
    if (winner) { setVictoryWinner(winner); setVictoryFinish(pendingResult.finishType); }
    setTimeout(() => { setVictoryWinner(null); setVictoryFinish(undefined); setVsKey(k => k + 1); }, 3500);

    const allDone = currentRound.matches.every(m => m.result);
    if (allDone) {
      currentRound.completed = true;

      if (pendingResult.isElimination) {
        const totalElimRounds = Math.ceil(Math.log2(t.eliminationPlayerIds?.length || 2));
        const nextElimRound = generateNextEliminationRound(currentRound, currentRoundIdx + 1, t.arenaCount, totalElimRounds);
        if (nextElimRound && nextElimRound.matches.filter(m => !m.isBye).length > 0) {
          t.eliminationRounds!.push(nextElimRound);
          t.currentEliminationRound = currentRoundIdx + 1;
          toast.success(`${nextElimRound.label || 'Próxima fase'} gerada!`);
        } else {
          toast.info('🏆 CAMPEÃO DEFINIDO! Encerre o torneio.');
        }
      } else {
        if (t.currentRound + 1 < t.totalRounds) {
          const nextRound = generateSwissRound({ ...t, currentRound: t.currentRound + 1 });
          if (nextRound) {
            t.rounds.push(nextRound);
            t.currentRound++;
            toast.success(`Rodada ${t.currentRound + 1} gerada!`);
          }
        } else {
          if (t.eliminationSize) {
            toast.info(`Rodadas Swiss concluídas! Preparando TOP ${t.eliminationSize}...`);
          } else {
            toast.info('Todas as rodadas concluídas! Encerre o torneio.');
          }
        }
      }
    }

    updateActive(t);
    setPendingResult(null);
  }, [pendingResult, getPlayer, updateActive]);

  // ─── Cancel pending result (go back to editing score) ───
  const handleCancelPendingResult = useCallback(() => {
    if (!pendingResult) return;
    // Undo the last score action that triggered the confirmation
    const t: Tournament = {
      ...pendingResult.tournament,
      rounds: pendingResult.tournament.rounds.map(r => ({ ...r, matches: r.matches.map(m => ({ ...m, scoreLog: m.scoreLog ? [...m.scoreLog] : [] })) })),
      eliminationRounds: (pendingResult.tournament.eliminationRounds || []).map(r => ({ ...r, matches: r.matches.map(m => ({ ...m, scoreLog: m.scoreLog ? [...m.scoreLog] : [] })) })),
    };

    const roundsArray = pendingResult.isElimination ? t.eliminationRounds! : t.rounds;
    const currentRoundIdx = pendingResult.isElimination ? (t.currentEliminationRound || 0) : t.currentRound;
    const match = roundsArray[currentRoundIdx]?.matches.find(m => m.id === pendingResult.matchId);
    if (match && match.scoreLog && match.scoreLog.length > 0) {
      const activeLog = match.scoreLog.filter(a => !a.undone);
      if (activeLog.length > 0) {
        const lastAction = activeLog[activeLog.length - 1];
        const origIdx = match.scoreLog.findIndex(a => a.id === lastAction.id);
        if (origIdx !== -1) match.scoreLog[origIdx] = { ...match.scoreLog[origIdx], undone: true };
        if (lastAction.playerId === match.player1Id) match.player1Points -= lastAction.points;
        else match.player2Points -= lastAction.points;
        match.player1Points = Math.max(0, match.player1Points);
        match.player2Points = Math.max(0, match.player2Points);
      }
    }
    updateActive(t);
    setPendingResult(null);
  }, [pendingResult, updateActive]);

  // ─── Correct past match result ───
  const handleCorrectResult = useCallback((matchId: string, roundIndex: number, isElimination: boolean, newP1Points: number, newP2Points: number) => {
    if (!activeTournament) return;
    const t: Tournament = {
      ...activeTournament,
      rounds: activeTournament.rounds.map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) })),
      eliminationRounds: (activeTournament.eliminationRounds || []).map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) })),
    };

    const roundsArray = isElimination ? t.eliminationRounds! : t.rounds;
    const match = roundsArray[roundIndex]?.matches.find(m => m.id === matchId);
    if (!match) return;

    match.player1Points = newP1Points;
    match.player2Points = newP2Points;

    const ptw = t.pointsToWin;
    if (newP1Points >= ptw || newP2Points >= ptw) {
      const newWinnerId = newP1Points >= ptw ? match.player1Id : match.player2Id;
      match.result = { winnerId: newWinnerId, finishType: match.result?.finishType || 'spin' };
    } else {
      match.result = undefined;
    }

    // Regenerate subsequent rounds if in swiss and not last round
    if (!isElimination && roundIndex < t.rounds.length - 1) {
      // Remove all rounds after the corrected one and regenerate
      t.rounds = t.rounds.slice(0, roundIndex + 1);
      let currentIdx = roundIndex;
      while (currentIdx + 1 < t.totalRounds && t.rounds[currentIdx]?.completed) {
        const nextRound = generateSwissRound({ ...t, currentRound: currentIdx + 1 });
        if (nextRound) {
          t.rounds.push(nextRound);
          currentIdx++;
        } else break;
      }
      t.currentRound = t.rounds.length - 1;
    }

    updateActive(t);
    toast.success('Resultado corrigido. O chaveamento foi atualizado.');
  }, [activeTournament, updateActive]);

  // ─── Undo Last Point ───
  const handleUndoPoint = useCallback((matchId: string, isElimination = false) => {
    if (!activeTournament) return;
    const t: Tournament = {
      ...activeTournament,
      rounds: activeTournament.rounds.map(r => ({ ...r, matches: r.matches.map(m => ({ ...m, scoreLog: m.scoreLog ? [...m.scoreLog] : [] })) })),
      eliminationRounds: (activeTournament.eliminationRounds || []).map(r => ({ ...r, matches: r.matches.map(m => ({ ...m, scoreLog: m.scoreLog ? [...m.scoreLog] : [] })) })),
    };
    const roundsArray = isElimination ? t.eliminationRounds! : t.rounds;
    const currentRoundIdx = isElimination ? (t.currentEliminationRound || 0) : t.currentRound;
    const match = roundsArray[currentRoundIdx]?.matches.find(m => m.id === matchId);
    if (!match || !match.scoreLog || match.scoreLog.length === 0) return;

    const activeLog = match.scoreLog.filter(a => !a.undone);
    if (activeLog.length === 0) return;

    const lastAction = activeLog[activeLog.length - 1];
    const undoEntry: ScoreAction = {
      id: crypto.randomUUID(), playerId: lastAction.playerId,
      finishType: lastAction.finishType, points: -lastAction.points,
      timestamp: new Date().toISOString(), undone: true,
    };
    match.scoreLog.push(undoEntry);
    const origIdx = match.scoreLog.findIndex(a => a.id === lastAction.id);
    if (origIdx !== -1) match.scoreLog[origIdx] = { ...match.scoreLog[origIdx], undone: true };

    if (lastAction.playerId === match.player1Id) match.player1Points -= lastAction.points;
    else match.player2Points -= lastAction.points;
    match.player1Points = Math.max(0, match.player1Points);
    match.player2Points = Math.max(0, match.player2Points);

    if (match.result) match.result = undefined;

    updateActive(t);
    toast.success('↩ Último ponto removido');
  }, [activeTournament, updateActive]);

  // ─── Start Elimination Phase ───
  const handleStartElimination = useCallback(() => {
    if (!activeTournament || !activeTournament.eliminationSize) return;
    const standings = getSwissStandings(activeTournament);
    const topN = Math.min(activeTournament.eliminationSize, standings.length);
    const qualifiedIds = standings.slice(0, topN).map(s => s.playerId);

    setShowEliminationTransition(true);

    // Store qualified IDs temporarily for the transition component
    const t: Tournament = {
      ...activeTournament,
      eliminationPlayerIds: qualifiedIds,
    };
    updateActive(t);
  }, [activeTournament, updateActive]);

  const handleEliminationTransitionComplete = useCallback(() => {
    if (!activeTournament) return;
    const qualifiedIds = activeTournament.eliminationPlayerIds || [];
    const bracket = generateEliminationBracket(qualifiedIds, activeTournament.arenaCount, activeTournament.pointsToWin);

    const t: Tournament = {
      ...activeTournament,
      phase: 'elimination',
      eliminationRounds: bracket,
      currentEliminationRound: 0,
    };
    updateActive(t);
    setShowEliminationTransition(false);
    toast.success('⚔️ Fase eliminatória iniciada!');
  }, [activeTournament, updateActive]);

  // ─── End Tournament ───
  const handleEndTournament = useCallback(async () => {
    const tournamentId = activeTournament?.id;
    if (!tournamentId) return;
    const standings = await endTournament();
    if (!standings) return;
    setView('list');
    setConfirmEndTournament(false);
    toast.success('🏆 Torneio encerrado!');
    // Navigate immediately with standings data — don't wait for player reload
    navigate(`/history/${tournamentId}`, { state: { resultados: standings } });
    // Reload players in background for XP updates
    usePlayerStore.setState({ loaded: false });
    usePlayerStore.getState().load();
  }, [endTournament, navigate, activeTournament?.id]);

  // ─── Cancel Tournament ───
  const handleCancelTournament = useCallback(() => {
    cancelTournamentStore();
    setView('list');
    setConfirmCancelTournament(false);
    toast.success('Torneio cancelado.');
  }, [cancelTournamentStore]);

  // ─── Delete upcoming tournament ───
  const handleDeleteTournament = useCallback(() => {
    if (!confirmDeleteTournament) return;
    deleteTournamentStore(confirmDeleteTournament);
    setConfirmDeleteTournament(null);
    toast.success('Torneio excluído.');
  }, [confirmDeleteTournament, deleteTournamentStore]);

  // ─── Remove player from active tournament ───
  const handleRemovePlayer = useCallback(() => {
    if (!activeTournament || !confirmRemovePlayer) return;
    const t = { ...activeTournament, playerIds: activeTournament.playerIds.filter(id => id !== confirmRemovePlayer) };
    updateActive(t);
    setConfirmRemovePlayer(null);
    toast.success('Jogador removido (desistência).');
  }, [activeTournament, confirmRemovePlayer, updateActive]);

  // ─── Drop Player (W/O) ───
  const handleDropPlayer = useCallback(() => {
    if (!activeTournament || !confirmDropPlayer) return;
    const droppedId = confirmDropPlayer;
    const t: Tournament = {
      ...activeTournament,
      droppedPlayerIds: [...(activeTournament.droppedPlayerIds || []), droppedId],
      rounds: activeTournament.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => ({ ...m })),
      })),
      eliminationRounds: (activeTournament.eliminationRounds || []).map(r => ({
        ...r,
        matches: r.matches.map(m => ({ ...m })),
      })),
    };

    // Handle current and future matches in both swiss and elimination
    const allRoundArrays = [t.rounds, ...(t.eliminationRounds ? [t.eliminationRounds] : [])];
    for (const roundsArr of allRoundArrays) {
      for (const round of roundsArr) {
        for (const match of round.matches) {
          if (match.isBye || match.result) continue;
          const involves = match.player1Id === droppedId || match.player2Id === droppedId;
          if (!involves) continue;
          const opponentId = match.player1Id === droppedId ? match.player2Id : match.player1Id;
          match.result = { winnerId: opponentId, finishType: 'spin' };
          match.matchStatus = 'completed';
          match.isWalkover = true;
          if (opponentId === match.player1Id) {
            match.player1Points = t.pointsToWin;
          } else {
            match.player2Points = t.pointsToWin;
          }
        }
      }
    }

    // Check if current round (swiss or elimination) is now complete
    const isElim = t.phase === 'elimination';
    const currentRoundsArr = isElim ? t.eliminationRounds! : t.rounds;
    const currentRoundIdx = isElim ? (t.currentEliminationRound || 0) : t.currentRound;
    const currentRound = currentRoundsArr[currentRoundIdx];

    if (currentRound) {
      const allDone = currentRound.matches.every(m => m.result || m.isBye);
      if (allDone) {
        currentRound.completed = true;
        if (isElim) {
          const totalElimRounds = Math.ceil(Math.log2(t.eliminationPlayerIds?.length || 2));
          const nextElimRound = generateNextEliminationRound(currentRound, currentRoundIdx + 1, t.arenaCount, totalElimRounds);
          if (nextElimRound && nextElimRound.matches.filter(m => !m.isBye).length > 0) {
            t.eliminationRounds!.push(nextElimRound);
            t.currentEliminationRound = currentRoundIdx + 1;
          }
        } else {
          if (t.currentRound + 1 < t.totalRounds) {
            const nextRound = generateSwissRound({ ...t, currentRound: t.currentRound + 1 });
            if (nextRound) {
              t.rounds.push(nextRound);
              t.currentRound++;
            }
          }
        }
      }
    }

    // Adjust total rounds if needed
    const activeCount = t.playerIds.filter(id => !(t.droppedPlayerIds || []).includes(id)).length;
    if (activeCount >= 2 && !isElim) {
      const maxRounds = Math.ceil(Math.log2(activeCount)) + 1;
      t.totalRounds = Math.max(3, Math.min(t.totalRounds, maxRounds));
    }

    updateActive(t);
    setConfirmDropPlayer(null);
    setVsKey(k => k + 1);
    const playerName = getPlayer(droppedId)?.name || '';
    toast.success(`${playerName} foi dropado. Vitória(s) por W/O atribuída(s).`);
  }, [activeTournament, confirmDropPlayer, updateActive, getPlayer]);

  // Platform bladers / inscricoes queries removed — handled inside BladerTournamentModal.

  // ─── Helpers for elimination phase ───
  const isInEliminationPhase = activeTournament?.phase === 'elimination';
  const swissRoundsComplete = activeTournament ? activeTournament.currentRound + 1 >= activeTournament.totalRounds && activeTournament.rounds[activeTournament.currentRound]?.completed : false;
  const shouldShowStartElimination = swissRoundsComplete && activeTournament?.eliminationSize && !isInEliminationPhase && !activeTournament?.eliminationRounds?.length;

  // Get qualified players for transition
  const qualifiedPlayersForTransition = useMemo(() => {
    if (!activeTournament?.eliminationPlayerIds) return [];
    return activeTournament.eliminationPlayerIds.map(id => getPlayer(id)).filter(Boolean) as Player[];
  }, [activeTournament?.eliminationPlayerIds, getPlayer]);

  // Find champion in elimination
  const eliminationChampion = useMemo(() => {
    if (!activeTournament?.eliminationRounds) return undefined;
    const lastRound = activeTournament.eliminationRounds[activeTournament.eliminationRounds.length - 1];
    if (!lastRound?.completed) return undefined;
    const finalMatch = lastRound.matches.find(m => !m.isBye && m.result);
    return finalMatch?.result?.winnerId;
  }, [activeTournament?.eliminationRounds]);

  // ─── ACTIVE TOURNAMENT VIEW ───
  if (view === 'active' && activeTournament) {
    const isElim = isInEliminationPhase;
    const currentRoundsArr = isElim ? (activeTournament.eliminationRounds || []) : activeTournament.rounds;
    const currentRoundIdx = isElim ? (activeTournament.currentEliminationRound || 0) : activeTournament.currentRound;
    const currentRound = currentRoundsArr[currentRoundIdx];
    if (!currentRound && !shouldShowStartElimination) return null;

    const allNonBye = currentRound ? currentRound.matches.filter(m => !m.isBye) : [];
    const activeMatches = allNonBye.filter(m => !m.result);
    const allPending = activeMatches;
    const byePlayer = currentRound?.byePlayerId ? getPlayer(currentRound.byePlayerId) : null;
    const completedMatches = allNonBye.filter(m => m.result);

    // Group matches by arena number
    const arenaGroups: { arenaIdx: number; matches: typeof allNonBye }[] = [];
    const arenaMap = new Map<number, typeof allNonBye>();
    for (const m of activeMatches) {
      const ai = m.arenaIndex ?? 0;
      if (!arenaMap.has(ai)) arenaMap.set(ai, []);
      arenaMap.get(ai)!.push(m);
    }
    const sortedArenaKeys = [...arenaMap.keys()].sort((a, b) => a - b);
    for (const key of sortedArenaKeys) {
      arenaGroups.push({ arenaIdx: key, matches: arenaMap.get(key)! });
    }
    // Clamp selected arena
    const clampedArena = Math.min(selectedArena, Math.max(0, arenaGroups.length - 1));
    const currentArenaGroup = arenaGroups[clampedArena];
    const currentArenaMatch = currentArenaGroup?.matches[0];

    return (
      <div className="p-5 max-w-5xl mx-auto space-y-4 relative">
        {victoryWinner && <VictorySplash winner={victoryWinner} finishType={victoryFinish} />}
        {showEliminationTransition && (
          <EliminationTransition
            topN={activeTournament.eliminationSize || 4}
            qualifiedPlayers={qualifiedPlayersForTransition}
            onComplete={handleEliminationTransitionComplete}
          />
        )}

        <TournamentHUD tournament={activeTournament} pendingCount={allPending.length} totalMatches={allNonBye.length} />

        {/* Phase indicator */}
        {isElim && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Swords className="h-5 w-5 text-accent" />
            <span className="font-heading text-sm font-bold tracking-[0.2em] text-accent italic uppercase">
              FASE ELIMINATÓRIA — {currentRound?.label || 'ELIMINATÓRIA'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="neon-line-blurple pl-3">
            <h1 className="font-heading text-2xl font-bold tracking-wider text-foreground italic">{activeTournament.name}</h1>
            <p className="text-xs text-muted-foreground font-body">
              {isElim
                ? `Eliminatória — ${currentRound?.label || ''}`
                : `Rodada ${activeTournament.currentRound + 1} de ${activeTournament.totalRounds}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-heading flex items-center gap-1">
              <Award className="h-3 w-3" /> PTS: {activeTournament.pointsToWin}
            </span>
            {activeTournament.eliminationSize && !isElim && (
              <span className="text-xs text-accent font-heading flex items-center gap-1">
                <Swords className="h-3 w-3" /> TOP {activeTournament.eliminationSize}
              </span>
            )}
            <Button onClick={() => setShowCorrectModal(true)} variant="outline" className="font-heading tracking-wider gap-2 border-muted-foreground/30 text-muted-foreground hover:text-foreground">
              <History className="h-4 w-4" /> Corrigir
            </Button>
            <Button onClick={() => setConfirmEndTournament(true)} variant="outline" className="font-heading tracking-wider gap-2 border-primary/50 text-primary">
              <Trophy className="h-4 w-4" /> Encerrar
            </Button>
            <Button onClick={() => setConfirmCancelTournament(true)} variant="destructive" className="font-heading tracking-wider gap-2">
              <XOctagon className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        </div>

        {/* Swiss Bracket Tree */}
        {!isElim && (
          <BracketTree tournament={activeTournament} getPlayer={getPlayer} currentRoundHighlight={activeTournament.currentRound} onDropPlayer={(pid) => setConfirmDropPlayer(pid)} />
        )}

        {/* Elimination Bracket */}
        {activeTournament.eliminationRounds && activeTournament.eliminationRounds.length > 0 && (
          <EliminationBracket
            rounds={activeTournament.eliminationRounds}
            getPlayer={getPlayer}
            currentRound={activeTournament.currentEliminationRound}
            champion={eliminationChampion}
          />
        )}

        {/* Start Elimination Button */}
        {shouldShowStartElimination && (
          <div className="glass-panel text-center py-8 space-y-4 glow-blurple">
            <Swords className="h-12 w-12 mx-auto text-accent" />
            <h2 className="font-heading text-2xl font-bold text-accent tracking-[0.15em] italic">
              RODADAS SWISS CONCLUÍDAS!
            </h2>
            <p className="text-sm text-muted-foreground font-body">
              Classificação definida. Iniciar fase eliminatória TOP {activeTournament.eliminationSize}?
            </p>
            <Button onClick={handleStartElimination} className="font-heading tracking-wider gap-2 bg-accent text-accent-foreground hover:bg-accent/80 text-lg px-8 py-3 h-auto">
              <Swords className="h-5 w-5" /> INICIAR TOP {activeTournament.eliminationSize}
            </Button>
          </div>
        )}

        {/* Enrolled players */}
        <details className="glass-panel">
          <summary className="px-4 py-2.5 cursor-pointer font-heading text-xs tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
            <Users className="h-3.5 w-3.5" /> INSCRITOS ({activeTournament.playerIds.length})
            {(activeTournament.droppedPlayerIds || []).length > 0 && (
              <span className="text-destructive ml-1">• {(activeTournament.droppedPlayerIds || []).length} dropped</span>
            )}
          </summary>
          <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {activeTournament.playerIds.map(pid => {
              const p = getPlayer(pid);
              if (!p) return null;
              const isDropped = (activeTournament.droppedPlayerIds || []).includes(pid);
              return (
                <div key={pid} className={`dark-panel p-2 flex items-center gap-2 text-xs group ${isDropped ? 'opacity-50' : ''}`}>
                  <Avatar className={`h-6 w-6 border ${isDropped ? 'border-destructive/50 grayscale' : 'border-primary/30'}`}>
                    {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} /> : <AvatarFallback className="bg-muted text-[8px]">{p.avatar}</AvatarFallback>}
                  </Avatar>
                  <span className={`font-heading truncate flex-1 ${isDropped ? 'line-through text-muted-foreground' : ''}`}>
                    {p.nickname || p.name.split(' ')[0]}
                  </span>
                  {isDropped ? (
                    <span className="text-[9px] font-heading tracking-wider text-destructive flex items-center gap-0.5">
                      <Ban className="h-3 w-3" /> DROP
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDropPlayer(pid)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive" title="Dropar jogador">
                      <Ban className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </details>

        {byePlayer && <ByeBanner player={byePlayer} />}

        {/* Arena tab selector */}
        {arenaGroups.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto"
            style={{
              padding: '12px 16px',
              background: '#0d1120',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.06)',
            }}
          >
            {arenaGroups.map((group, idx) => {
              const isSelected = idx === clampedArena;
              const match = group.matches[0];
              const p1 = match ? getPlayer(match.player1Id) : null;
              const p2 = match ? getPlayer(match.player2Id) : null;
              const isDone = match?.result;
              return (
                <button
                  key={group.arenaIdx}
                  onClick={() => setSelectedArena(idx)}
                  className="flex flex-col items-center gap-1 shrink-0 transition-all duration-150"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'rgba(37,99,235,.3)' : 'rgba(255,255,255,.08)'}`,
                    background: isSelected ? 'rgba(37,99,235,.12)' : 'transparent',
                    minWidth: 120,
                  }}
                >
                  <span
                    className="font-heading uppercase"
                    style={{ fontSize: 9, letterSpacing: 2, color: isSelected ? '#60A5FA' : 'rgba(255,255,255,.3)' }}
                  >
                    ARENA {group.arenaIdx + 1}
                  </span>
                  <span
                    className="font-body font-semibold truncate max-w-[100px]"
                    style={{ fontSize: 12, color: '#fff' }}
                  >
                    {p1 && p2 ? `${p1.nickname || p1.name.split(' ')[0]} · ${p2.nickname || p2.name.split(' ')[0]}` : '—'}
                  </span>
                  {!isDone && (
                    <div className="flex items-center gap-1">
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'blink 2s ease-in-out infinite' }} />
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>Em andamento</span>
                    </div>
                  )}
                  {isDone && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,.3)' }}>Finalizada</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Current arena match */}
        {currentArenaMatch && !currentArenaMatch.result && players.length > 0 ? (
          <div className="space-y-0">
            <div className="relative rounded-xl overflow-hidden" key={`${currentArenaMatch.id}-${vsKey}`}>
              <FinishOverlay finishType={finishOverlay} onDone={() => setFinishOverlay(null)} />
              <VersusScreen
                player1={getPlayer(currentArenaMatch.player1Id)!}
                player2={getPlayer(currentArenaMatch.player2Id)!}
                arenaName={isElim ? (currentRound?.label || 'ELIMINATÓRIA') : `ARENA ${(currentArenaGroup?.arenaIdx ?? 0) + 1}`}
                player1Points={currentArenaMatch.player1Points}
                player2Points={currentArenaMatch.player2Points}
                pointsToWin={activeTournament.pointsToWin}
                player1Streak={getPlayerStreak(activeTournament, currentArenaMatch.player1Id)}
                player2Streak={getPlayerStreak(activeTournament, currentArenaMatch.player2Id)}
              />
              <div
                className="grid gap-3 px-3 py-4"
                style={{
                  gridTemplateColumns: '1fr 1px 1fr',
                  background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #090b12 70%)',
                }}
              >
                <ResultButtons
                  playerName={getPlayer(currentArenaMatch.player1Id)?.nickname || getPlayer(currentArenaMatch.player1Id)?.name || ''}
                  side="left"
                  onResult={(ft) => handleScorePoint(currentArenaMatch.id, currentArenaMatch.player1Id, ft, isElim)}
                  disabled={!!currentArenaMatch.result}
                />
                <div style={{ background: 'rgba(255,255,255,0.04)' }} />
                <ResultButtons
                  playerName={getPlayer(currentArenaMatch.player2Id)?.nickname || getPlayer(currentArenaMatch.player2Id)?.name || ''}
                  side="right"
                  onResult={(ft) => handleScorePoint(currentArenaMatch.id, currentArenaMatch.player2Id, ft, isElim)}
                  disabled={!!currentArenaMatch.result}
                />
                <button
                  onClick={() => handleUndoPoint(currentArenaMatch.id, isElim)}
                  disabled={!currentArenaMatch.scoreLog || currentArenaMatch.scoreLog.filter(a => !a.undone).length === 0}
                  className="flex items-center justify-center gap-2 w-full font-body transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed"
                  style={{
                    gridColumn: '1 / -1',
                    marginTop: 4,
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.15)',
                    borderRadius: 10,
                    color: '#C4C9D4',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                  onMouseEnter={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,.1)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
                    e.currentTarget.style.color = '#C4C9D4';
                  }}
                >
                  <Undo2 className="h-4 w-4" /> Desfazer último ponto
                </button>
              </div>
            </div>
          </div>
        ) : activeMatches.length === 0 && !shouldShowStartElimination ? (
          <div className="glass-panel text-center py-12">
            <CheckCircle className="h-10 w-10 mx-auto text-primary mb-3" />
            <p className="font-heading text-lg text-foreground">
              {isElim && eliminationChampion ? '🏆 Campeão definido!' : 'Rodada Completa!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isElim && eliminationChampion
                ? `${getPlayer(eliminationChampion)?.name || 'Vencedor'} é o campeão! Encerre o torneio para distribuir XP.`
                : isElim
                  ? 'Próxima fase gerada automaticamente.'
                  : activeTournament.currentRound + 1 >= activeTournament.totalRounds
                    ? activeTournament.eliminationSize
                      ? 'Rodadas Swiss concluídas. Inicie a fase eliminatória.'
                      : 'Todas as rodadas concluídas. Encerre o torneio.'
                    : 'Próxima rodada gerada automaticamente.'}
            </p>
          </div>
        ) : currentArenaMatch?.result ? (
          <div className="glass-panel text-center py-8">
            <CheckCircle className="h-8 w-8 mx-auto text-primary/60 mb-2" />
            <p className="font-heading text-sm text-foreground">Esta arena já finalizou</p>
            <p className="text-xs text-muted-foreground mt-1">Selecione outra arena em andamento acima</p>
          </div>
        ) : null}

        {/* Completed matches */}
        {completedMatches.length > 0 && (
          <div className="space-y-2">
            <p className="font-heading text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Resultados</p>
            <div className="space-y-1">
              {completedMatches.map(m => {
                const winner = getPlayer(m.result!.winnerId);
                const loserId = m.player1Id === m.result!.winnerId ? m.player2Id : m.player1Id;
                const loser = getPlayer(loserId);
                return (
                  <div key={m.id} className="dark-panel flex items-center gap-2 p-2.5 text-xs">
                    <span className="font-heading font-bold text-primary truncate">{winner?.nickname || winner?.name}</span>
                    <span className="text-muted-foreground">{m.isWalkover ? 'W/O' : 'def.'}</span>
                    <span className="text-muted-foreground truncate">{loser?.nickname || loser?.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground uppercase font-heading">
                      {m.isWalkover ? 'W/O' : m.result!.finishType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirmation dialogs */}
        <ConfirmDialog open={confirmEndTournament} onOpenChange={setConfirmEndTournament}
          title="Encerrar Torneio" description="Tem certeza que deseja encerrar o torneio? Os standings finais serão calculados e o XP distribuído."
          confirmLabel="Encerrar" variant="default" onConfirm={handleEndTournament} />
        <ConfirmDialog open={confirmCancelTournament} onOpenChange={setConfirmCancelTournament}
          title="Cancelar Torneio" description="Tem certeza? O torneio será APAGADO permanentemente. Nenhum XP será distribuído."
          confirmLabel="Cancelar Torneio" onConfirm={handleCancelTournament} />
        <ConfirmDialog open={!!confirmRemovePlayer} onOpenChange={(open) => { if (!open) setConfirmRemovePlayer(null); }}
          title="Registrar Desistência" description={`Tem certeza que deseja remover "${confirmRemovePlayer ? (getPlayer(confirmRemovePlayer)?.name || '') : ''}" do torneio?`}
          confirmLabel="Remover" onConfirm={handleRemovePlayer} />
        <ConfirmDialog open={!!confirmDropPlayer} onOpenChange={(open) => { if (!open) setConfirmDropPlayer(null); }}
          title="Dropar Jogador" description={`Tem certeza que deseja dropar "${confirmDropPlayer ? (getPlayer(confirmDropPlayer)?.name || '') : ''}"? Esta ação não pode ser desfeita. Partidas em andamento serão encerradas com W/O.`}
          confirmLabel="Dropar" onConfirm={handleDropPlayer} />

        {/* Confirm Result Modal */}
        {pendingResult && (
          <ConfirmResultModal
            open={!!pendingResult}
            player1={getPlayer(pendingResult.player1Id)!}
            player2={getPlayer(pendingResult.player2Id)!}
            player1Points={pendingResult.p1Points}
            player2Points={pendingResult.p2Points}
            pointsToWin={activeTournament.pointsToWin}
            onConfirm={handleConfirmResult}
            onCancel={handleCancelPendingResult}
          />
        )}

        {/* Correct Result Modal */}
        <CorrectResultModal
          open={showCorrectModal}
          tournament={activeTournament}
          getPlayer={getPlayer}
          onClose={() => setShowCorrectModal(false)}
          onCorrect={handleCorrectResult}
        />
      </div>
    );
  }

  const stats = listStats;
  // ─── LIST VIEW ───
  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 relative">
      
      {/* Page Header */}
      {detailsTournament && (
        <BladerTournamentModal
          tournament={toModalTournament(detailsTournament)}
          open={!!detailsTournament}
          onOpenChange={(open) => { if (!open) setDetailsTournament(null); }}
          mode="organizer"
          onInscrito={() => { refreshList(); }}
          onManage={() => { setDetailsTournament(null); }}
        />
      )}

      {enrollTournament && (
        <EnrollBladersModal
          tournamentId={enrollTournament.id}
          tournamentName={enrollTournament.name}
          open={!!enrollTournament}
          onOpenChange={(open) => { if (!open) setEnrollTournament(null); }}
          onEnrolled={() => refreshList()}
        />
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(79,142,247,0.1)]">
            <Swords className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-[0.08em] text-foreground">Torneios</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-body mt-0.5">Gerencie campeonatos, inscrições e rodadas da sua liga</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 sm:px-5 shrink-0 shadow-[0_0_15px_rgba(79,142,247,0.2)]">
          <Plus className="h-4 w-4" /> <span className="hidden xs:inline">Criar Torneio</span><span className="xs:hidden">Criar</span>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon"><Calendar className="h-[18px] w-[18px]" /></div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground leading-none">{stats.upcoming}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Agendados</p>
            </div>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon"><Play className="h-[18px] w-[18px]" /></div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground leading-none">{stats.active}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Em andamento</p>
            </div>
          </div>
        </div>
        <div className="stat-card stat-card-secondary">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon"><Trophy className="h-[18px] w-[18px]" /></div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground leading-none">{stats.completed}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Finalizados</p>
            </div>
          </div>
        </div>
        <div className="stat-card stat-card-gold">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon"><Users className="h-[18px] w-[18px]" /></div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground leading-none">{stats.totalPlayers}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Participantes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (() => {
        const inputStyle: React.CSSProperties = {
          width: '100%', padding: '10px 14px', background: '#111827',
          border: '1px solid rgba(255,255,255,.1)', borderRadius: 10,
          color: '#E2E8F0', fontSize: 14, outline: 'none', transition: 'border-color .15s, box-shadow .15s',
          fontFamily: 'inherit',
        };
        const labelStyle: React.CSSProperties = {
          fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.7)',
          marginBottom: 6, display: 'block',
        };
        const sectionStyle: React.CSSProperties = {
          fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
          color: 'rgba(255,255,255,.3)', margin: '20px 0 12px', display: 'flex',
          alignItems: 'center', gap: 8,
        };
        const sectionLine = <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />;
        const onFocus = (e: React.FocusEvent<HTMLElement>) => {
          (e.target as HTMLElement).style.borderColor = 'rgba(37,99,235,.5)';
          (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,.08)';
        };
        const onBlur = (e: React.FocusEvent<HTMLElement>) => {
          (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,.1)';
          (e.target as HTMLElement).style.boxShadow = 'none';
        };
        return (
        <div className="anim-fade-up" style={{
          background: '#0d1120', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 16, padding: 24, maxWidth: 680, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy className="h-[18px] w-[18px]" style={{ color: '#60A5FA' }} />
            </div>
            <div>
              <h2 className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Novo torneio</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Configure e publique seu campeonato</p>
            </div>
          </div>

          {/* Informações básicas */}
          <div style={sectionStyle}>Informações básicas{sectionLine}</div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome do torneio</label>
            <input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ex: Copa BLADEX Abril" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={labelStyle}>Descrição (opcional)</label>
            <textarea value={tDescricao} onChange={e => setTDescricao(e.target.value.slice(0, 200))} placeholder="Descrição breve do torneio..." maxLength={200}
              style={{ ...inputStyle, height: 80, resize: 'none', paddingTop: 10 }} onFocus={onFocus} onBlur={onBlur} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textAlign: 'right', marginTop: 4 }}>{tDescricao.length}/200</p>
          </div>

          {/* Data e horário */}
          <div style={sectionStyle}>Data e horário{sectionLine}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Início</label>
              <input type="datetime-local" value={tHorarioInicio} onChange={e => { setTHorarioInicio(e.target.value); if (!tDate) setTDate(e.target.value.split('T')[0]); }}
                style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Término (opcional)</label>
              <input type="datetime-local" value={tHorarioFim} onChange={e => setTHorarioFim(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Local */}
          <div style={sectionStyle}>Local{sectionLine}</div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome do local</label>
            <input value={tLocalNome} onChange={e => setTLocalNome(e.target.value)} placeholder='Ex: "Arena Beyblade Campo Grande"' style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Endereço completo</label>
            <input value={tLocalEndereco} onChange={e => setTLocalEndereco(e.target.value)} placeholder="Rua, número, bairro..." style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input value={tLocalCidade} onChange={e => setTLocalCidade(e.target.value)} placeholder="Cidade" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={tLocalEstado} onChange={e => setTLocalEstado(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Selecione</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Configurações */}
          <div style={sectionStyle}>Configurações{sectionLine}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Máx. bladers</label>
              <input type="number" min={2} max={128} value={tMaxPlayers} onChange={e => setTMaxPlayers(parseInt(e.target.value) || 32)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Nº arenas</label>
              <input type="number" min={1} max={10} value={tArenaCount} onChange={e => setTArenaCount(parseInt(e.target.value) || 1)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Prêmio (opcional)</label>
            <input value={tPremio} onChange={e => setTPremio(e.target.value)} placeholder="Ex: Troféu + kit exclusivo" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Regras especiais (opcional)</label>
            <textarea value={tRegras} onChange={e => setTRegras(e.target.value)} placeholder="Regras adicionais do torneio..."
              style={{ ...inputStyle, height: 80, resize: 'none', paddingTop: 10 }} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Fase final</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([null, 4, 8, 16] as EliminationSize[]).map(size => (
                <button key={String(size)} onClick={() => setTEliminationSize(size)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: 1,
                    cursor: 'pointer', transition: 'all .15s',
                    background: tEliminationSize === size ? 'rgba(37,99,235,.15)' : 'rgba(255,255,255,.02)',
                    border: tEliminationSize === size ? '1px solid rgba(37,99,235,.4)' : '1px solid rgba(255,255,255,.08)',
                    color: tEliminationSize === size ? '#60A5FA' : 'rgba(255,255,255,.45)',
                  }}>
                  {size ? `Top ${size}` : 'Sem fase'}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.06)', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(false)}
              style={{ padding: '11px 18px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 10 }}>
              Cancelar
            </button>
            <button onClick={handleCreate}
              style={{ padding: '11px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer', boxShadow: '0 0 15px rgba(37,99,235,.25)' }}>
              Criar e publicar
            </button>
          </div>
        </div>
        );
      })()}

      {/* Start config panel */}
      {startingTournament && (
        <div className="surface-card p-6 space-y-5 border-primary/20 anim-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Play className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground tracking-wider">INICIAR: {startingTournament.name}</h2>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{(tournaments.find(t => t.id === startingTournament.id)?.playerIds.length) || startingTournament.playerIds.length} jogadores inscritos</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground text-xs tracking-wider">Rodadas Swiss</Label>
              <div className="flex gap-2">
                <Input type="number" min={1} max={20} value={rounds} onChange={e => setRounds(parseInt(e.target.value) || 1)} className="bg-muted/30 border-border h-11 font-body arena-input-clean" />
                <Button variant="outline" size="sm" onClick={() => setRounds(suggested)} className="gap-1 text-xs font-heading shrink-0 border-primary text-primary h-11 px-3">
                  <Lightbulb className="h-3.5 w-3.5" /> {suggested}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground text-xs tracking-wider">Arenas</Label>
              <Input type="number" min={1} max={10} value={arenaCount} onChange={e => setArenaCount(parseInt(e.target.value) || 2)} className="bg-muted/30 border-border h-11 font-body arena-input-clean" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground text-xs tracking-wider">Pts p/ Vencer</Label>
              <Input type="number" min={1} max={10} value={pointsToWin} onChange={e => setPointsToWin(parseInt(e.target.value) || 4)} className="bg-muted/30 border-border h-11 font-body arena-input-clean" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground text-xs tracking-wider">Fase Final</Label>
              <div className="flex gap-1.5 h-11 items-stretch">
                {([null, 4, 8, 16] as EliminationSize[]).map(size => (
                  <button key={String(size)} onClick={() => setStartEliminationSize(size)}
                    className={`flex-1 font-heading text-[11px] font-bold tracking-wider rounded-lg border-2 transition-all ${
                      (startEliminationSize ?? startingTournament.eliminationSize) === size
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    }`}>
                    {size ? `T${size}` : 'SEM'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleStartTournament} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground h-11 px-6 shadow-[0_0_15px_rgba(79,142,247,0.2)]">
              <Play className="h-4 w-4" /> INICIAR TORNEIO
            </Button>
            <Button variant="outline" onClick={() => setStartingTournament(null)} className="font-heading tracking-wider h-11">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-heading font-semibold tracking-wider transition-all ${
            activeTab === 'upcoming'
              ? 'bg-primary/15 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          Agendados ({upcomingTournaments.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-heading font-semibold tracking-wider transition-all ${
            activeTab === 'completed'
              ? 'bg-primary/15 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          Finalizados ({completedTournaments.length})
        </button>
      </div>

      {/* Tournament List */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcomingTournaments.length === 0 ? (
            <div className="surface-card p-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/12 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-7 w-7 text-primary/50" />
              </div>
              <p className="font-heading text-lg text-foreground font-bold mb-1">Nenhum torneio agendado</p>
              <p className="text-sm text-muted-foreground font-body mb-5">Crie seu primeiro torneio e comece a competição!</p>
              <Button onClick={() => setShowCreate(true)} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" /> Criar Torneio
              </Button>
            </div>
          ) : (
            upcomingTournaments.map((t, i) => {
              const enrolledCount = t.enrolledCount ?? t.playerIds.length;
              const canStart = enrolledCount >= 2;
              const spotsLeft = (t.maxPlayers || 32) - enrolledCount;
              const fillPercent = Math.min(100, (enrolledCount / (t.maxPlayers || 32)) * 100);
              return (
                <div key={t.id} onClick={() => setDetailsTournament(t)} className="surface-card p-0 anim-fade-up overflow-hidden cursor-pointer" style={{ animationDelay: `${i * 60}ms` }}>
                  {/* Top accent */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-primary to-transparent" />
                  
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h3 className="font-heading text-base sm:text-lg font-bold text-foreground tracking-wide truncate min-w-0">{t.name}</h3>
                        {t.eliminationSize && (
                          <span className="badge-status badge-upcoming text-[10px] py-0.5">TOP {t.eliminationSize}</span>
                        )}
                        <span className={`badge-status text-[10px] py-0.5 ${
                          spotsLeft <= 0 ? 'badge-full' : spotsLeft <= 5 ? 'badge-full' : 'badge-upcoming'
                        }`}>
                          {spotsLeft <= 0 ? 'Lotado' : spotsLeft <= 5 ? 'Quase lotado' : 'Aberto'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-5 text-xs text-muted-foreground font-body flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {enrolledCount} / {t.maxPlayers || 32} inscritos
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.04)]">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{ width: `${fillPercent}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-body">{Math.round(fillPercent)}%</span>
                      </div>

                      {/* Avatar stack */}
                      {t.playerIds.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {t.playerIds.slice(0, 6).map(pid => {
                              const p = getPlayer(pid);
                              if (!p) return null;
                              return (
                                <Avatar key={pid} className="h-7 w-7 border-2 border-[hsl(var(--surface))]">
                                  {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} /> : <AvatarFallback className="bg-muted text-[9px]">{p.avatar}</AvatarFallback>}
                                </Avatar>
                              );
                            })}
                          </div>
                          {t.playerIds.length > 6 && <span className="text-[11px] text-muted-foreground font-body">+{t.playerIds.length - 6}</span>}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 sm:pt-1 flex-wrap">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEnrollTournament(t); }}
                        className="font-heading tracking-wider gap-1.5 border-accent/40 text-accent hover:bg-accent/10 h-9 px-3 sm:px-3.5 flex-1 sm:flex-none">
                        <UserPlus className="h-3.5 w-3.5" /> Inscrever
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setStartingTournament(t); setStartEliminationSize(t.eliminationSize || null); }}
                        className="font-heading tracking-wider gap-1.5 border-primary/30 text-primary hover:bg-primary/10 h-9 px-3 sm:px-3.5 flex-1 sm:flex-none" disabled={!canStart}>
                        <Play className="h-3.5 w-3.5" /> Iniciar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/30">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setConfirmDeleteTournament(t.id); }}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-3">
          {completedTournaments.length === 0 ? (
            <div className="surface-card p-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-heading text-lg text-foreground font-bold mb-1">Nenhum torneio finalizado</p>
              <p className="text-sm text-muted-foreground font-body">Torneios encerrados aparecerão aqui.</p>
            </div>
          ) : (
            completedTournaments.map((t, i) => (
              <div key={t.id} className="surface-card p-0 anim-fade-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="h-[2px] w-full bg-gradient-to-r from-muted-foreground/30 to-transparent" />
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h3 className="font-heading text-base sm:text-lg font-bold text-foreground/70 tracking-wide truncate min-w-0">{t.name}</h3>
                      <span className="badge-status badge-completed text-[10px] py-0.5">Finalizado</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5 text-xs text-muted-foreground font-body mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{t.playerIds.length} participantes</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/history/${t.id}`)}
                    className="font-heading tracking-wider gap-1.5 h-9 px-3.5 text-muted-foreground hover:text-foreground w-full sm:w-auto">
                    <Award className="h-3.5 w-3.5" /> Ver Resultado
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Tournament Modal */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingTournament(null)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10 surface-card p-6 max-w-md w-full border-primary/15 anim-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl font-bold text-foreground tracking-wider">EDITAR TORNEIO</h2>
              <button onClick={() => setEditingTournament(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/30">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-heading text-muted-foreground text-xs tracking-wider">Nome do Torneio</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ex: Copa Beyblade X" className="bg-muted/30 border-border h-11 font-body" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-heading text-muted-foreground text-xs tracking-wider">Data</Label>
                  <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="bg-muted/30 border-border h-11 font-body arena-input-clean" />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-muted-foreground text-xs tracking-wider">Máx. Jogadores</Label>
                  <Input type="number" min={2} max={128} value={editMaxPlayers} onChange={e => setEditMaxPlayers(parseInt(e.target.value) || 32)} className="bg-muted/30 border-border h-11 font-body arena-input-clean" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-heading text-muted-foreground text-xs tracking-wider">Fase Final</Label>
                <div className="flex gap-1.5 h-11 items-stretch">
                  {([null, 4, 8, 16] as EliminationSize[]).map(size => (
                    <button key={String(size)} onClick={() => setEditEliminationSize(size)}
                      className={`flex-1 font-heading text-[11px] font-bold tracking-wider rounded-lg border-2 transition-all ${
                        editEliminationSize === size
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}>
                      {size ? `TOP ${size}` : 'SEM'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-5">
              <Button onClick={handleSaveEdit} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/80 h-11 px-6 flex-1">
                <Check className="h-4 w-4" /> Salvar
              </Button>
              <Button variant="ghost" onClick={() => setEditingTournament(null)} className="font-heading tracking-wider h-11 text-muted-foreground">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmDeleteTournament} onOpenChange={(open) => { if (!open) setConfirmDeleteTournament(null); }}
        title="Excluir Torneio" description="Tem certeza que deseja excluir este torneio? Esta ação não pode ser desfeita."
        confirmLabel="Excluir" onConfirm={handleDeleteTournament} />
    </div>
  );
}
