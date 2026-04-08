import { useState, useEffect } from 'react';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';
import LigaLogo from '@/components/LigaLogo';

interface VersusScreenProps {
  player1: Player;
  player2: Player;
  arenaName: string;
  player1Points?: number;
  player2Points?: number;
  pointsToWin?: number;
  animate?: boolean;
}

export default function VersusScreen({
  player1, player2, arenaName,
  player1Points = 0, player2Points = 0, pointsToWin = 4,
  animate = true,
}: VersusScreenProps) {
  const [p1Anim, setP1Anim] = useState(false);
  const [p2Anim, setP2Anim] = useState(false);
  const [prevP1, setPrevP1] = useState(player1Points);
  const [prevP2, setPrevP2] = useState(player2Points);

  useEffect(() => {
    if (player1Points !== prevP1) {
      setP1Anim(true);
      setPrevP1(player1Points);
      setTimeout(() => setP1Anim(false), 400);
    }
  }, [player1Points, prevP1]);

  useEffect(() => {
    if (player2Points !== prevP2) {
      setP2Anim(true);
      setPrevP2(player2Points);
      setTimeout(() => setP2Anim(false), 400);
    }
  }, [player2Points, prevP2]);

  const renderPlayer = (player: Player, side: 'left' | 'right', points: number, isImpact: boolean) => {
    const isLeft = side === 'left';
    const themeColor = isLeft ? '#4F8EF7' : '#EF4444';
    const clipPath = isLeft
      ? 'polygon(0 0, 92% 0, 100% 100%, 0 100%)'
      : 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)';

    return (
      <div
        className={`relative flex-1 min-w-0 py-6 px-4 sm:px-6 ${animate ? (isLeft ? 'anim-slide-left' : 'anim-slide-right') : ''}`}
        style={{ clipPath }}
      >
        {/* Side tinted bg */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ background: themeColor }} />

        <div className={`flex flex-col items-center gap-2 relative z-10 ${isImpact ? 'anim-score-shake' : ''}`}>
          {/* Avatar with pulse */}
          <div className="arena-avatar-pulse" style={{ '--pulse-color': themeColor } as React.CSSProperties}>
            <Avatar className="h-[80px] w-[80px] sm:h-[100px] sm:w-[100px] border-[3px]" style={{ borderColor: themeColor }}>
              {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                <AvatarImage src={player.avatar} alt={player.name} />
              ) : (
                <AvatarFallback className="bg-muted text-3xl sm:text-4xl">{player.avatar}</AvatarFallback>
              )}
            </Avatar>
          </div>

          <EloBadge xp={player.xp || 0} size="md" />

          <div className="text-center min-w-0 w-full">
            <p className="font-heading text-lg sm:text-2xl font-bold tracking-wide truncate italic" style={{ color: themeColor }}>
              {player.name}
            </p>
            {player.nickname && (
              <p className="text-xs text-muted-foreground font-body truncate">@{player.nickname.replace(/^@/, '')}</p>
            )}
          </div>

          {/* Score */}
          <div className="text-center">
            <p
              className={`font-heading text-6xl sm:text-7xl font-bold transition-all duration-200 ${isImpact ? 'arena-score-pop' : ''}`}
              style={{ color: themeColor }}
              key={points}
            >
              {points}
            </p>
            <p className="text-[10px] text-muted-foreground font-heading tracking-wider">
              {points} / {pointsToWin}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <p className="text-center text-xs font-heading tracking-[0.3em] uppercase mb-3 text-muted-foreground relative z-10">{arenaName}</p>
      
      <div className="flex items-stretch justify-center relative">
        {renderPlayer(player1, 'left', player1Points, p1Anim)}

        {/* VS Central */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none ${animate ? 'anim-vs-clash' : ''}`}>
          {/* Lightning bolts SVG */}
          <div className="relative">
            <svg className="absolute -left-10 top-1/2 -translate-y-1/2 arena-bolt-left" width="32" height="48" viewBox="0 0 32 48" fill="none">
              <path d="M20 0L0 28h12L8 48l24-28H20L24 0z" fill="#4F8EF7" fillOpacity="0.7" />
            </svg>
            <svg className="absolute -right-10 top-1/2 -translate-y-1/2 arena-bolt-right" width="32" height="48" viewBox="0 0 32 48" fill="none">
              <path d="M12 0L32 28H20l4 20L0 20h12L8 0z" fill="#EF4444" fillOpacity="0.7" />
            </svg>
            <span className="font-heading text-7xl sm:text-[96px] font-bold tracking-tighter italic arena-vs-color arena-vs-pulse">
              VS
            </span>
          </div>
          <LigaLogo size={40} className="opacity-40 mt-1" />
        </div>

        {renderPlayer(player2, 'right', player2Points, p2Anim)}
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-heading mt-3 tracking-widest relative z-10">
        PONTOS PARA VENCER: {pointsToWin}
      </p>
    </div>
  );
}
