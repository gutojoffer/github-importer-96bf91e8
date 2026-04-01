import { useState, useEffect } from 'react';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';

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
    const animClass = animate ? (side === 'left' ? 'anim-slide-left' : 'anim-slide-right') : '';
    const sideColor = side === 'left' ? 'text-primary' : 'text-secondary';
    const sideBorder = side === 'left' ? 'border-primary/50' : 'border-secondary/50';
    const sideGlow = side === 'left' ? 'shadow-[0_0_20px_hsl(235_86%_65%/0.2)]' : 'shadow-[0_0_20px_hsl(350_90%_60%/0.2)]';

    return (
      <div className={`flex flex-col items-center gap-2 flex-1 min-w-0 ${animClass} ${isImpact ? 'anim-score-shake' : ''}`}>
        <div className={`relative ${sideGlow} rounded-full`}>
          <Avatar className={`h-20 w-20 sm:h-28 sm:w-28 border-[3px] ${sideBorder}`}>
            {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
              <AvatarImage src={player.avatar} alt={player.name} />
            ) : (
              <AvatarFallback className="bg-muted text-3xl sm:text-4xl">{player.avatar}</AvatarFallback>
            )}
          </Avatar>
        </div>

        <EloBadge xp={player.xp || 0} size="md" />

        <div className="text-center min-w-0 w-full">
          <p className={`font-heading text-base sm:text-xl font-bold tracking-wide ${sideColor} truncate italic`}>
            {player.name}
          </p>
          {player.nickname && (
            <p className="text-xs text-muted-foreground font-body truncate">@{player.nickname.replace(/^@/, '')}</p>
          )}
        </div>

        <div className="text-center">
          <p className={`font-heading text-3xl sm:text-4xl font-bold ${sideColor} transition-all duration-200 ${isImpact ? 'anim-score-impact' : ''}`}>
            {points}
          </p>
          <p className="text-[10px] text-muted-foreground font-heading tracking-wider">
            {points} / {pointsToWin}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative py-6 px-3">
      <p className="text-center text-xs font-heading tracking-[0.3em] uppercase mb-5 text-muted-foreground">{arenaName}</p>
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {renderPlayer(player1, 'left', player1Points, p1Anim)}

        <div className={`flex flex-col items-center shrink-0 ${animate ? 'anim-vs-clash' : ''}`}>
          <div className="relative">
            <span className="font-heading text-4xl sm:text-6xl font-bold text-primary/90 tracking-tighter italic">VS</span>
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl" />
          </div>
          <div className="w-[2px] h-8 bg-gradient-to-b from-primary/30 to-transparent mt-1" />
        </div>

        {renderPlayer(player2, 'right', player2Points, p2Anim)}
      </div>
      <p className="text-center text-[10px] text-muted-foreground font-heading mt-4 tracking-widest">
        POINTS TO WIN: {pointsToWin}
      </p>
    </div>
  );
}
