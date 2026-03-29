import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTournaments, saveTournaments, getPlayers, saveActiveTournament, createUpcomingTournament } from '@/lib/storage';
import { Tournament, Player } from '@/types/tournament';
import { suggestRounds, generateFirstRound } from '@/lib/matchmaking';
import PlayerCard from '@/components/PlayerCard';
import { Plus, Play, Lightbulb, Calendar, Users, Eye, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [tName, setTName] = useState('');
  const [tDate, setTDate] = useState('');
  const [tDeadline, setTDeadline] = useState('');
  const [tMaxPlayers, setTMaxPlayers] = useState(32);

  // Start tournament modal
  const [startingTournament, setStartingTournament] = useState<Tournament | null>(null);
  const [arenaCount, setArenaCount] = useState(2);
  const [rounds, setRounds] = useState(3);
  const [pointsToWin, setPointsToWin] = useState(4);

  useEffect(() => {
    setPlayers(getPlayers());
    setTournaments(getTournaments());
  }, []);

  const handleCreate = () => {
    if (!tName.trim() || !tDate) { toast.error('Preencha nome e data!'); return; }
    const t: Tournament = {
      id: crypto.randomUUID(),
      name: tName.trim(),
      date: tDate,
      registrationDeadline: tDeadline || tDate,
      playerIds: [],
      rounds: [],
      currentRound: 0,
      arenaCount: 2,
      totalRounds: 3,
      pointsToWin: 4,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      maxPlayers: tMaxPlayers,
    };
    createUpcomingTournament(t);
    setTournaments(getTournaments());
    setShowCreate(false);
    setTName(''); setTDate(''); setTDeadline('');
    toast.success('Torneio criado! Ele agora aparece na Home pública.');
  };

  const handleStartTournament = () => {
    if (!startingTournament) return;
    if (startingTournament.playerIds.length < 2) { toast.error('Mínimo 2 jogadores inscritos!'); return; }

    const firstRound = generateFirstRound(startingTournament.playerIds, arenaCount);
    const active: Tournament = {
      ...startingTournament,
      status: 'active',
      arenaCount,
      totalRounds: rounds,
      pointsToWin,
      rounds: [firstRound],
      currentRound: 0,
    };

    // Remove from upcoming
    const all = getTournaments().filter(t => t.id !== startingTournament.id);
    saveTournaments(all);
    saveActiveTournament(active);
    toast.success('Torneio iniciado! Let it rip! 🌀');
    navigate('/arena');
  };

  const getPlayer = (id: string) => players.find(p => p.id === id);
  const suggested = startingTournament ? suggestRounds(startingTournament.playerIds.length) : 3;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic crimson-line pl-3">
          PAINEL ADMIN
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" /> Criar Torneio
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="dark-panel p-5 space-y-4 border-l-4 border-secondary anim-fade-up">
          <h2 className="font-heading text-lg font-bold text-secondary tracking-wider">NOVO TORNEIO</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground">Nome</Label>
              <Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ex: Copa Beyblade X" className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground">Data do Torneio</Label>
              <Input type="date" value={tDate} onChange={e => setTDate(e.target.value)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground">Limite de Inscrição</Label>
              <Input type="date" value={tDeadline} onChange={e => setTDeadline(e.target.value)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground">Vagas Máximas</Label>
              <Input type="number" min={2} max={128} value={tMaxPlayers} onChange={e => setTMaxPlayers(parseInt(e.target.value) || 32)} className="bg-muted/30 border-border" />
            </div>
          </div>
          <Button onClick={handleCreate} className="font-heading tracking-wider gap-2 bg-secondary text-secondary-foreground">
            <Plus className="h-4 w-4" /> Criar e Publicar
          </Button>
        </div>
      )}

      {/* Start Tournament Modal */}
      {startingTournament && (
        <div className="dark-panel p-5 space-y-4 border-l-4 border-primary anim-fade-up">
          <h2 className="font-heading text-lg font-bold text-primary tracking-wider">
            INICIAR: {startingTournament.name}
          </h2>
          <p className="text-xs text-muted-foreground font-body">{startingTournament.playerIds.length} jogadores inscritos</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground">Rodadas</Label>
              <div className="flex gap-2">
                <Input type="number" min={1} max={20} value={rounds} onChange={e => setRounds(parseInt(e.target.value) || 1)} className="bg-muted/30 border-border" />
                <Button variant="outline" size="sm" onClick={() => setRounds(suggested)} className="gap-1 text-xs font-heading shrink-0 border-secondary text-secondary">
                  <Lightbulb className="h-3 w-3" /> {suggested}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground">Arenas</Label>
              <Input type="number" min={1} max={10} value={arenaCount} onChange={e => setArenaCount(parseInt(e.target.value) || 2)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading text-muted-foreground">Pts p/ Vencer</Label>
              <Input type="number" min={1} max={10} value={pointsToWin} onChange={e => setPointsToWin(parseInt(e.target.value) || 4)} className="bg-muted/30 border-border" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleStartTournament} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground">
              <Play className="h-4 w-4" /> INICIAR TORNEIO
            </Button>
            <Button variant="outline" onClick={() => setStartingTournament(null)} className="font-heading tracking-wider">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Tournament list */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold tracking-wider text-muted-foreground">TORNEIOS AGENDADOS</h2>
        {tournaments.filter(t => t.status === 'upcoming').length === 0 ? (
          <div className="dark-panel p-8 text-center">
            <p className="text-muted-foreground font-body text-sm">Nenhum torneio criado ainda.</p>
          </div>
        ) : (
          tournaments.filter(t => t.status === 'upcoming').map(t => (
            <div key={t.id} className="dark-panel p-4 border-l-4 border-muted anim-fade-up">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{t.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.playerIds.length} inscritos</span>
                  </div>
                  {/* Registered player mini avatars */}
                  {t.playerIds.length > 0 && (
                    <div className="flex -space-x-2 mt-2">
                      {t.playerIds.slice(0, 8).map(pid => {
                        const p = getPlayer(pid);
                        if (!p) return null;
                        return (
                          <Avatar key={pid} className="h-6 w-6 border border-card">
                            {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? (
                              <AvatarImage src={p.avatar} alt={p.name} />
                            ) : (
                              <AvatarFallback className="bg-muted text-[8px]">{p.avatar}</AvatarFallback>
                            )}
                          </Avatar>
                        );
                      })}
                      {t.playerIds.length > 8 && <span className="text-[10px] text-muted-foreground ml-2">+{t.playerIds.length - 8}</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStartingTournament(t)}
                    className="font-heading tracking-wider gap-1 border-primary text-primary hover:bg-primary/10"
                    disabled={t.playerIds.length < 2}
                  >
                    <Swords className="h-3 w-3" /> Iniciar
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
