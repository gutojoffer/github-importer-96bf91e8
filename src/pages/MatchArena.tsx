import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActiveTournament, saveActiveTournament, getPlayers, saveCompletedTournament, calculateStandings, awardXP } from '@/lib/storage';
import { generateSwissRound } from '@/lib/matchmaking';
import { Tournament, Player, FinishType, FINISH_POINTS } from '@/types/tournament';
import VersusScreen from '@/components/VersusScreen';
import ResultButtons from '@/components/ResultButtons';
import ByeBanner from '@/components/ByeBanner';
import ArenaMiniatures from '@/components/ArenaMiniatures';
import TournamentHUD from '@/components/TournamentHUD';
import VictorySplash from '@/components/VictorySplash';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, Award, XOctagon } from 'lucide-react';

export default function MatchArena() {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [victoryWinner, setVictoryWinner] = useState<Player | null>(null);
  const [victoryFinish, setVictoryFinish] = useState<string | undefined>();
  const [vsKey, setVsKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setTournament(await getActiveTournament());
      setPlayers(await getPlayers());
    };
    load();
  }, []);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const handleEndTournament = async () => {
    if (!tournament) return;
    const standings = calculateStandings(tournament);
    await awardXP(standings);
    const completed: Tournament = { ...tournament, status: 'completed', finalStandings: standings };
    await saveCompletedTournament(completed);
    toast.success('🏆 Torneio encerrado!');
    navigate(`/history/${completed.id}`);
  };

  if (!tournament) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="font-heading text-xl text-muted-foreground italic">Nenhum torneio ativo</p>
          <Link to="/admin"><Button className="font-heading tracking-wider">Painel Admin</Button></Link>
        </div>
      </div>
    );
  }

  const currentRound = tournament.rounds[tournament.currentRound];
  if (!currentRound) return null;

  const arenaNames = Array.from({ length: tournament.arenaCount }, (_, i) => `Arena ${String.fromCharCode(65 + i)}`);

  const handleScorePoint = async (matchId: string, winnerId: string, finishType: FinishType) => {
    const matchIdx = currentRound.matches.findIndex(m => m.id === matchId);
    if (matchIdx === -1) return;
    const match = currentRound.matches[matchIdx];
    const pts = FINISH_POINTS[finishType];

    if (winnerId === match.player1Id) match.player1Points += pts;
    else match.player2Points += pts;

    const ptw = tournament.pointsToWin;
    if (match.player1Points >= ptw || match.player2Points >= ptw) {
      const matchWinnerId = match.player1Points >= ptw ? match.player1Id : match.player2Id;
      match.result = { winnerId: matchWinnerId, finishType };

      const winner = getPlayer(matchWinnerId);
      if (winner) {
        setVictoryWinner(winner);
        setVictoryFinish(finishType);
      }
      setTimeout(() => {
        setVictoryWinner(null);
        setVictoryFinish(undefined);
        setVsKey(k => k + 1);
      }, 3500);

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
          toast.info('Todas as rodadas concluídas! Encerre o torneio.');
        }
      }
    }

    await saveActiveTournament({ ...tournament });
    setTournament({ ...tournament });
  };

  const pendingByArena = (arenaIdx: number) => currentRound.matches.filter(m => m.arenaIndex === arenaIdx && !m.result && !m.isBye);
  const completedByArena = (arenaIdx: number) => currentRound.matches.filter(m => m.arenaIndex === arenaIdx && m.result && !m.isBye);
  const allNonBye = currentRound.matches.filter(m => !m.isBye);
  const allPending = allNonBye.filter(m => !m.result);
  const byePlayer = currentRound.byePlayerId ? getPlayer(currentRound.byePlayerId) : null;

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-4">
      {victoryWinner && <VictorySplash winner={victoryWinner} finishType={victoryFinish} />}

      <TournamentHUD tournament={tournament} pendingCount={allPending.length} totalMatches={allNonBye.length} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="crimson-line pl-3">
          <h1 className="font-heading text-2xl font-bold tracking-wider text-foreground italic">{tournament.name}</h1>
          <p className="text-xs text-muted-foreground font-body">Rodada {tournament.currentRound + 1} de {tournament.totalRounds}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-heading flex items-center gap-1">
            <Award className="h-3 w-3" /> PTS TO WIN: {tournament.pointsToWin}
          </span>
          <Button onClick={handleEndTournament} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/80">
            <XOctagon className="h-4 w-4" /> Encerrar
          </Button>
        </div>
      </div>

      {byePlayer && <ByeBanner player={byePlayer} />}

      <div className={`grid gap-4 ${tournament.arenaCount >= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {arenaNames.map((arenaName, arenaIdx) => {
          const pending = pendingByArena(arenaIdx);
          const completed = completedByArena(arenaIdx);
          const currentMatch = pending[0];

          return (
            <div key={arenaIdx} className="dark-panel space-y-3">
              {currentMatch && players.length > 0 ? (
                <div className="space-y-3 p-3" key={`${currentMatch.id}-${vsKey}`}>
                  <VersusScreen
                    player1={getPlayer(currentMatch.player1Id)!}
                    player2={getPlayer(currentMatch.player2Id)!}
                    arenaName={arenaName}
                    arenaColor={arenaIdx % 2 === 0 ? 'red' : 'blue'}
                    player1Points={currentMatch.player1Points}
                    player2Points={currentMatch.player2Points}
                    pointsToWin={tournament.pointsToWin}
                  />
                  <div className="grid grid-cols-2 gap-3 px-1">
                    <ResultButtons playerName={getPlayer(currentMatch.player1Id)?.nickname || getPlayer(currentMatch.player1Id)?.name || ''} side="left" onResult={(ft) => handleScorePoint(currentMatch.id, currentMatch.player1Id, ft)} disabled={!!currentMatch.result} />
                    <ResultButtons playerName={getPlayer(currentMatch.player2Id)?.nickname || getPlayer(currentMatch.player2Id)?.name || ''} side="right" onResult={(ft) => handleScorePoint(currentMatch.id, currentMatch.player2Id, ft)} disabled={!!currentMatch.result} />
                  </div>
                  {pending.length > 1 && (
                    <p className="text-[10px] text-muted-foreground text-center font-heading tracking-[0.2em]">+{pending.length - 1} MATCH(ES) IN QUEUE</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle className="h-8 w-8 mx-auto text-accent mb-2" />
                  <p className="font-heading text-sm text-muted-foreground">{arenaName} — Completo</p>
                </div>
              )}

              {completed.length > 0 && (
                <div className="px-3 pb-3 space-y-1">
                  <p className="font-heading text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Resultados</p>
                  {completed.map(m => {
                    const winner = getPlayer(m.result!.winnerId);
                    const loserId = m.player1Id === m.result!.winnerId ? m.player2Id : m.player1Id;
                    const loser = getPlayer(loserId);
                    return (
                      <div key={m.id} className="flex items-center gap-2 p-1.5 bg-muted/30 text-xs">
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

      <ArenaMiniatures pendingMatches={allPending.slice(tournament.arenaCount)} getPlayer={getPlayer} arenaNames={arenaNames} />
    </div>
  );
}
