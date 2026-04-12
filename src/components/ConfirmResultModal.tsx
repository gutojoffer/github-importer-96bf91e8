import { Player } from '@/types/tournament';

interface ConfirmResultModalProps {
  open: boolean;
  player1: Player;
  player2: Player;
  player1Points: number;
  player2Points: number;
  pointsToWin: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmResultModal({
  open, player1, player2, player1Points, player2Points, pointsToWin, onConfirm, onCancel,
}: ConfirmResultModalProps) {
  if (!open) return null;

  const winner = player1Points >= pointsToWin ? player1 : player2;
  const isP1Winner = player1Points >= pointsToWin;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative z-10 w-full max-w-[400px] rounded-2xl p-7 space-y-5"
        style={{
          background: '#111827',
          border: '1px solid rgba(255,255,255,.12)',
        }}
      >
        <div>
          <h3 className="font-heading text-xl font-bold text-white tracking-wider">Confirmar resultado?</h3>
          <p className="text-sm text-muted-foreground mt-1">Verifique o placar antes de confirmar</p>
        </div>

        {/* Score display */}
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="font-heading text-sm font-bold text-muted-foreground truncate max-w-[120px]">{player1.name}</p>
            <p
              className="font-heading text-5xl font-bold mt-1"
              style={{
                color: isP1Winner ? '#2563EB' : '#DC2626',
                textShadow: isP1Winner ? '0 0 20px rgba(37,99,235,.4)' : '0 0 20px rgba(220,38,38,.4)',
              }}
            >
              {player1Points}
            </p>
          </div>
          <span className="font-heading text-2xl font-bold text-muted-foreground italic">×</span>
          <div className="text-center">
            <p className="font-heading text-sm font-bold text-muted-foreground truncate max-w-[120px]">{player2.name}</p>
            <p
              className="font-heading text-5xl font-bold mt-1"
              style={{
                color: !isP1Winner ? '#2563EB' : '#DC2626',
                textShadow: !isP1Winner ? '0 0 20px rgba(37,99,235,.4)' : '0 0 20px rgba(220,38,38,.4)',
              }}
            >
              {player2Points}
            </p>
          </div>
        </div>

        {/* Winner announcement */}
        <p
          className="text-center font-heading text-sm font-bold tracking-wider"
          style={{ color: isP1Winner ? '#60A5FA' : '#F87171' }}
        >
          🏆 {winner.name} venceu esta partida!
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-lg font-heading text-sm font-bold tracking-wider transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,.15)',
              color: 'rgba(255,255,255,.6)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Corrigir placar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-lg font-heading text-sm font-bold tracking-wider text-white transition-all"
            style={{
              background: '#2563EB',
              border: '1px solid rgba(37,99,235,.5)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; }}
          >
            Confirmar vitória
          </button>
        </div>
      </div>
    </div>
  );
}
