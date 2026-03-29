import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPlayers, getWeeklyLeaderboard, getMonthlyLeaderboard, getActiveTournament } from '@/lib/storage';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Swords, Crown } from 'lucide-react';

const Index = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [weeklyLB, setWeeklyLB] = useState<{ playerId: string; points: number; wins: number; losses: number }[]>([]);
  const [monthlyLB, setMonthlyLB] = useState<{ playerId: string; points: number; wins: number; losses: number }[]>([]);
  const activeTournament = getActiveTournament();

  useEffect(() => {
    setPlayers(getPlayers());
    setWeeklyLB(getWeeklyLeaderboard());
    setMonthlyLB(getMonthlyLeaderboard());
  }, []);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const renderLeaderboard = (data: typeof weeklyLB) => {
    if (data.length === 0) {
      return <p className="text-center text-muted-foreground py-8 font-body text-sm">Nenhum dado de ranking ainda. Jogue torneios para aparecer aqui!</p>;
    }
    return (
      <div className="space-y-2">
        {data.slice(0, 10).map((entry, i) => {
          const player = getPlayer(entry.playerId);
          if (!player) return null;
          return (
            <div key={entry.playerId} className={`flex items-center gap-3 p-3 border border-border bg-card/50 ${i < 3 ? 'border-primary/30' : ''}`}>
              <span className={`font-heading text-lg font-bold w-8 text-center ${i === 0 ? 'text-secondary' : i === 1 ? 'text-primary' : i === 2 ? 'text-accent' : 'text-muted-foreground'}`}>
                {i === 0 ? <Crown className="h-5 w-5 inline" /> : `#${i + 1}`}
              </span>
              <Avatar className="h-8 w-8 border border-primary/20">
                {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                  <AvatarImage src={player.avatar} alt={player.name} />
                ) : (
                  <AvatarFallback className="bg-muted text-sm">{player.avatar}</AvatarFallback>
                )}
              </Avatar>
              <span className="font-heading font-bold flex-1">{player.nickname || player.name}</span>
              <span className="text-secondary font-heading font-bold">{entry.points} pts</span>
              <span className="text-xs text-muted-foreground font-body">{entry.wins}W/{entry.losses}L</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="border border-border bg-card p-4 text-center">
          <Users className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="font-heading text-2xl font-bold">{players.length}</p>
          <p className="text-xs text-muted-foreground font-body">Jogadores</p>
        </div>
        <div className="border border-border bg-card p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto text-secondary mb-1" />
          <p className="font-heading text-2xl font-bold">{activeTournament ? 1 : 0}</p>
          <p className="text-xs text-muted-foreground font-body">Torneio Ativo</p>
        </div>
        <div className="border border-border bg-card p-4 text-center col-span-2 sm:col-span-1">
          <Swords className="h-6 w-6 mx-auto text-accent mb-1" />
          <p className="font-heading text-2xl font-bold">
            {activeTournament ? activeTournament.rounds.reduce((sum, r) => sum + r.matches.filter(m => m.result).length, 0) : 0}
          </p>
          <p className="text-xs text-muted-foreground font-body">Partidas Jogadas</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/players"><Button className="font-heading tracking-wide gap-2"><Users className="h-4 w-4" /> Cadastrar Jogador</Button></Link>
        <Link to="/tournament"><Button variant="outline" className="font-heading tracking-wide gap-2 border-secondary text-secondary hover:bg-secondary/10"><Trophy className="h-4 w-4" /> Novo Torneio</Button></Link>
        {activeTournament && (
          <Link to="/arena"><Button variant="outline" className="font-heading tracking-wide gap-2 border-accent text-accent hover:bg-accent/10"><Swords className="h-4 w-4" /> Ir para Arena</Button></Link>
        )}
      </div>

      <div>
        <h2 className="font-heading text-2xl font-bold mb-4 tracking-wide flex items-center gap-2">
          <Crown className="h-6 w-6 text-secondary" /> Rankings
        </h2>
        <Tabs defaultValue="weekly">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="weekly" className="font-heading tracking-wide">Top Semanal</TabsTrigger>
            <TabsTrigger value="monthly" className="font-heading tracking-wide">Top Mensal</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="mt-4">{renderLeaderboard(weeklyLB)}</TabsContent>
          <TabsContent value="monthly" className="mt-4">{renderLeaderboard(monthlyLB)}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
