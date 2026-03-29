import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPlayers, saveActiveTournament } from '@/lib/storage';
import { Player, Tournament } from '@/types/tournament';
import { suggestRounds, generateFirstRound } from '@/lib/matchmaking';
import PlayerCard from '@/components/PlayerCard';
import { Play, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function TournamentSetup() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rounds, setRounds] = useState(3);
  const [arenaCount, setArenaCount] = useState(1);
  const [tournamentName, setTournamentName] = useState('');

  useEffect(() => { setPlayers(getPlayers()); }, []);

  const togglePlayer = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const suggested = suggestRounds(selectedIds.size);

  const handleStart = () => {
    if (selectedIds.size < 2) { toast.error('Selecione ao menos 2 jogadores!'); return; }
    if (selectedIds.size % 2 !== 0) { toast.error('Selecione um número par de jogadores!'); return; }

    const playerIds = Array.from(selectedIds);
    const firstRound = generateFirstRound(playerIds, arenaCount);

    const tournament: Tournament = {
      id: crypto.randomUUID(),
      name: tournamentName || `Torneio ${new Date().toLocaleDateString('pt-BR')}`,
      playerIds,
      rounds: [firstRound],
      currentRound: 0,
      arenaCount,
      totalRounds: rounds,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    saveActiveTournament(tournament);
    toast.success('Torneio iniciado! Let it rip! 🌀');
    navigate('/arena');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">Configurar Torneio</h1>

      <div className="border border-border bg-card p-5 space-y-4">
        <div className="space-y-2">
          <Label className="font-heading tracking-wide">Nome do Torneio</Label>
          <Input value={tournamentName} onChange={e => setTournamentName(e.target.value)} placeholder="Ex: Copa Beyblade X" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-heading tracking-wide">Rodadas</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={20} value={rounds} onChange={e => setRounds(parseInt(e.target.value) || 1)} />
              <Button variant="outline" size="sm" onClick={() => setRounds(suggested)} className="gap-1 text-xs font-heading shrink-0 border-secondary text-secondary hover:bg-secondary/10">
                <Lightbulb className="h-3 w-3" /> {suggested}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-heading tracking-wide">Arenas</Label>
            <Input type="number" min={1} max={10} value={arenaCount} onChange={e => setArenaCount(parseInt(e.target.value) || 1)} />
          </div>
        </div>
      </div>

      {/* Player Selection */}
      <div>
        <h2 className="font-heading text-xl font-bold mb-3 tracking-wide">
          Selecionar Jogadores ({selectedIds.size}/{players.length})
        </h2>
        {players.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Cadastre jogadores primeiro!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {players.map(p => (
              <PlayerCard key={p.id} player={p} selected={selectedIds.has(p.id)} onClick={() => togglePlayer(p.id)} />
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={handleStart}
        disabled={selectedIds.size < 2}
        className="w-full font-heading text-lg tracking-widest gap-2 h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80"
      >
        <Play className="h-5 w-5" /> INICIAR TORNEIO
      </Button>
    </div>
  );
}
