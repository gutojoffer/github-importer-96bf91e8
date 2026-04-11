import { useEffect, useRef, useState, type ReactNode } from 'react';
import FrameBronze from './frames/FrameBronze';
import FramePrata from './frames/FramePrata';
import FrameOuro from './frames/FrameOuro';
import FrameStreak1 from './frames/FrameStreak1';
import FrameStreak2 from './frames/FrameStreak2';
import FrameStreak3 from './frames/FrameStreak3';
import { toast } from 'sonner';

interface StreakFrameProps {
  streak: number;
  size?: number;
  rankPosition?: number;
  showBadge?: boolean;
  animated?: boolean;
  playerName?: string;
  children: ReactNode;
}

export default function StreakFrame({
  streak,
  size = 40,
  rankPosition,
  showBadge = true,
  animated = true,
  playerName,
  children,
}: StreakFrameProps) {
  const prevStreakRef = useRef(streak);
  const [animating, setAnimating] = useState<'upgrade' | 'break' | null>(null);

  useEffect(() => {
    if (streak > prevStreakRef.current && prevStreakRef.current >= 0) {
      if (streak >= 2) {
        setAnimating('upgrade');
        setTimeout(() => setAnimating(null), 1000);
      }
      if (streak >= 2 && playerName) {
        toast(`🔥 ${playerName} está em STREAK ${streak}!`, {
          duration: 2000,
          style: {
            background: streak >= 3 ? '#DC2626' : streak === 2 ? '#065F46' : '#1E40AF',
            color: '#fff',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            textAlign: 'center',
          },
        });
      }
    } else if (streak === 0 && prevStreakRef.current > 0) {
      setAnimating('break');
      setTimeout(() => setAnimating(null), 600);
    }
    prevStreakRef.current = streak;
  }, [streak, playerName]);

  const renderFrame = () => {
    if (rankPosition === 1) return <FrameOuro size={size} animated={animated} />;
    if (rankPosition === 2) return <FramePrata size={size} animated={animated} />;
    if (rankPosition === 3) return <FrameBronze size={size} animated={animated} />;
    if (streak >= 3) return <FrameStreak3 size={size} animated={animated} />;
    if (streak === 2) return <FrameStreak2 size={size} animated={animated} />;
    if (streak === 1) return <FrameStreak1 size={size} animated={animated} />;
    return null;
  };

  const badgeColor = streak >= 3
    ? { bg: 'rgba(249,115,22,0.9)', border: '#F97316', icon: '🔥' }
    : streak === 2
    ? { bg: 'rgba(16,185,129,0.9)', border: '#10B981', icon: '⚡' }
    : streak === 1
    ? { bg: 'rgba(37,99,235,0.9)', border: '#2563EB', icon: '⚡' }
    : null;

  const animClass = animating === 'upgrade'
    ? 'anim-frame-upgrade'
    : animating === 'break'
    ? 'anim-frame-break'
    : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${animClass}`}
      style={{ width: size, height: size }}
    >
      {children}
      {renderFrame()}
      {showBadge && streak >= 1 && badgeColor && (
        <span
          className={streak >= 3 ? 'animate-badge-flicker' : ''}
          style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '1px 6px',
            borderRadius: 10,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: Math.max(9, size * 0.22),
            border: `1px solid ${badgeColor.border}`,
            whiteSpace: 'nowrap',
            zIndex: 10,
            background: badgeColor.bg,
            color: '#fff',
            lineHeight: 1.3,
          }}
        >
          {badgeColor.icon} {streak}
        </span>
      )}
    </div>
  );
}
