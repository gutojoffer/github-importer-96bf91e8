import { useState, useEffect, useRef } from 'react';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';
import LigaLogo from '@/components/LigaLogo';
import StreakFrame from '@/components/StreakFrame';

interface VersusScreenProps {
  player1: Player;
  player2: Player;
  arenaName: string;
  player1Points?: number;
  player2Points?: number;
  pointsToWin?: number;
  animate?: boolean;
  player1Streak?: number;
  player2Streak?: number;
}

export default function VersusScreen({
  player1, player2, arenaName,
  player1Points = 0, player2Points = 0, pointsToWin = 4,
  animate = true, player1Streak = 0, player2Streak = 0,
}: VersusScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 28 }, (_, i) => {
      const isBlue = i < 14;
      return {
        x: isBlue
          ? Math.random() * (canvas.width * 0.45)
          : canvas.width * 0.55 + Math.random() * (canvas.width * 0.45),
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.4,
        speed: Math.random() * 0.35 + 0.1,
        dx: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.25 + 0.05,
        isBlue,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.dx;
        if (p.y < -4) {
          p.y = canvas.height + 4;
          p.x = p.isBlue
            ? Math.random() * (canvas.width * 0.45)
            : canvas.width * 0.55 + Math.random() * (canvas.width * 0.45);
        }
        if (p.isBlue && p.x > canvas.width * 0.48) p.dx = -Math.abs(p.dx);
        if (!p.isBlue && p.x < canvas.width * 0.52) p.dx = Math.abs(p.dx);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isBlue
          ? `rgba(96,165,250,${p.opacity})`
          : `rgba(248,113,113,${p.opacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const renderPlayer = (player: Player, side: 'left' | 'right', points: number, isImpact: boolean, streak: number) => {
    const isLeft = side === 'left';

    return (
      <div
        className={`relative flex flex-col items-center gap-3 py-6 px-4 sm:px-6 ${animate ? (isLeft ? 'anim-slide-left' : 'anim-slide-right') : ''}`}
        style={{
          background: isLeft
            ? 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, transparent 60%)'
            : 'linear-gradient(225deg, rgba(239,68,68,0.07) 0%, transparent 60%)',
        }}
      >
        {/* Avatar with StreakFrame */}
        <div
          className="rounded-full"
          style={{
            boxShadow: isLeft
              ? '0 0 20px rgba(59,130,246,0.15)'
              : '0 0 20px rgba(239,68,68,0.15)',
          }}
        >
          <StreakFrame streak={streak} size={88} playerName={player.name}>
            <Avatar
              className="h-[88px] w-[88px]"
              style={{
                border: isLeft ? '2.5px solid #3b82f6' : '2.5px solid #ef4444',
              }}
            >
              {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                <AvatarImage src={player.avatar} alt={player.name} />
              ) : (
                <AvatarFallback className="bg-muted text-3xl">{player.avatar}</AvatarFallback>
              )}
            </Avatar>
          </StreakFrame>
        </div>

        {/* Rank badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[20px] text-xs font-heading"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isLeft ? '#3b82f6' : '#ef4444' }}
          />
          <EloBadge xp={player.xp || 0} size="sm" />
        </div>

        {/* Name */}
        <div className="text-center min-w-0 w-full">
          <p className="font-heading text-lg sm:text-xl font-bold tracking-wide truncate text-foreground">
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
            style={{
              color: isLeft ? '#3b82f6' : '#ef4444',
              textShadow: isLeft
                ? '0 0 24px rgba(59,130,246,0.4)'
                : '0 0 24px rgba(239,68,68,0.4)',
            }}
            key={points}
          >
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
    <div className="relative">
      <p className="text-center text-xs font-heading tracking-[0.3em] uppercase mb-3 text-muted-foreground relative z-10">
        {arenaName}
      </p>

      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #090b12 70%)',
        }}
      >
        {/* Canvas particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        />

        {/* Left player */}
        <div className="relative" style={{ zIndex: 2 }}>
          {renderPlayer(player1, 'left', player1Points, p1Anim, player1Streak)}
        </div>

        {/* VS Central */}
        <div className="relative flex flex-col items-center justify-center px-3" style={{ zIndex: 2 }}>
          {/* Top line */}
          <div
            className="w-px flex-1 min-h-[20px]"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)' }}
          />

          {/* VS text */}
          <span
            className="font-heading text-[42px] font-bold tracking-tighter italic text-white my-2"
            style={{ textShadow: '0 0 30px rgba(255,255,255,0.15)' }}
          >
            VS
          </span>

          {/* Liga logo */}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              background: '#131626',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <LigaLogo size={32} className="opacity-40" />
          </div>

          {/* Bottom line */}
          <div
            className="w-px flex-1 min-h-[20px]"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)' }}
          />
        </div>

        {/* Right player */}
        <div className="relative" style={{ zIndex: 2 }}>
          {renderPlayer(player2, 'right', player2Points, p2Anim, player2Streak)}
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-heading mt-3 tracking-widest relative z-10">
        PONTOS PARA VENCER: {pointsToWin}
      </p>
    </div>
  );
}
