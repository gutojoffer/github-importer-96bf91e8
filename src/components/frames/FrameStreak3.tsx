interface Props { size: number; animated?: boolean }

export default function FrameStreak3({ size, animated = true }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={animated ? 'animate-pulse-streak3' : ''}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      {/* Fire base */}
      <path d="M20 86 Q30 92 40 88 Q50 96 60 88 Q70 92 80 86" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 88 Q50 94 75 88" fill="none" stroke="#F97316" strokeWidth="1" opacity="0.5" />

      {/* Side claws/flames */}
      <path d="M8 35 Q2 45 6 58 Q4 50 10 42 Q6 52 12 62" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 40 Q1 48 4 55" fill="none" stroke="#F97316" strokeWidth="1" opacity="0.5" />
      <path d="M92 35 Q98 45 94 58 Q96 50 90 42 Q94 52 88 62" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M95 40 Q99 48 96 55" fill="none" stroke="#F97316" strokeWidth="1" opacity="0.5" />

      {/* 3 flames on top */}
      <path d="M50 0 Q46 6 48 12 Q44 8 46 14 Q50 4 54 14 Q56 8 52 12 Q54 6 50 0" fill="#EF4444" opacity="0.9" />
      <path d="M36 5 Q33 10 35 16 Q37 8 39 16 Q41 10 36 5" fill="#F97316" opacity="0.7" />
      <path d="M64 5 Q67 10 65 16 Q63 8 61 16 Q59 10 64 5" fill="#F97316" opacity="0.7" />

      {/* Inner glow */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#DC2626" strokeWidth="0.8" opacity="0.2" />

      {/* Frame border */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.6" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#FCA5A5" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
