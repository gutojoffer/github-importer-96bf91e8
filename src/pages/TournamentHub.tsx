import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tournament, Player, FinishType, FINISH_POINTS, DEFAULT_AVATARS, ScoreAction, EliminationSize } from '@/types/tournament';
import { suggestRounds, generateFirstRound, generateSwissRound, getSwissStandings, generateEliminationBracket, generateNextEliminationRound } from '@/lib/matchmaking';
import { saveActiveTournament, saveTournaments } from '@/lib/storage';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import PlayerCard from '@/components/PlayerCard';
import VersusScreen from '@/components/VersusScreen';
import ResultButtons from '@/components/ResultButtons';
import ByeBanner from '@/components/ByeBanner';
import TournamentHUD from '@/components/TournamentHUD';
import VictorySplash from '@/components/VictorySplash';
import ConfirmDialog from '@/components/ConfirmDialog';
import BracketTree from '@/components/BracketTree';
import EliminationBracket from '@/components/EliminationBracket';
import EliminationTransition from '@/components/EliminationTransition';

import FinishOverlay from '@/components/FinishOverlay';
import LigaLogo from '@/components/LigaLogo';
import EloBadge from '@/components/EloBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus, Play, Lightbulb, Calendar, Users, Trophy, XOctagon, Award,
  CheckCircle, Camera, UserPlus, X, Search, Check, Trash2, UserMinus, Undo2, Ban, Swords,
} from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'active';

export default function TournamentHub() {
  const navigate = useNavigate();
  const players = usePlayerStore(s => s.players);
  const loadPlayers = usePlayerStore(s => s.load);
  const addPlayerToStore = usePlayerStore(s => s.add);

  const {
    tournaments, activeTournament, load: loadTournaments,
    createTournament, deleteTournament: deleteTournamentStore,
    setActiveTournament, updateActive, endTournament, cancelTournament: cancelTournamentStore,
    enrollPlayer, unenrollPlayer,
  } = useTournamentStore();

  const [view, setView] = useState<View>('list');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [tName, setTName] = useState('');
  const [tDate, setTDate] = useState('');
  const [tMaxPlayers, setTMaxPlayers] = useState(32);
  const [tEliminationSize, setTEliminationSize] = useState<EliminationSize>(null);

  // Enrollment modal
  const [enrollModal, setEnrollModal] = useState<string | null>(null);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaName, setQaName] = useState('');
  const [qaNick, setQaNick] = useState('');
  const [qaAvatar, setQaAvatar] = useState(DEFAULT_AVATARS[0]);
  const [qaCustomAvatar, setQaCustomAvatar] = useState('');
  const qaFileRef = useRef<HTMLInputElement>(null);

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

  // Elimination transition
  const [showEliminationTransition, setShowEliminationTransition] = useState(false);

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
      if (store.activeTournament) setView('active');
    });
  }, []);

  const getPlayer = useCallback((id: string) => players.find(p => p.id === id), [players]);
  const suggested = startingTournament ? suggestRounds(startingTournament.playerIds.length) : 3;

  const enrollModalTournament = useMemo(() =>
    enrollModal ? tournaments.find(t => t.id === enrollModal) : null
  , [enrollModal, tournaments]);

  // ─── Create Tournament ───
  const handleCreate = useCallback(() => {
    if (!tName.trim() || !tDate) { toast.error('Preencha nome e data!'); return; }
    const t: Tournament = {
      id: crypto.randomUUID(), name: tName.trim(), date: tDate,
      registrationDeadline: tDate, playerIds: [], rounds: [],
      currentRound: 0, arenaCount: 2, totalRounds: 3, pointsToWin: 4,
      status: 'upcoming', createdAt: new Date().toISOString(), maxPlayers: tMaxPlayers,
      eliminationSize: tEliminationSize,
    };
    createTournament(t);
    setShowCreate(false);
    setTName(''); setTDate(''); setTEliminationSize(null);
    toast.success('Torneio criado!');
  }, [tName, tDate, tMaxPlayers, tEliminationSize, createTournament]);

  // ─── Enrollment ───
  const handleEnroll = useCallback((playerId: string) => {
    if (!enrollModalTournament) return;
    if (enrollModalTournament.playerIds.includes(playerId)) {
      unenrollPlayer(enrollModalTournament.id, playerId);
    } else {
      enrollPlayer(enrollModalTournament.id, playerId);
    }
  }, [enrollModalTournament, enrollPlayer, unenrollPlayer]);

  const handleQuickAdd = useCallback(() => {
    if (!qaName.trim() || !enrollModal) { toast.error('Nome obrigatório!'); return; }
    const player: Player = {
      id: crypto.randomUUID(), name: qaName.trim(),
      nickname: qaNick.trim().replace(/^@/, ''),
      avatar: qaCustomAvatar || qaAvatar,
      createdAt: new Date().toISOString(), xp: 0,
    };
    addPlayerToStore(player);
    enrollPlayer(enrollModal, player.id);
    setQaName(''); setQaNick(''); setQaCustomAvatar(''); setQaAvatar(DEFAULT_AVATARS[0]);
    setShowQuickAdd(false);
    toast.success(`${player.name} cadastrado e inscrito!`);
  }, [qaName, qaNick, qaCustomAvatar, qaAvatar, enrollModal, addPlayerToStore, enrollPlayer]);

  // ─── Start Tournament ───
  const handleStartTournament = useCallback(() => {
    if (!startingTournament) return;
    const t = tournaments.find(tr => tr.id === startingTournament.id);
    if (!t || t.playerIds.length < 2) { toast.error('Mínimo 2 jogadores inscritos!'); return; }
    const firstRound = generateFirstRound(t.playerIds, arenaCount);
    const active: Tournament = {
      ...t, status: 'active', arenaCount, totalRounds: rounds,
      pointsToWin, rounds: [firstRound], currentRound: 0,
      eliminationSize: startEliminationSize || t.eliminationSize,
      phase: 'swiss',
    };
    deleteTournamentStore(t.id);
    setActiveTournament(active);
    setStartingTournament(null);
    setView('active');
    toast.success('🌀 Torneio iniciado! Let it rip!');
  }, [startingTournament, arenaCount, rounds, pointsToWin, startEliminationSize, tournaments, deleteTournamentStore, setActiveTournament]);

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
      const matchWinnerId = match.player1Points >= ptw ? match.player1Id : match.player2Id;
      match.result = { winnerId: matchWinnerId, finishType };
      const winner = getPlayer(matchWinnerId);
      if (winner) { setVictoryWinner(winner); setVictoryFinish(finishType); }
      setTimeout(() => { setVictoryWinner(null); setVictoryFinish(undefined); setVsKey(k => k + 1); }, 3500);

      const allDone = currentRound.matches.every(m => m.result);
      if (allDone) {
        currentRound.completed = true;

        if (isElimination) {
          // Generate next elimination round
          const totalElimRounds = Math.ceil(Math.log2(t.eliminationPlayerIds?.length || 2));
          const nextElimRound = generateNextEliminationRound(currentRound, currentRoundIdx + 1, t.arenaCount, totalElimRounds);
          if (nextElimRound && nextElimRound.matches.filter(m => !m.isBye).length > 0) {
            t.eliminationRounds!.push(nextElimRound);
            t.currentEliminationRound = currentRoundIdx + 1;
            toast.success(`${nextElimRound.label || 'Próxima fase'} gerada!`);
          } else {
            // Final match done - champion!
            toast.info('🏆 CAMPEÃO DEFINIDO! Encerre o torneio.');
          }
        } else {
          // Swiss round complete
          if (t.currentRound + 1 < t.totalRounds) {
            const nextRound = generateSwissRound({ ...t, currentRound: t.currentRound + 1 });
            if (nextRound) {
              t.rounds.push(nextRound);
              t.currentRound++;
              toast.success(`Rodada ${t.currentRound + 1} gerada!`);
            }
          } else {
            // All swiss rounds complete
            if (t.eliminationSize) {
              toast.info(`Rodadas Swiss concluídas! Preparando TOP ${t.eliminationSize}...`);
            } else {
              toast.info('Todas as rodadas concluídas! Encerre o torneio.');
            }
          }
        }
      }
    }

    updateActive(t);
  }, [activeTournament, getPlayer, updateActive]);

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
    usePlayerStore.setState({ loaded: false });
    await usePlayerStore.getState().load();
    toast.success('🏆 Torneio encerrado!');
    navigate(`/history/${tournamentId}`);
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

  const filteredPlayers = useMemo(() =>
    players.filter(p =>
      p.name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(enrollSearch.toLowerCase()))
    )
  , [players, enrollSearch]);

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
    const allPending = allNonBye.filter(m => !m.result);
    const byePlayer = currentRound?.byePlayerId ? getPlayer(currentRound.byePlayerId) : null;
    const currentMatch = allPending[0];
    const completedMatches = allNonBye.filter(m => m.result);

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

        {/* Current match */}
        {currentMatch && players.length > 0 ? (
          <div className="relative rounded-xl overflow-hidden space-y-0" key={`${currentMatch.id}-${vsKey}`}>
            <FinishOverlay finishType={finishOverlay} onDone={() => setFinishOverlay(null)} />
            <VersusScreen
              player1={getPlayer(currentMatch.player1Id)!}
              player2={getPlayer(currentMatch.player2Id)!}
              arenaName={isElim ? (currentRound?.label || 'ELIMINATÓRIA') : 'ARENA PRINCIPAL'}
              player1Points={currentMatch.player1Points}
              player2Points={currentMatch.player2Points}
              pointsToWin={activeTournament.pointsToWin}
            />
            <div
              className="grid gap-3 px-3 py-4"
              style={{
                gridTemplateColumns: '1fr 1px 1fr',
                background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #090b12 70%)',
              }}
            >
              <ResultButtons
                playerName={getPlayer(currentMatch.player1Id)?.nickname || getPlayer(currentMatch.player1Id)?.name || ''}
                side="left"
                onResult={(ft) => handleScorePoint(currentMatch.id, currentMatch.player1Id, ft, isElim)}
                disabled={!!currentMatch.result}
              />
              <div style={{ background: 'rgba(255,255,255,0.04)' }} />
              <ResultButtons
                playerName={getPlayer(currentMatch.player2Id)?.nickname || getPlayer(currentMatch.player2Id)?.name || ''}
                side="right"
                onResult={(ft) => handleScorePoint(currentMatch.id, currentMatch.player2Id, ft, isElim)}
                disabled={!!currentMatch.result}
              />
              <div className="flex justify-center" style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={() => handleUndoPoint(currentMatch.id, isElim)}
                  disabled={!currentMatch.scoreLog || currentMatch.scoreLog.filter(a => !a.undone).length === 0}
                  className="font-heading tracking-wider text-xs gap-1.5 text-muted-foreground hover:text-foreground/70 flex items-center gap-1.5 py-2 transition-opacity disabled:opacity-20"
                  style={{ opacity: 0.4 }}
                  title={!currentMatch.scoreLog || currentMatch.scoreLog.filter(a => !a.undone).length === 0 ? 'Nenhum ponto para desfazer' : 'Desfazer último ponto'}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                >
                  <Undo2 className="h-4 w-4" /> Desfazer último ponto
                </button>
              </div>
            </div>
          </div>
        ) : !shouldShowStartElimination ? (
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
        ) : null}

        {/* Pending queue */}
        {allPending.length > 1 && (
          <div className="space-y-2">
            <p className="font-heading text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              Fila ({allPending.length - 1} partida{allPending.length - 1 > 1 ? 's' : ''})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {allPending.slice(1).map(m => {
                const p1 = getPlayer(m.player1Id);
                const p2 = getPlayer(m.player2Id);
                if (!p1 || !p2) return null;
                return (
                  <div key={m.id} className="dark-panel p-2.5 flex items-center gap-2 text-xs">
                    <Avatar className="h-6 w-6 border border-primary/30">
                      {p1.avatar.startsWith('http') || p1.avatar.startsWith('data:') ? <AvatarImage src={p1.avatar} /> : <AvatarFallback className="bg-muted text-[8px]">{p1.avatar}</AvatarFallback>}
                    </Avatar>
                    <span className="text-muted-foreground font-heading italic">VS</span>
                    <Avatar className="h-6 w-6 border border-secondary/30">
                      {p2.avatar.startsWith('http') || p2.avatar.startsWith('data:') ? <AvatarImage src={p2.avatar} /> : <AvatarFallback className="bg-muted text-[8px]">{p2.avatar}</AvatarFallback>}
                    </Avatar>
                    <span className="ml-auto font-heading text-[10px] text-muted-foreground truncate">{p1.nickname || p1.name.split(' ')[0]} x {p2.nickname || p2.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
      </div>
    );
  }

  // ─── LIST VIEW ───
  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 relative">
      
      {/* Enrollment Modal */}
      {enrollModalTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setEnrollModal(null); setShowQuickAdd(false); setBatchSelected(new Set()); }}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10 glass-panel p-6 max-w-lg w-full max-h-[85vh] overflow-auto glow-blurple" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-primary tracking-wider">INSCREVER BLADERS</h2>
              <button onClick={() => { setEnrollModal(null); setShowQuickAdd(false); setBatchSelected(new Set()); }} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/30">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-body mb-4">{enrollModalTournament.name} — {enrollModalTournament.playerIds.length} inscritos</p>

            {!showQuickAdd ? (
              <Button variant="outline" size="sm" onClick={() => setShowQuickAdd(true)} className="w-full mb-4 font-heading tracking-wider gap-2 border-secondary/50 text-secondary hover:bg-secondary/10">
                <UserPlus className="h-4 w-4" /> Novo Blader (Cadastro Rápido)
              </Button>
            ) : (
              <div className="dark-panel p-4 mb-4 space-y-3 border border-secondary/30">
                <p className="font-heading text-sm font-bold text-secondary tracking-wider">CADASTRO RÁPIDO</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-heading text-[10px] text-muted-foreground">Nome</Label>
                    <Input value={qaName} onChange={e => setQaName(e.target.value)} placeholder="Nome" className="bg-muted/30 border-border h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-heading text-[10px] text-muted-foreground">Nick</Label>
                    <Input value={qaNick} onChange={e => setQaNick(e.target.value)} placeholder="@nick" className="bg-muted/30 border-border h-9 text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => qaFileRef.current?.click()} className={`h-9 w-9 flex items-center justify-center rounded-full border-2 border-dashed shrink-0 ${qaCustomAvatar ? 'border-primary' : 'border-muted hover:border-primary/50'}`}>
                    {qaCustomAvatar ? <img src={qaCustomAvatar} className="h-full w-full rounded-full object-cover" /> : <Camera className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <input ref={qaFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setQaCustomAvatar(r.result as string); setQaAvatar(''); }; r.readAsDataURL(f); } }} />
                  {DEFAULT_AVATARS.slice(0, 6).map(a => (
                    <button key={a} onClick={() => { setQaAvatar(a); setQaCustomAvatar(''); }}
                      className={`h-7 w-7 flex items-center justify-center text-sm rounded-lg border transition-all ${qaAvatar === a && !qaCustomAvatar ? 'border-primary bg-primary/10' : 'border-muted bg-card hover:border-primary/30'}`}>
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleQuickAdd} size="sm" className="font-heading tracking-wider gap-1 bg-secondary text-secondary-foreground flex-1">
                    <Plus className="h-3 w-3" /> Cadastrar e Inscrever
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowQuickAdd(false)} className="font-heading">Cancelar</Button>
                </div>
              </div>
            )}

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)} placeholder="Buscar blader..." className="pl-9 bg-muted/30 border-border h-9" />
            </div>

            {/* Batch select controls */}
            {(() => {
              const unenrolledFiltered = filteredPlayers.filter(p => !enrollModalTournament.playerIds.includes(p.id));
              const allBatchSelected = unenrolledFiltered.length > 0 && unenrolledFiltered.every(p => batchSelected.has(p.id));
              return unenrolledFiltered.length > 0 ? (
                <button
                  onClick={() => {
                    if (allBatchSelected) {
                      setBatchSelected(new Set());
                    } else {
                      setBatchSelected(new Set(unenrolledFiltered.map(p => p.id)));
                    }
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 border border-transparent mb-1 text-left"
                >
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${allBatchSelected ? 'bg-primary border-primary' : 'border-muted'}`}>
                    {allBatchSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-xs font-heading text-muted-foreground tracking-wider">Selecionar todos ({unenrolledFiltered.length})</span>
                </button>
              ) : null;
            })()}

            <div className="space-y-1.5 max-h-[40vh] overflow-auto">
              {filteredPlayers.map(p => {
                const enrolled = enrollModalTournament.playerIds.includes(p.id);
                const isSelected = batchSelected.has(p.id);
                return (
                  <button key={p.id} onClick={() => {
                    if (enrolled) {
                      // Toggle unenroll
                      handleEnroll(p.id);
                    } else {
                      // Toggle batch selection
                      setBatchSelected(prev => {
                        const next = new Set(prev);
                        if (next.has(p.id)) next.delete(p.id);
                        else next.add(p.id);
                        return next;
                      });
                    }
                  }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${enrolled ? 'bg-primary/10 border border-primary/30' : isSelected ? 'bg-secondary/10 border border-secondary/30' : 'hover:bg-muted/30 border border-transparent'}`}>
                    {!enrolled && (
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-secondary border-secondary' : 'border-muted'}`}>
                        {isSelected && <Check className="h-3 w-3 text-secondary-foreground" />}
                      </div>
                    )}
                    <Avatar className="h-9 w-9 border border-muted">
                      {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} /> : <AvatarFallback className="bg-muted text-sm">{p.avatar}</AvatarFallback>}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-foreground truncate">{p.name}</p>
                      {p.nickname && <p className="text-[10px] text-muted-foreground">@{p.nickname}</p>}
                    </div>
                    <EloBadge xp={p.xp || 0} size="sm" />
                    {enrolled && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
              {filteredPlayers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhum blader encontrado.</p>
              )}
            </div>

            {/* Batch enroll button */}
            {batchSelected.size > 0 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                <span className="text-xs text-muted-foreground font-body">
                  <Users className="h-3 w-3 inline mr-1" />
                  {batchSelected.size} selecionado{batchSelected.size !== 1 ? 's' : ''}
                </span>
                <Button
                  onClick={() => {
                    for (const pid of batchSelected) {
                      enrollPlayer(enrollModalTournament.id, pid);
                    }
                    toast.success(`${batchSelected.size} blader${batchSelected.size > 1 ? 's' : ''} inscrito${batchSelected.size > 1 ? 's' : ''}!`);
                    setBatchSelected(new Set());
                  }}
                  className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Inscrever selecionados
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-blurple pl-3 flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" /> TORNEIO
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/80">
          <Plus className="h-4 w-4" /> Criar Torneio
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-panel p-5 space-y-5 neon-line-magenta anim-fade-up">
          <h2 className="font-heading text-lg font-bold text-secondary tracking-wider">NOVO TORNEIO</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground text-xs tracking-wider">Nome do Torneio</Label>
              <Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ex: Copa Beyblade X" className="bg-muted/30 border-border h-11 font-body" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-heading text-muted-foreground text-xs tracking-wider">Data</Label>
                <Input type="date" value={tDate} onChange={e => setTDate(e.target.value)} className="bg-muted/30 border-border h-11 font-body arena-input-clean" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading text-muted-foreground text-xs tracking-wider">Máx. Jogadores</Label>
                <Input type="number" min={2} max={128} value={tMaxPlayers} onChange={e => setTMaxPlayers(parseInt(e.target.value) || 32)} className="bg-muted/30 border-border h-11 font-body arena-input-clean" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="font-heading text-muted-foreground text-xs tracking-wider">Fase Final</Label>
                <div className="flex gap-1.5 h-11 items-stretch">
                  {([null, 4, 8, 16] as EliminationSize[]).map(size => (
                    <button
                      key={String(size)}
                      onClick={() => setTEliminationSize(size)}
                      className={`flex-1 font-heading text-[11px] font-bold tracking-wider rounded-lg border-2 transition-all ${
                        tEliminationSize === size
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}
                    >
                      {size ? `TOP ${size}` : 'SEM'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleCreate} className="font-heading tracking-wider gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11 px-6">
              <Plus className="h-4 w-4" /> Criar e Publicar
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="font-heading tracking-wider h-11 text-muted-foreground">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Start config panel */}
      {startingTournament && (
        <div className="glass-panel p-5 space-y-5 neon-line-blurple anim-fade-up glow-blurple">
          <div>
            <h2 className="font-heading text-lg font-bold text-primary tracking-wider">INICIAR: {startingTournament.name}</h2>
            <p className="text-xs text-muted-foreground font-body mt-1">{(tournaments.find(t => t.id === startingTournament.id)?.playerIds.length) || startingTournament.playerIds.length} jogadores inscritos</p>
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
                  <button
                    key={String(size)}
                    onClick={() => setStartEliminationSize(size)}
                    className={`flex-1 font-heading text-[11px] font-bold tracking-wider rounded-lg border-2 transition-all ${
                      (startEliminationSize ?? startingTournament.eliminationSize) === size
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    {size ? `T${size}` : 'SEM'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleStartTournament} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground h-11 px-6">
              <Play className="h-4 w-4" /> INICIAR TORNEIO
            </Button>
            <Button variant="outline" onClick={() => setStartingTournament(null)} className="font-heading tracking-wider h-11">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Tournament List */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold tracking-wider text-muted-foreground">TORNEIOS AGENDADOS</h2>
        {tournaments.filter(t => t.status === 'upcoming').length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-body text-sm">Nenhum torneio criado ainda.</p>
          </div>
        ) : (
          tournaments.filter(t => t.status === 'upcoming').map((t, i) => (
            <div key={t.id} className="glass-panel p-4 anim-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-foreground italic">{t.name}</h3>
                    {t.eliminationSize && (
                      <span className="text-[9px] font-heading tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        TOP {t.eliminationSize}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 font-body">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.playerIds.length} inscritos</span>
                  </div>
                  {t.playerIds.length > 0 && (
                    <div className="flex -space-x-2 mt-2">
                      {t.playerIds.slice(0, 8).map(pid => {
                        const p = getPlayer(pid);
                        if (!p) return null;
                        return (
                          <Avatar key={pid} className="h-6 w-6 border border-card">
                            {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} /> : <AvatarFallback className="bg-muted text-[8px]">{p.avatar}</AvatarFallback>}
                          </Avatar>
                        );
                      })}
                      {t.playerIds.length > 8 && <span className="text-[10px] text-muted-foreground ml-2">+{t.playerIds.length - 8}</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" onClick={() => setEnrollModal(t.id)}
                    className="font-heading tracking-wider gap-1 bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/30">
                    <UserPlus className="h-3.5 w-3.5" /> Inscrever
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setStartingTournament(t); setStartEliminationSize(t.eliminationSize || null); }}
                    className="font-heading tracking-wider gap-1 border-primary/50 text-primary hover:bg-primary/10" disabled={t.playerIds.length < 2}>
                    <Play className="h-3.5 w-3.5" /> Iniciar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteTournament(t.id)}
                    className="font-heading tracking-wider gap-1 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog open={!!confirmDeleteTournament} onOpenChange={(open) => { if (!open) setConfirmDeleteTournament(null); }}
        title="Excluir Torneio" description="Tem certeza que deseja excluir este torneio? Esta ação não pode ser desfeita."
        confirmLabel="Excluir" onConfirm={handleDeleteTournament} />
    </div>
  );
}
