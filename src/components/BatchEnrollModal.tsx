import { useState, useMemo } from 'react';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useTournamentStore } from '@/stores/useTournamentStore';

interface BatchEnrollModalProps {
  tournamentId: string;
  tournamentName: string;
  enrolledPlayerIds: string[];
  allPlayers: Player[];
  onClose: () => void;
}

export default function BatchEnrollModal({ tournamentId, tournamentName, enrolledPlayerIds, allPlayers, onClose }: BatchEnrollModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { enrollPlayer } = useTournamentStore();

  const unenrolled = useMemo(() =>
    allPlayers.filter(p => !enrolledPlayerIds.includes(p.id))
  , [allPlayers, enrolledPlayerIds]);

  const filtered = useMemo(() =>
    unenrolled.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()))
    )
  , [unenrolled, search]);

  const togglePlayer = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  const handleEnroll = () => {
    for (const pid of selected) {
      enrollPlayer(tournamentId, pid);
    }
    toast.success(`${selected.size} jogador${selected.size > 1 ? 'es' : ''} inscrito${selected.size > 1 ? 's' : ''} com sucesso`);
    onClose();
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <div className="relative z-10 glass-panel p-6 max-w-lg w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-lg font-bold text-primary tracking-wider">INSCREVER EM LOTE</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/30">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">{tournamentName}</p>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar blader..." className="pl-9 bg-muted/30 border-border h-9" />
        </div>

        {filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 border border-transparent mb-1 text-left"
          >
            <Checkbox checked={allSelected} className="shrink-0" />
            <span className="text-xs font-heading text-muted-foreground tracking-wider">Selecionar todos ({filtered.length})</span>
          </button>
        )}

        <div className="space-y-1 max-h-[40vh] overflow-auto">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${selected.has(p.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30 border border-transparent'}`}
            >
              <Checkbox checked={selected.has(p.id)} className="shrink-0" />
              <Avatar className="h-8 w-8 border border-muted">
                {p.avatar.startsWith('http') || p.avatar.startsWith('data:')
                  ? <AvatarImage src={p.avatar} />
                  : <AvatarFallback className="bg-muted text-sm">{p.avatar}</AvatarFallback>
                }
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm text-foreground truncate">{p.name}</p>
                {p.nickname && <p className="text-[10px] text-muted-foreground">@{p.nickname}</p>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              {unenrolled.length === 0 ? 'Todos os bladers já estão inscritos.' : 'Nenhum blader encontrado.'}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground font-body">
            <Users className="h-3 w-3 inline mr-1" />
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
          </span>
          <Button
            onClick={handleEnroll}
            disabled={selected.size === 0}
            className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Inscrever selecionados
          </Button>
        </div>
      </div>
    </div>
  );
}
