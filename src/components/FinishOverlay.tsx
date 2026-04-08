import { useState, useEffect } from 'react';
import { FinishType } from '@/types/tournament';

interface FinishOverlayProps {
  finishType: FinishType | null;
  onDone: () => void;
}

const FINISH_CONFIG: Record<FinishType, { text: string; color: string; bg: string }> = {
  spin:    { text: 'SPIN',    color: '#ffffff',  bg: 'rgba(255,255,255,0.08)' },
  over:    { text: 'OVER',    color: '#F5A623',  bg: 'rgba(245,166,35,0.10)' },
  burst:   { text: 'BURST',   color: '#FF6B35',  bg: 'rgba(255,107,53,0.10)' },
  extreme: { text: 'XTREME',  color: '#7B5CF6',  bg: 'rgba(123,92,246,0.10)' },
};

export default function FinishOverlay({ finishType, onDone }: FinishOverlayProps) {
  const [phase, setPhase] = useState<'in' | 'out' | null>('in');

  useEffect(() => {
    if (!finishType) return;
    setPhase('in');
    const t1 = setTimeout(() => setPhase('out'), 800);
    const t2 = setTimeout(() => { setPhase(null); onDone(); }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [finishType, onDone]);

  if (!finishType || !phase) return null;
  const config = FINISH_CONFIG[finishType];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div
        className={`finish-overlay ${phase === 'in' ? 'finish-overlay-in' : 'finish-overlay-out'}`}
        style={{ backgroundColor: config.bg }}
      >
        <span
          className="font-heading font-bold text-5xl sm:text-7xl tracking-[0.3em] italic"
          style={{ color: config.color }}
        >
          {config.text}
        </span>
      </div>
    </div>
  );
}
