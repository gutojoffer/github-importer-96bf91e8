import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getPlayers } from '@/lib/storage';
import { Tournament, Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Users, ChevronRight } from 'lucide-react';

const Index = () => {
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const load = async () => {
      setPlayers(await getPlayers());
      const all = await getTournaments();
      setUpcoming(all.filter(t => t.status === 'upcoming'));
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/3 to-transparent" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Trophy className="h-12 w-12 text-primary" />
              <div className="absolute -inset-2 bg-primary/10 rounded-full blur-md anim-glow-pulse" />
            </div>
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-[0.15em] text-foreground italic">BLADER HUB X</h1>
          <p className="font-heading text-sm text-muted-foreground tracking-[0.3em] mt-2 uppercase">Tournament Management System</p>
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        <h2 className="font-heading text-2xl font-bold tracking-wider text-foreground flex items-center gap-2 neon-line-cyan pl-3">PRÓXIMOS TORNEIOS</h2>
        {upcoming.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-body text-sm">Nenhum torneio agendado no momento.</p>
            <p className="text-muted-foreground font-body text-xs mt-1">Organizadores podem criar torneios na aba Torneio.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((t, i) => {
              const registeredPlayers = t.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
              const spotsLeft = (t.maxPlayers || 32) - t.playerIds.length;
              return (
                <div key={t.id} className="glass-panel p-0 overflow-hidden anim-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="neon-line-cyan p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl font-bold text-foreground italic tracking-wide">{t.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-body">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.playerIds.length} / {t.maxPlayers || 32} inscritos</span>
                        </div>
                        {registeredPlayers.length > 0 && (
                          <div className="flex items-center mt-3 -space-x-2">
                            {registeredPlayers.slice(0, 6).map(p => (
                              <Avatar key={p.id} className="h-7 w-7 border-2 border-card">
                                {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} alt={p.name} /> : <AvatarFallback className="bg-muted text-[10px]">{p.avatar}</AvatarFallback>}
                              </Avatar>
                            ))}
                            {registeredPlayers.length > 6 && <span className="text-[10px] text-muted-foreground ml-3 font-heading">+{registeredPlayers.length - 6}</span>}
                          </div>
                        )}
                      </div>
                      <Link to={`/signup/${t.id}`}>
                        <Button className="font-heading tracking-wider gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 h-12 px-6" disabled={spotsLeft <= 0}>
                          {spotsLeft > 0 ? 'INSCREVER-SE' : 'LOTADO'}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    {spotsLeft > 0 && spotsLeft <= 5 && (
                      <p className="text-[10px] text-secondary font-heading mt-2 tracking-wider">⚠ APENAS {spotsLeft} VAGA{spotsLeft > 1 ? 'S' : ''} RESTANTE{spotsLeft > 1 ? 'S' : ''}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
