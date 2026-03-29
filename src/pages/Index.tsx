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
      return <p className="text-center text-muted-foreground py-8 font-body text-sm">Nenhum dado de ranking ainda. Jogue torneios!</p>;
    }
    return (
      <div className="space-y-2">
        {data.slice(0, 10).map((entry, i) => {
          const player = getPlayer(entry.playerId);
          if (!player) return null;
          return (
            <div key={entry.playerId} className={`flex items-center gap-3 p-3 rounded-lg glass-panel animate-slide-in ${i < 3 ? 'glow-cyan' : ''}`}>
              <span className={`font-heading text-lg font-bold w-8 text-center ${
                i === 0 ? 'text-primary text-glow-cyan' :
                i === 1 ? 'text-secondary' :
                i === 2 ? 'text-accent' :
                'text-muted-foreground'
              }`}>
                {i === 0 ? <Crown className="h-5 w-5 inline" /> : `#${i + 1}`}
              </span>
              <Avatar className="h-8 w-8 border border-primary/20">
                {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                  <AvatarImage src={player.avatar} alt={player.name} />
                ) : (
                  <AvatarFallback className="bg-muted text-sm">{player.avatar}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="font-heading font-bold truncate block">{player.name}</span>
                {player.nickname && <span className="text-[10px] text-muted-foreground">@{player.nickname.replace(/^@/,'')}</span>}
              </div>
              <span className="text-xs text-muted-foreground font-body">{entry.wins} Wins</span>
              <span className="text-primary font-heading font-bold">{entry.points}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className="flex items-center justify-center gap-4 py-6">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold tracking-[0.2em] text-primary text-glow-cyan">
            BLADER HUB X
          </h1>
          <p className="text-xs text-muted-foreground font-heading tracking-[0.3em] mt-1">
            TOURNAMENT MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-lg p-4 text-center">
          <Users className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="font-heading text-2xl font-bold text-foreground">{players.length}</p>
          <p className="text-xs text-muted-foreground font-body">Bladers</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto text-secondary mb-1" />
          <p className="font-heading text-2xl font-bold text-foreground">{activeTournament ? 1 : 0}</p>
          <p className="text-xs text-muted-foreground font-body">Torneio Ativo</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <Swords className="h-6 w-6 mx-auto text-accent mb-1" />
          <p className="font-heading text-2xl font-bold text-foreground">
            {activeTournament ? activeTournament.rounds.reduce((sum, r) => sum + r.matches.filter(m => m.result).length, 0) : 0}
          </p>
          <p className="text-xs text-muted-foreground font-body">Partidas</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/players">
          <Button className="font-heading tracking-wide gap-2 glow-cyan">
            <Users className="h-4 w-4" /> Cadastrar Blader
          </Button>
        </Link>
        <Link to="/tournament">
          <Button variant="outline" className="font-heading tracking-wide gap-2 border-secondary text-secondary hover:bg-secondary/10">
            <Trophy className="h-4 w-4" /> Novo Torneio
          </Button>
        </Link>
        {activeTournament && (
          <Link to="/arena">
            <Button variant="outline" className="font-heading tracking-wide gap-2 border-accent text-accent hover:bg-accent/10">
              <Swords className="h-4 w-4" /> Ir para Arena
            </Button>
          </Link>
        )}
      </div>

      {/* Rankings */}
      <div>
        <h2 className="font-heading text-2xl font-bold mb-4 tracking-wide flex items-center gap-2 text-foreground">
          <Crown className="h-6 w-6 text-primary" /> Rankings
        </h2>
        <Tabs defaultValue="weekly">
          <TabsList className="bg-muted/50 border border-border rounded-lg">
            <TabsTrigger value="weekly" className="font-heading tracking-wider text-xs data-[state=active]:text-primary">TOP SEMANAL</TabsTrigger>
            <TabsTrigger value="monthly" className="font-heading tracking-wider text-xs data-[state=active]:text-primary">TOP MENSAL</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="mt-4">{renderLeaderboard(weeklyLB)}</TabsContent>
          <TabsContent value="monthly" className="mt-4">{renderLeaderboard(monthlyLB)}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
