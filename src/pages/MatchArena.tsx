import { useState, useEffect } from 'react';
import { getActiveTournament, saveActiveTournament, getPlayers, updatePlayerStats } from '@/lib/storage';
import { generateSwissRound } from '@/lib/matchmaking';
import { Tournament, Match, Player, FinishType } from '@/types/tournament';
import VersusScreen from '@/components/VersusScreen';
import ResultButtons from '@/components/ResultButtons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, ArrowRight, Trophy } from 'lucide-react';

export default function MatchArena() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedResult, setSelectedResult] = useState<{ matchId: string; winnerId: string; finishType: FinishType } | null>(null);
  const [victoryFlash, setVictoryFlash] = useState<string | null>(null);

  useEffect(() => {
    setTournament(getActiveTournament());
    setPlayers(getPlayers());
  }, []);

  const getPlayer = (id: string) => players.find(p => p.id === id)!;

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <p className="font-heading text-xl text-muted-foreground">Nenhum torneio ativo</p>
        <Link to="/tournament"><Button className="font-heading">Criar Torneio</Button></Link>
      </div>
    );
  }

  const currentRound = tournament.rounds[tournament.currentRound];
  if (!currentRound) return null;

  const arenaNames = Array.from({ length: tournament.arenaCount }, (_, i) => `Arena ${String.fromCharCode(65 + i)}`);

  const handleSelectResult = (matchId: string, winnerId: string, finishType: FinishType) => {
    setSelectedResult({ matchId, winnerId, finishType });
  };

  const handleConfirm = () => {
    if (!selectedResult) return;

    const { matchId, winnerId, finishType } = selectedResult;
    const match = currentRound.matches.find(m => m.id === matchId)!;
    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;

    // Update match result
    match.result = { winnerId, finishType };

    // Update stats
    const isExtreme = finishType === 'extreme';
    updatePlayerStats(winnerId, true, isExtreme);
    updatePlayerStats(loserId, false, false);

    // Flash victory
    const winner = getPlayer(winnerId);
    setVictoryFlash(winner?.nickname || winner?.name || 'Vencedor');
    setTimeout(() => setVictoryFlash(null), 1500);

    // Check if round is complete
    const allDone = currentRound.matches.every(m => m.result);
    if (allDone) {
      currentRound.completed = true;

      if (tournament.currentRound + 1 < tournament.totalRounds) {
        // Generate next round (Swiss)
        const nextRound = generateSwissRound({ ...tournament, currentRound: tournament.currentRound + 1 });
        if (nextRound) {
          tournament.rounds.push(nextRound);
          tournament.currentRound++;
          toast.success(`Rodada ${tournament.currentRound + 1} gerada!`);
        }
      } else {
        tournament.status = 'completed';
        toast.success('🏆 Torneio finalizado!');
      }
    }

    saveActiveTournament({ ...tournament });
    setTournament({ ...tournament });
    setSelectedResult(null);
  };

  const pendingMatchesByArena = (arenaIdx: number) =>
    currentRound.matches.filter(m => m.arenaIndex === arenaIdx && !m.result);

  const completedMatchesByArena = (arenaIdx: number) =>
    currentRound.matches.filter(m => m.arenaIndex === arenaIdx && m.result);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-4">
      {/* Victory Flash */}
      {victoryFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center animate-slide-in">
            <Trophy className="h-16 w-16 mx-auto text-secondary mb-4" />
            <p className="font-heading text-4xl font-bold text-secondary tracking-widest">{victoryFlash}</p>
            <p className="font-heading text-lg text-muted-foreground mt-2">VENCEU!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-wide text-primary">{tournament.name}</h1>
          <p className="text-xs text-muted-foreground font-body">
            Rodada {tournament.currentRound + 1} de {tournament.totalRounds}
            {tournament.status === 'completed' && ' — FINALIZADO'}
          </p>
        </div>
      </div>

      {/* Arena Tabs */}
      <Tabs defaultValue="0">
        <TabsList className="bg-muted border border-border">
          {arenaNames.map((name, i) => (
            <TabsTrigger key={i} value={String(i)} className="font-heading tracking-wide">
              {name}
              {pendingMatchesByArena(i).length > 0 && (
                <span className="ml-1 text-xs text-accent">({pendingMatchesByArena(i).length})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {arenaNames.map((arenaName, arenaIdx) => {
          const pending = pendingMatchesByArena(arenaIdx);
          const completed = completedMatchesByArena(arenaIdx);
          const currentMatch = pending[0];

          return (
            <TabsContent key={arenaIdx} value={String(arenaIdx)} className="mt-4 space-y-4">
              {currentMatch && players.length > 0 ? (
                <div className="border border-border bg-card p-4 space-y-6">
                  <VersusScreen
                    player1={getPlayer(currentMatch.player1Id)}
                    player2={getPlayer(currentMatch.player2Id)}
                    arenaName={arenaName}
                  />

                  {/* Judge Interface */}
                  <div className="grid grid-cols-2 gap-4">
                    <ResultButtons
                      playerName={getPlayer(currentMatch.player1Id)?.nickname || getPlayer(currentMatch.player1Id)?.name}
                      side="left"
                      onResult={(ft) => handleSelectResult(currentMatch.id, currentMatch.player1Id, ft)}
                      disabled={!!selectedResult && selectedResult.matchId !== currentMatch.id}
                    />
                    <ResultButtons
                      playerName={getPlayer(currentMatch.player2Id)?.nickname || getPlayer(currentMatch.player2Id)?.name}
                      side="right"
                      onResult={(ft) => handleSelectResult(currentMatch.id, currentMatch.player2Id, ft)}
                      disabled={!!selectedResult && selectedResult.matchId !== currentMatch.id}
                    />
                  </div>

                  {selectedResult && selectedResult.matchId === currentMatch.id && (
                    <Button onClick={handleConfirm} className="w-full h-12 font-heading text-lg tracking-widest gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      <CheckCircle className="h-5 w-5" /> CONFIRMAR RESULTADO
                    </Button>
                  )}

                  {pending.length > 1 && (
                    <p className="text-xs text-muted-foreground text-center font-body">
                      +{pending.length - 1} partida(s) na fila desta arena
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-border bg-card">
                  <CheckCircle className="h-8 w-8 mx-auto text-secondary mb-2" />
                  <p className="font-heading text-lg text-muted-foreground">Todas as partidas desta arena foram concluídas!</p>
                </div>
              )}

              {/* Completed matches */}
              {completed.length > 0 && (
                <div className="space-y-2">
                  <p className="font-heading text-sm text-muted-foreground tracking-wide">Resultados</p>
                  {completed.map(m => {
                    const winner = getPlayer(m.result!.winnerId);
                    const loser = getPlayer(m.player1Id === m.result!.winnerId ? m.player2Id : m.player1Id);
                    return (
                      <div key={m.id} className="flex items-center gap-2 p-2 border border-border bg-card/50 text-sm">
                        <span className="font-heading font-bold text-secondary">{winner?.nickname || winner?.name}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{loser?.nickname || loser?.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground capitalize font-body">{m.result!.finishType}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
