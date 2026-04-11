interface Props { size: number; animated?: boolean }

export default function FrameStreak2({ size, animated = true }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={animated ? 'animate-pulse-streak2' : ''}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      {/* Double base */}
      <path d="M22 88 Q50 96 78 88" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 91 Q50 96 74 91" fill="none" stroke="#6EE7B7" strokeWidth="1" opacity="0.4" />

      {/* Double chevrons */}
      <path d="M12 43 L6 50 L12 57" fill="none" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 43 L2 50 L8 57" fill="none" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M88 43 L94 50 L88 57" fill="none" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M92 43 L98 50 L92 57" fill="none" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.5" />

      {/* 2 points on top */}
      <polygon points="42,3 39,14 45,14" fill="#6EE7B7" />
      <polygon points="58,3 55,14 61,14" fill="#6EE7B7" />

      {/* Corner arcs */}
      <path d="M16 16 Q10 10 16 6" fill="none" stroke="#065F46" strokeWidth="1.5" />
      <path d="M84 16 Q90 10 84 6" fill="none" stroke="#065F46" strokeWidth="1.5" />

      {/* Frame border */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="#10B981" strokeWidth="1.8" opacity="0.5" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#6EE7B7" strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
}
