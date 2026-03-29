import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPlayers, getWeeklyLeaderboard, getMonthlyLeaderboard } from '@/lib/storage';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [weeklyLB, setWeeklyLB] = useState<{ playerId: string; points: number; wins: number; losses: number }[]>([]);
  const [monthlyLB, setMonthlyLB] = useState<{ playerId: string; points: number; wins: number; losses: number }[]>([]);

  useEffect(() => {
    setPlayers(getPlayers());
    setWeeklyLB(getWeeklyLeaderboard());
    setMonthlyLB(getMonthlyLeaderboard());
  }, []);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const renderLeaderboard = (data: typeof weeklyLB) => {
    if (data.length === 0) {
      return <p className="text-center text-muted-foreground py-12 font-body">Nenhum dado ainda. Jogue torneios!</p>;
    }
    return (
      <div className="space-y-2">
        {data.map((entry, i) => {
          const player = getPlayer(entry.playerId);
          if (!player) return null;
          return (
            <div key={entry.playerId} className={`flex items-center gap-3 p-4 border border-border bg-card/50 ${i < 3 ? 'border-primary/30' : ''}`}>
              <span className={`font-heading text-xl font-bold w-10 text-center ${i === 0 ? 'text-secondary' : i === 1 ? 'text-primary' : i === 2 ? 'text-accent' : 'text-muted-foreground'}`}>
                {i === 0 ? <Crown className="h-6 w-6 inline" /> : `#${i + 1}`}
              </span>
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                  <AvatarImage src={player.avatar} alt={player.name} />
                ) : (
                  <AvatarFallback className="bg-muted text-lg">{player.avatar}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold truncate">{player.name}</p>
                <p className="text-xs text-muted-foreground font-body">
                  {player.nickname && `@${player.nickname.replace(/^@/,'')} · `}
                  {entry.wins} Wins
                </p>
              </div>
              <span className="text-secondary font-heading text-xl font-bold">{entry.points}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-primary flex items-center gap-2">
        <Crown className="h-8 w-8 text-secondary" /> Rankings
      </h1>
      <Tabs defaultValue="weekly">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="weekly" className="font-heading tracking-wider text-xs">TOP SEMANAL</TabsTrigger>
          <TabsTrigger value="monthly" className="font-heading tracking-wider text-xs">TOP MENSAL</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-4">{renderLeaderboard(weeklyLB)}</TabsContent>
        <TabsContent value="monthly" className="mt-4">{renderLeaderboard(monthlyLB)}</TabsContent>
      </Tabs>
    </div>
  );
}
