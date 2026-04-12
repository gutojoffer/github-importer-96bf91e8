import { useState } from 'react';
import { Match, Player, Tournament, TournamentRound } from '@/types/tournament';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { X, AlertTriangle } from 'lucide-react';

interface CorrectResultModalProps {
  open: boolean;
  tournament: Tournament;
  getPlayer: (id: string) => Player | undefined;
  onClose: () => void;
  onCorrect: (matchId: string, roundIndex: number, isElimination: boolean, newP1Points: number, newP2Points: number) => void;
}

export default function CorrectResultModal({ open, tournament, getPlayer, onClose, onCorrect }: CorrectResultModalProps) {
  const [selectedMatch, setSelectedMatch] = useState<{ match: Match; roundIndex: number; isElimination: boolean } | null>(null);
  const [newP1, setNewP1] = useState(0);
  const [newP2, setNewP2] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  // Gather all completed matches
  const completedMatches: { match: Match; roundIndex: number; roundLabel: string; isElimination: boolean }[] = [];

  tournament.rounds.forEach((round, ri) => {
    round.matches.forEach(m => {
      if (m.result && !m.isBye && !m.isWalkover) {
        completedMatches.push({ match: m, roundIndex: ri, roundLabel: `Rodada ${ri + 1}`, isElimination: false });
      }
    });
  });

  (tournament.eliminationRounds || []).forEach((round, ri) => {
    round.matches.forEach(m => {
      if (m.result && !m.isBye && !m.isWalkover) {
        completedMatches.push({ match: m, roundIndex: ri, roundLabel: round.label || `Elim ${ri + 1}`, isElimination: true });
      }
    });
  });

  const handleSelectMatch = (entry: typeof completedMatches[0]) => {
    setSelectedMatch({ match: entry.match, roundIndex: entry.roundIndex, isElimination: entry.isElimination });
    setNewP1(entry.match.player1Points);
    setNewP2(entry.match.player2Points);
    setConfirmed(false);
  };

  const handleApply = () => {
    if (!selectedMatch || !confirmed) return;
    onCorrect(selectedMatch.match.id, selectedMatch.roundIndex, selectedMatch.isElimination, newP1, newP2);
    setSelectedMatch(null);
    onClose();
  };

  // Match list view
  if (!selectedMatch) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative z-10 w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-auto"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,.12)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-white tracking-wider">Corrigir Resultado</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/5">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Selecione a partida que deseja corrigir:</p>

          {completedMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma partida finalizada para corrigir.</p>
          ) : (
            <div className="space-y-1.5">
              {completedMatches.map(entry => {
                const p1 = getPlayer(entry.match.player1Id);
                const p2 = getPlayer(entry.match.player2Id);
                const winnerId = entry.match.result?.winnerId;
                return (
                  <button
                    key={entry.match.id}
                    onClick={() => handleSelectMatch(entry)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,.06)' }}
                  >
                    <span className="text-[10px] font-heading text-muted-foreground tracking-wider w-20 shrink-0">{entry.roundLabel}</span>
                    <span className={`font-heading text-sm truncate ${winnerId === entry.match.player1Id ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {p1?.name || '?'}
                    </span>
                    <span className="text-xs text-muted-foreground font-heading">
                      {entry.match.player1Points} × {entry.match.player2Points}
                    </span>
                    <span className={`font-heading text-sm truncate ${winnerId === entry.match.player2Id ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                      {p2?.name || '?'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit view
  const p1 = getPlayer(selectedMatch.match.player1Id);
  const p2 = getPlayer(selectedMatch.match.player2Id);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
      <div
        className="relative z-10 w-full max-w-[420px] rounded-2xl p-7 space-y-5"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-heading text-lg font-bold text-white tracking-wider">
          Corrigir — {p1?.name || '?'} vs {p2?.name || '?'}
        </h3>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.2)' }}>
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200/80">
            Atenção: corrigir este resultado pode alterar o chaveamento das rodadas seguintes.
          </p>
        </div>

        {/* Score inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="font-heading text-xs text-muted-foreground">{p1?.name}</label>
            <Input
              type="number"
              min={0}
              max={99}
              value={newP1}
              onChange={e => setNewP1(parseInt(e.target.value) || 0)}
              className="bg-muted/30 border-border h-11 font-heading text-lg text-center arena-input-clean"
            />
          </div>
          <div className="space-y-2">
            <label className="font-heading text-xs text-muted-foreground">{p2?.name}</label>
            <Input
              type="number"
              min={0}
              max={99}
              value={newP2}
              onChange={e => setNewP2(parseInt(e.target.value) || 0)}
              className="bg-muted/30 border-border h-11 font-heading text-lg text-center arena-input-clean"
            />
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(!!v)}
            className="mt-0.5"
          />
          <label className="text-xs text-muted-foreground cursor-pointer" onClick={() => setConfirmed(!confirmed)}>
            Entendo que o chaveamento será refeito a partir desta rodada
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedMatch(null)}
            className="flex-1 h-11 rounded-lg font-heading text-sm font-bold tracking-wider transition-all"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.6)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={!confirmed}
            className="flex-1 h-11 rounded-lg font-heading text-sm font-bold tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#2563EB', border: '1px solid rgba(37,99,235,.5)' }}
          >
            Aplicar correção
          </button>
        </div>
      </div>
    </div>
  );
}
