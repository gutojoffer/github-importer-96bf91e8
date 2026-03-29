import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveTournament, saveActiveTournament, getPlayers, saveCompletedTournament, calculateStandings, awardCircuitPoints } from '@/lib/storage';
import { generateSwissRound } from '@/lib/matchmaking';
import { Tournament, Match, Player, FinishType, FINISH_POINTS } from '@/types/tournament';
import VersusScreen from '@/components/VersusScreen';
import ResultButtons from '@/components/ResultButtons';
import ByeBanner from '@/components/ByeBanner';
import ArenaMiniatures from '@/components/ArenaMiniatures';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, Trophy, Award, XOctagon } from 'lucide-react';

export default function MatchArena() {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [victoryFlash, setVictoryFlash] = useState<string | null>(null);

  useEffect(() => {
    setTournament(getActiveTournament());
    setPlayers(getPlayers());
  }, []);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const handleEndTournament = () => {
    if (!tournament) return;

    // Calculate standings
    const standings = calculateStandings(tournament);

    // Award circuit points
    awardCircuitPoints(standings);

    // Save completed tournament with standings
    const completed: Tournament = {
      ...tournament,
      status: 'completed',
      finalStandings: standings,
    };
    saveCompletedTournament(completed);
    saveActiveTournament(null);

    toast.success('🏆 Torneio encerrado oficialmente!');
    navigate(`/history/${completed.id}`);
  };

  if (!tournament) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="font-heading text-xl text-muted-foreground">Nenhum torneio ativo</p>
          <Link to="/tournament"><Button className="font-heading">Criar Torneio</Button></Link>
        </div>
      </div>
    );
  }

  const currentRound = tournament.rounds[tournament.currentRound];
  if (!currentRound) return null;

  const arenaNames = Array.from({ length: tournament.arenaCount }, (_, i) =>
    `Arena ${String.fromCharCode(65 + i)}`
  );
  const arenaColors: ('red' | 'blue')[] = ['red', 'blue'];

  const handleScorePoint = (matchId: string, winnerId: string, finishType: FinishType) => {
    const matchIdx = currentRound.matches.findIndex(m => m.id === matchId);
    if (matchIdx === -1) return;
    const match = currentRound.matches[matchIdx];
    const pts = FINISH_POINTS[finishType];

    if (winnerId === match.player1Id) {
      match.player1Points += pts;
    } else {
      match.player2Points += pts;
    }

    const ptw = tournament.pointsToWin;
    if (match.player1Points >= ptw || match.player2Points >= ptw) {
      const matchWinnerId = match.player1Points >= ptw ? match.player1Id : match.player2Id;
      match.result = { winnerId: matchWinnerId, finishType };

      const winner = getPlayer(matchWinnerId);
      setVictoryFlash(winner?.nickname ? `@${winner.nickname.replace(/^@/, '')}` : winner?.name || 'WINNER');
      setTimeout(() => setVictoryFlash(null), 1800);

      const allDone = currentRound.matches.every(m => m.result);
      if (allDone) {
        currentRound.completed = true;
        if (tournament.currentRound + 1 < tournament.totalRounds) {
          const nextRound = generateSwissRound({ ...tournament, currentRound: tournament.currentRound + 1 });
          if (nextRound) {
            tournament.rounds.push(nextRound);
            tournament.currentRound++;
            toast.success(`Rodada ${tournament.currentRound + 1} gerada!`);
          }
        } else {
          toast.info('Todas as rodadas concluídas! Encerre o torneio oficialmente.');
        }
      }
    }

    saveActiveTournament({ ...tournament });
    setTournament({ ...tournament });
  };

  const pendingByArena = (arenaIdx: number) =>
    currentRound.matches.filter(m => m.arenaIndex === arenaIdx && !m.result && !m.isBye);

  const completedByArena = (arenaIdx: number) =>
    currentRound.matches.filter(m => m.arenaIndex === arenaIdx && m.result && !m.isBye);

  const allPendingNonCurrent = currentRound.matches.filter(m => !m.result && !m.isBye);
  const byePlayer = currentRound.byePlayerId ? getPlayer(currentRound.byePlayerId) : null;
  const allMatchesDone = currentRound.matches.every(m => m.result || m.isBye);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Victory Flash */}
      {victoryFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center animate-slide-in">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="font-heading text-4xl font-bold text-primary tracking-widest text-glow-cyan">{victoryFlash}</p>
            <p className="font-heading text-lg text-muted-foreground mt-2">WINNER!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-wide text-primary text-glow-cyan">{tournament.name}</h1>
          <p className="text-xs text-muted-foreground font-body">
            Rodada {tournament.currentRound + 1} de {tournament.totalRounds}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-heading">PTS TO WIN: {tournament.pointsToWin}</span>
          </div>
          <Button
            onClick={handleEndTournament}
            className="font-heading tracking-wide gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 glow-magenta"
          >
            <XOctagon className="h-4 w-4" /> Encerrar Torneio
          </Button>
        </div>
      </div>

      {/* Bye Banner */}
      {byePlayer && <ByeBanner player={byePlayer} />}

      {/* Arena Panels */}
      <div className={`grid gap-4 ${tournament.arenaCount >= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {arenaNames.map((arenaName, arenaIdx) => {
          const pending = pendingByArena(arenaIdx);
          const completed = completedByArena(arenaIdx);
          const currentMatch = pending[0];
          const color = arenaColors[arenaIdx % arenaColors.length];

          return (
            <div key={arenaIdx} className="glass-panel rounded-lg space-y-3">
              {currentMatch && players.length > 0 ? (
                <div className="space-y-3 p-3">
                  <VersusScreen
                    player1={getPlayer(currentMatch.player1Id)!}
                    player2={getPlayer(currentMatch.player2Id)!}
                    arenaName={arenaName}
                    arenaColor={color}
                    player1Points={currentMatch.player1Points}
                    player2Points={currentMatch.player2Points}
                    pointsToWin={tournament.pointsToWin}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <ResultButtons
                      playerName={getPlayer(currentMatch.player1Id)?.nickname || getPlayer(currentMatch.player1Id)?.name || ''}
                      side="left"
                      onResult={(ft) => handleScorePoint(currentMatch.id, currentMatch.player1Id, ft)}
                      disabled={!!currentMatch.result}
                    />
                    <ResultButtons
                      playerName={getPlayer(currentMatch.player2Id)?.nickname || getPlayer(currentMatch.player2Id)?.name || ''}
                      side="right"
                      onResult={(ft) => handleScorePoint(currentMatch.id, currentMatch.player2Id, ft)}
                      disabled={!!currentMatch.result}
                    />
                  </div>
                  {pending.length > 1 && (
                    <p className="text-[10px] text-muted-foreground text-center font-heading tracking-wider">
                      +{pending.length - 1} MATCH(ES) IN QUEUE
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 px-4">
                  <CheckCircle className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="font-heading text-sm text-muted-foreground">{arenaName} — All matches completed</p>
                </div>
              )}

              {completed.length > 0 && (
                <div className="px-3 pb-3 space-y-1">
                  <p className="font-heading text-[10px] text-muted-foreground tracking-widest uppercase">Results</p>
                  {completed.map(m => {
                    const winner = getPlayer(m.result!.winnerId);
                    const loserId = m.player1Id === m.result!.winnerId ? m.player2Id : m.player1Id;
                    const loser = getPlayer(loserId);
                    return (
                      <div key={m.id} className="flex items-center gap-2 p-1.5 glass-panel rounded text-xs">
                        <span className="font-heading font-bold text-primary truncate">{winner?.nickname || winner?.name}</span>
                        <span className="text-muted-foreground">def.</span>
                        <span className="text-muted-foreground truncate">{loser?.nickname || loser?.name}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground uppercase font-heading">{m.result!.finishType}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ArenaMiniatures
        pendingMatches={allPendingNonCurrent.filter(m => !pendingByArena(0)[0]?.id || m.id !== pendingByArena(0)[0]?.id)}
        getPlayer={(id) => getPlayer(id)}
        arenaNames={arenaNames}
      />
    </div>
  );
}
