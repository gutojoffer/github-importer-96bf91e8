interface Props { size: number; animated?: boolean }

export default function FrameBronze({ size, animated = true }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={animated ? 'animate-pulse-bronze' : ''}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      {/* Base arc */}
      <path d="M20 88 Q50 96 80 88" fill="none" stroke="#CD7C3F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="92" r="2" fill="#E8A87C" />

      {/* Side shields */}
      <path d="M8 30 L4 50 L12 65 L16 45 Z" fill="#CD7C3F" opacity="0.7" />
      <path d="M92 30 L96 50 L88 65 L84 45 Z" fill="#CD7C3F" opacity="0.7" />
      <path d="M10 35 L7 48 L13 58 L15 44 Z" fill="#E8A87C" opacity="0.4" />
      <path d="M90 35 L93 48 L87 58 L85 44 Z" fill="#E8A87C" opacity="0.4" />

      {/* Top 3 spikes */}
      <polygon points="50,2 46,14 54,14" fill="#E8A87C" />
      <polygon points="35,6 33,16 40,14" fill="#CD7C3F" />
      <polygon points="65,6 67,16 60,14" fill="#CD7C3F" />

      {/* Corner accents */}
      <path d="M18 18 Q12 12 18 8" fill="none" stroke="#7C3F1A" strokeWidth="1.5" />
      <path d="M82 18 Q88 12 82 8" fill="none" stroke="#7C3F1A" strokeWidth="1.5" />

      {/* Circular frame border */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="#CD7C3F" strokeWidth="2" opacity="0.6" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#E8A87C" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
