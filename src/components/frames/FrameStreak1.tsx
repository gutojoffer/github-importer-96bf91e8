interface Props { size: number; animated?: boolean }

export default function FrameStreak1({ size, animated = true }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={animated ? 'animate-pulse-streak1' : ''}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      {/* Simple base */}
      <path d="M25 90 Q50 95 75 90" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />

      {/* Chevrons ‹ › */}
      <path d="M10 45 L5 50 L10 55" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M90 45 L95 50 L90 55" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />

      {/* 1 sword/point on top */}
      <polygon points="50,3 47,15 53,15" fill="#93C5FD" />
      <line x1="50" y1="3" x2="50" y2="15" stroke="#2563EB" strokeWidth="0.5" />

      {/* Frame border */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="#2563EB" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
