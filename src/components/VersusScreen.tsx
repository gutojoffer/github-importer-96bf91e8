import { useState, useEffect, useMemo, useRef } from 'react';
import { Player, FinishType } from '@/types/tournament';
import EloBadge from '@/components/EloBadge';
import LigaLogo from '@/components/LigaLogo';
import { toast } from 'sonner';

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

function getStreakBorder(streak: number, side: 'left' | 'right'): string {
  if (streak === 0) return side === 'left' ? '#2563EB' : '#DC2626';
  if (streak === 1) return '#3B82F6';
  if (streak === 2) return '#10B981';
  if (streak === 3) return '#F97316';
  if (streak === 4) return '#EF4444';
  return '#EF4444';
}

function getStreakAnimation(streak: number, side: 'left' | 'right'): string {
  if (streak === 0) return side === 'left' ? 'glow-s0 2.5s ease-in-out infinite' : 'glow-s0-red 2.5s ease-in-out infinite';
  if (streak === 1) return 'glow-s1 2s ease-in-out infinite';
  if (streak === 2) return 'glow-s2 1.8s ease-in-out infinite';
  if (streak === 3) return 'glow-s3 1.6s ease-in-out infinite';
  if (streak === 4) return 'glow-s4 1.3s ease-in-out infinite';
  return 'glow-s5 1s linear infinite';
}

function getDividerGradient(streak: number, side: 'left' | 'right'): string {
  const colors: Record<number, string> = { 0: side === 'left' ? '#2563EB' : '#DC2626', 1: '#3B82F6', 2: '#10B981', 3: '#F97316', 4: '#EF4444', 5: '#EF4444' };
  const color = colors[Math.min(streak, 5)];
  const dir = side === 'left' ? '90deg' : '270deg';
  return `linear-gradient(${dir}, ${color}, rgba(0,0,0,0))`;
}

function getBadgeStyle(streak: number): React.CSSProperties {
  if (streak === 1) return { background: 'rgba(59,130,246,.85)', border: '1px solid rgba(147,197,253,.5)', color: '#fff', boxShadow: '0 2px 12px rgba(59,130,246,.4)' };
  if (streak === 2) return { background: 'rgba(16,185,129,.85)', border: '1px solid rgba(110,231,183,.5)', color: '#fff', boxShadow: '0 2px 12px rgba(16,185,129,.4)' };
  if (streak === 3) return { background: 'rgba(249,115,22,.88)', border: '1px solid rgba(253,186,116,.5)', color: '#fff', boxShadow: '0 2px 14px rgba(249,115,22,.5)' };
  if (streak === 4) return { background: 'rgba(239,68,68,.9)', border: '1px solid rgba(252,165,165,.5)', color: '#fff', boxShadow: '0 2px 16px rgba(239,68,68,.6)' };
  return { background: 'linear-gradient(90deg, #EF4444, #F97316)', border: '1px solid rgba(251,146,60,.6)', color: '#fff', boxShadow: '0 2px 20px rgba(239,68,68,.7)' };
}

function BattleCard({
  player, side, points, pointsToWin, streak, animate, playerName,
}: {
  player: Player; side: 'left' | 'right'; points: number; pointsToWin: number; streak: number; animate: boolean; playerName?: string;
}) {
  const isLeft = side === 'left';
  const hasPhoto = player.avatar.startsWith('http') || player.avatar.startsWith('data:');
  const progress = Math.min(100, (points / pointsToWin) * 100);

  const [isImpact, setIsImpact] = useState(false);
  const [prevPts, setPrevPts] = useState(points);
  const prevStreakRef = useRef(streak);
  const [streakAnim, setStreakAnim] = useState<string>('');

  useEffect(() => {
    if (points !== prevPts) {
      setIsImpact(true);
      setPrevPts(points);
      setTimeout(() => setIsImpact(false), 400);
    }
  }, [points, prevPts]);

  useEffect(() => {
    const prev = prevStreakRef.current;
    if (streak > prev && prev >= 0 && streak >= 2) {
      setStreakAnim('streak-upgrade');
      setTimeout(() => setStreakAnim(''), 700);
      if (playerName) {
        const colors: Record<number, string> = { 2: '#10B981', 3: '#F97316', 4: '#EF4444' };
        toast(`🔥 ${playerName} em streak de ${streak}!`, {
          duration: 2000,
          style: {
            background: colors[Math.min(streak, 4)] || '#EF4444',
            color: '#fff',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            textAlign: 'center',
          },
        });
      }
    } else if (streak === 0 && prev > 0) {
      setStreakAnim('streak-break');
      setTimeout(() => setStreakAnim(''), 500);
    }
    prevStreakRef.current = streak;
  }, [streak, playerName]);

  const infoBg = isLeft ? '#0d1525' : '#160a0a';
  const fadeTo = isLeft ? '#0d1525' : '#160a0a';
  const borderColor = getStreakBorder(streak, side);
  const borderWidth = streak >= 5 ? 3 : 2;

  return (
    <div
      className={`bcard relative flex-shrink-0 flex flex-col rounded-[14px] overflow-hidden z-[2] ${animate ? (isLeft ? 'anim-slide-left' : 'anim-slide-right') : ''} ${streakAnim}`}
      style={{
        width: 264,
        border: `${borderWidth}px solid ${borderColor}`,
        animation: getStreakAnimation(streak, side),
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 bottom-0 z-[1]"
        style={{
          width: 3,
          ...(isLeft
            ? { left: 0, background: streak >= 1 ? `linear-gradient(180deg, transparent, ${borderColor}, transparent)` : 'linear-gradient(180deg, transparent, #2563EB, #7C3AED, transparent)' }
            : { right: 0, background: streak >= 1 ? `linear-gradient(180deg, transparent, ${borderColor}, transparent)` : 'linear-gradient(180deg, transparent, #DC2626, #F97316, transparent)' }),
        }}
      />

      {/* Photo zone */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 260, background: '#0d1120' }}>
        <div
          className="bcard-photo-img absolute inset-0 transition-transform duration-[400ms]"
          style={{
            ...(hasPhoto
              ? { backgroundImage: `url(${player.avatar})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center 15%' }
              : {
                  background: isLeft
                    ? 'linear-gradient(160deg, #0d1a3a 0%, #1e3a8a 40%, #0a0f1e 100%)'
                    : 'linear-gradient(160deg, #1c0a0a 0%, #7f1d1d 40%, #0a0608 100%)',
                }),
          }}
        />
        {!hasPhoto && (
          <div className="absolute inset-0 flex items-center justify-center z-[2] opacity-30">
            <span className="text-[80px]">{player.avatar}</span>
          </div>
        )}

        {/* Streak badge on photo */}
        {streak >= 1 && (
          <div
            className="absolute z-[5] font-heading font-bold"
            style={{
              top: 10,
              ...(isLeft ? { left: 10 } : { right: 10 }),
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              animation: streak >= 3 ? 'badge-float 2s ease-in-out infinite' : undefined,
              ...getBadgeStyle(streak),
            }}
          >
            {streak >= 3 ? '🔥' : '⚡'} {streak}
          </div>
        )}

        {/* Fade at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[2]"
          style={{ height: 50, background: `linear-gradient(to bottom, transparent, ${fadeTo})` }}
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
      </div>

      {/* Divider line */}
      <div style={{ height: 2, background: getDividerGradient(streak, side) }} />

      {/* Info zone */}
      <div style={{ background: infoBg, padding: '14px 16px 16px' }}>
        <p
          className="font-heading font-bold truncate"
          style={{
            fontSize: 20,
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
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 10 }}>
            @{player.nickname.replace(/^@/, '')}
          </p>
        )}

        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3">
          <EloBadge xp={player.xp || 0} size="sm" />
          {streak > 0 && (
            <span
              className={`font-heading font-bold ${streak >= 3 ? 'animate-badge-flicker' : ''}`}
              style={{
                padding: '3px 9px',
                borderRadius: 20,
                fontSize: 11,
                background: streak >= 3 ? 'rgba(239,68,68,.15)' : streak === 2 ? 'rgba(16,185,129,.15)' : 'rgba(37,99,235,.15)',
                color: streak >= 3 ? '#FCA5A5' : streak === 2 ? '#6EE7B7' : '#93C5FD',
                border: `1px solid ${streak >= 3 ? 'rgba(239,68,68,.3)' : streak === 2 ? 'rgba(16,185,129,.3)' : 'rgba(37,99,235,.3)'}`,
              }}
            >
              {streak >= 3 ? '🔥' : '⚡'} {streak}
            </span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-2">
          <p
            className={`font-heading font-bold leading-none ${isImpact ? 'arena-score-pop' : ''}`}
            style={{
              fontSize: 56,
              color: isLeft ? '#2563EB' : '#DC2626',
              textShadow: isLeft
                ? '0 0 30px rgba(37,99,235,.4)'
                : '0 0 30px rgba(220,38,38,.4)',
            }}
          >
            {points}
          </p>
          <span className="font-heading" style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
            / {pointsToWin} pontos
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2" style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.07)' }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              borderRadius: 2,
              background: streak >= 3 ? borderColor : (isLeft ? '#2563EB' : '#DC2626'),
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
      {/* Arena label pill */}
      <div className="flex justify-center mb-5">
        <div
          className="inline-flex items-center gap-2.5"
          style={{
            padding: '7px 18px',
            background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.14)',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,.8)',
          }}
        >
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#10B981', boxShadow: '0 0 6px #10B981',
              animation: 'blink 2s ease-in-out infinite',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {arenaName} · Torneio em andamento
        </div>
      </div>

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

        <BattleCard
          player={player1} side="left" points={player1Points}
          pointsToWin={pointsToWin} streak={player1Streak}
          animate={animate} playerName={player1.name}
        />

        {/* VS Central */}
        <div className="relative flex flex-col items-center justify-center px-[14px] gap-3 z-10" style={{ flex: 1, minWidth: 80 }}>
          <div className="w-px flex-1 min-h-[20px]" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.1), transparent)' }} />
          <span
            className="font-heading font-bold tracking-tighter italic text-white"
            style={{ fontSize: 54, animation: 'vs-pulse 2s ease-in-out infinite', textShadow: '0 0 30px rgba(255,255,255,.15)' }}
          >
            VS
          </span>
          <div
            className="rounded-full flex items-center justify-center"
            style={{ width: 42, height: 42, background: '#131626', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <LigaLogo size={32} className="opacity-40" />
          </div>
          <div className="w-px flex-1 min-h-[20px]" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.1), transparent)' }} />
          <div
            className="font-heading font-bold uppercase text-center whitespace-nowrap"
            style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,.65)', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '5px 10px' }}
          >
            Pontos para vencer: {pointsToWin}
          </div>
        </div>

        <BattleCard
          player={player2} side="right" points={player2Points}
          pointsToWin={pointsToWin} streak={player2Streak}
          animate={animate} playerName={player2.name}
        />
      </div>
    </div>
  );
}
