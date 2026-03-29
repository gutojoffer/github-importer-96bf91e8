import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getPlayers } from '@/lib/storage';
import { Tournament, Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Swords, Calendar, Users, ChevronRight } from 'lucide-react';

const Index = () => {
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setPlayers(getPlayers());
    const all = getTournaments();
    setUpcoming(all.filter(t => t.status === 'upcoming'));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Swords className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-[0.15em] text-foreground italic">
            BLADER HUB X
          </h1>
          <p className="font-heading text-sm text-muted-foreground tracking-[0.3em] mt-2 uppercase">
            Tournament Management System
          </p>
          <div className="w-24 h-[2px] bg-primary mx-auto mt-6" />
        </div>
      </section>

      {/* Upcoming Tournaments */}
      <section className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        <h2 className="font-heading text-2xl font-bold tracking-wider text-foreground flex items-center gap-2 crimson-line pl-3">
          PRÓXIMOS TORNEIOS
        </h2>

        {upcoming.length === 0 ? (
          <div className="dark-panel p-12 text-center">
            <Swords className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-body text-sm">Nenhum torneio agendado no momento.</p>
            <p className="text-muted-foreground font-body text-xs mt-1">Organizadores podem criar torneios no painel Admin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((t, i) => {
              const registeredPlayers = t.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
              const spotsLeft = (t.maxPlayers || 32) - t.playerIds.length;
              return (
                <div key={t.id} className="dark-panel p-0 overflow-hidden anim-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="border-l-4 border-primary p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl font-bold text-foreground italic tracking-wide">{t.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-body">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {t.playerIds.length} / {t.maxPlayers || 32} inscritos
                          </span>
                        </div>

                        {/* Registered avatars */}
                        {registeredPlayers.length > 0 && (
                          <div className="flex items-center mt-3 -space-x-2">
                            {registeredPlayers.slice(0, 6).map(p => (
                              <Avatar key={p.id} className="h-7 w-7 border-2 border-card">
                                {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? (
                                  <AvatarImage src={p.avatar} alt={p.name} />
                                ) : (
                                  <AvatarFallback className="bg-muted text-[10px]">{p.avatar}</AvatarFallback>
                                )}
                              </Avatar>
                            ))}
                            {registeredPlayers.length > 6 && (
                              <span className="text-[10px] text-muted-foreground ml-3 font-heading">+{registeredPlayers.length - 6}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <Link to={`/signup/${t.id}`}>
                        <Button
                          className="font-heading tracking-wider gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 h-12 px-6"
                          disabled={spotsLeft <= 0}
                        >
                          {spotsLeft > 0 ? 'INSCREVER-SE' : 'LOTADO'}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    {spotsLeft > 0 && spotsLeft <= 5 && (
                      <p className="text-[10px] text-primary font-heading mt-2 tracking-wider">
                        ⚠ APENAS {spotsLeft} VAGA{spotsLeft > 1 ? 'S' : ''} RESTANTE{spotsLeft > 1 ? 'S' : ''}
                      </p>
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
