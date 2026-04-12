import { useState, useEffect, useMemo } from 'react';
import { Player, FinishType } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';
import StreakFrame from '@/components/StreakFrame';
import LigaLogo from '@/components/LigaLogo';

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

function PlayerCard({
  player,
  side,
  points,
  pointsToWin,
  streak,
  animate,
}: {
  player: Player;
  side: 'left' | 'right';
  points: number;
  pointsToWin: number;
  streak: number;
  animate: boolean;
}) {
  const isLeft = side === 'left';
  const hasPhoto = player.avatar.startsWith('http') || player.avatar.startsWith('data:');
  const progress = Math.min(100, (points / pointsToWin) * 100);

  const [isImpact, setIsImpact] = useState(false);
  const [prevPts, setPrevPts] = useState(points);

  useEffect(() => {
    if (points !== prevPts) {
      setIsImpact(true);
      setPrevPts(points);
      setTimeout(() => setIsImpact(false), 400);
    }
  }, [points, prevPts]);

  return (
    <div
      className={`bcard relative flex-shrink-0 rounded-[14px] overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] ${animate ? (isLeft ? 'anim-slide-left' : 'anim-slide-right') : ''}`}
      style={{
        width: 260,
        height: 400,
        border: `2px solid ${isLeft ? '#2563EB' : '#DC2626'}`,
        animation: isLeft ? 'pulse-blue 2.5s ease-in-out infinite' : 'pulse-red 2.5s ease-in-out infinite',
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 bottom-0 z-[1]"
        style={{
          width: 3,
          ...(isLeft
            ? { left: 0, background: 'linear-gradient(180deg, transparent, #2563EB, #7C3AED, transparent)' }
            : { right: 0, background: 'linear-gradient(180deg, transparent, #DC2626, #F97316, transparent)' }),
        }}
      />

      {/* Background photo / gradient */}
      <div
        className="absolute inset-0"
        style={{
          ...(hasPhoto
            ? { backgroundImage: `url(${player.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
            : {
                background: isLeft
                  ? 'linear-gradient(160deg, #0d1a3a 0%, #1e3a8a 40%, #0a0f1e 100%)'
                  : 'linear-gradient(160deg, #1c0a0a 0%, #7f1d1d 40%, #0a0608 100%)',
              }),
          animation: hasPhoto ? 'bg-zoom 8s ease-in-out infinite' : undefined,
        }}
      />

      {/* Overlay gradient */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: isLeft
            ? `linear-gradient(180deg, rgba(6,9,18,0) 0%, rgba(6,9,18,.04) 20%, rgba(6,9,18,.45) 52%, rgba(6,9,18,.88) 70%, rgba(6,9,18,.98) 100%), linear-gradient(90deg, rgba(37,99,235,.12) 0%, transparent 60%)`
            : `linear-gradient(180deg, rgba(6,9,18,0) 0%, rgba(6,9,18,.04) 20%, rgba(6,9,18,.45) 52%, rgba(6,9,18,.88) 70%, rgba(6,9,18,.98) 100%), linear-gradient(270deg, rgba(220,38,38,.12) 0%, transparent 60%)`,
        }}
      />

      {/* Shimmer */}
      <div
        className="absolute top-0 bottom-0 z-[3] pointer-events-none"
        style={{
          width: '55%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)',
          animation: 'shine 5s ease-in-out infinite',
          transform: 'skewX(-12deg)',
          left: isLeft ? 0 : undefined,
          right: isLeft ? undefined : 0,
        }}
      />

      {/* Emoji fallback avatar centered */}
      {!hasPhoto && (
        <div className="absolute inset-0 flex items-center justify-center z-[2] opacity-30">
          <span className="text-[80px]">{player.avatar}</span>
        </div>
      )}

      {/* Content bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-[5] p-[18px_16px]">
        {/* Name */}
        <p
          className="font-heading text-2xl font-bold truncate"
          style={{
            background: isLeft
              ? 'linear-gradient(90deg, #ffffff, #93C5FD 80%)'
              : 'linear-gradient(90deg, #ffffff, #FCA5A5 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {player.name}
        </p>
        {player.nickname && (
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,.35)' }}>
            @{player.nickname.replace(/^@/, '')}
          </p>
        )}

        {/* Badges row */}
        <div className="flex items-center gap-2 mb-4">
          <EloBadge xp={player.xp || 0} size="sm" />
          {streak > 0 && (
            <span
              className={`px-2.5 py-1 rounded-[20px] font-heading text-xs font-bold ${streak >= 3 ? 'animate-badge-flicker' : ''}`}
              style={{
                background: streak >= 3 ? 'rgba(239,68,68,.15)' : 'rgba(37,99,235,.15)',
                color: streak >= 3 ? '#FCA5A5' : '#93C5FD',
                border: `1px solid ${streak >= 3 ? 'rgba(239,68,68,.3)' : 'rgba(37,99,235,.3)'}`,
              }}
            >
              {streak >= 3 ? '🔥' : '⚡'} {streak}
            </span>
          )}
        </div>

        {/* Score */}
        <p
          className={`font-heading text-[64px] font-bold leading-none ${isImpact ? 'arena-score-pop' : ''}`}
          style={{
            color: isLeft ? '#2563EB' : '#DC2626',
            textShadow: isLeft
              ? '0 0 30px rgba(37,99,235,.4)'
              : '0 0 30px rgba(220,38,38,.4)',
          }}
        >
          {points}
        </p>
        <p className="text-[11px] font-heading mt-1" style={{ color: 'rgba(255,255,255,.35)' }}>
          {points} / {pointsToWin} pontos
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-[3px] rounded-sm" style={{ background: 'rgba(255,255,255,.07)' }}>
          <div
            className="h-full rounded-sm transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: isLeft ? '#2563EB' : '#DC2626',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Particles() {
  const particles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      isBlue: i < 3,
      size: 3 + Math.random() * 4,
      tx: (i < 3 ? -1 : 1) * (20 + Math.random() * 40),
      ty: -(30 + Math.random() * 60),
      delay: Math.random() * 2,
      left: i < 3 ? `${10 + Math.random() * 30}%` : `${60 + Math.random() * 30}%`,
      top: `${40 + Math.random() * 40}%`,
    }));
  }, []);

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            background: p.isBlue ? 'rgba(37,99,235,.6)' : 'rgba(220,38,38,.6)',
            animation: `particle 2s ease-out infinite`,
            animationDelay: `${p.delay}s`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

export default function VersusScreen({
  player1, player2, arenaName,
  player1Points = 0, player2Points = 0, pointsToWin = 4,
  animate = true, player1Streak = 0, player2Streak = 0,
}: VersusScreenProps) {
  return (
    <div className="relative">
      {/* Arena name */}
      <p className="text-center text-xs font-heading tracking-[0.3em] uppercase mb-3 text-muted-foreground relative z-10">
        {arenaName}
      </p>

      <div
        className="relative flex items-stretch justify-center gap-0"
        style={{
          background: `
            radial-gradient(ellipse 45% 100% at 20% 50%, rgba(37,99,235,.07), transparent),
            radial-gradient(ellipse 45% 100% at 80% 50%, rgba(220,38,38,.07), transparent),
            radial-gradient(ellipse at center, #0d1a2e 0%, #090b12 70%)
          `,
          padding: '24px 16px',
          borderRadius: 12,
        }}
      >
        <Particles />

        {/* Left player */}
        <PlayerCard
          player={player1}
          side="left"
          points={player1Points}
          pointsToWin={pointsToWin}
          streak={player1Streak}
          animate={animate}
        />

        {/* VS Central */}
        <div className="relative flex flex-col items-center justify-center px-[14px] gap-3 z-10" style={{ flex: 1, minWidth: 80 }}>
          <div className="w-px flex-1 min-h-[20px]" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.12), transparent)' }} />

          <span
            className="font-heading text-[54px] font-bold tracking-tighter italic text-white"
            style={{
              animation: 'vs-pulse 2s ease-in-out infinite',
              textShadow: '0 0 30px rgba(255,255,255,.15)',
            }}
          >
            VS
          </span>

          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 42,
              height: 42,
              background: '#131626',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <LigaLogo size={32} className="opacity-40" />
          </div>

          <div className="w-px flex-1 min-h-[20px]" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.12), transparent)' }} />

          <p className="text-[9px] text-muted-foreground font-heading tracking-[0.2em] uppercase whitespace-nowrap">
            pontos para vencer: {pointsToWin}
          </p>
        </div>

        {/* Right player */}
        <PlayerCard
          player={player2}
          side="right"
          points={player2Points}
          pointsToWin={pointsToWin}
          streak={player2Streak}
          animate={animate}
        />
      </div>
    </div>
  );
}
