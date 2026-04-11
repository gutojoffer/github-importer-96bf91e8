interface Props { size: number; animated?: boolean }

export default function FrameOuro({ size, animated = true }: Props) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {/* Crown emoji */}
      <span
        className={animated ? 'animate-frame-float' : ''}
        style={{
          position: 'absolute',
          top: `-${size * 0.08}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: `${size * 0.22}px`,
          zIndex: 10,
          lineHeight: 1,
        }}
      >
        👑
      </span>

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={animated ? 'animate-pulse-ouro' : ''}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Glory rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line
            key={angle}
            x1="50" y1="50"
            x2={50 + 48 * Math.cos((angle * Math.PI) / 180)}
            y2={50 + 48 * Math.sin((angle * Math.PI) / 180)}
            stroke="#FDE68A"
            strokeWidth="0.3"
            opacity="0.15"
          />
        ))}

        {/* Ornate base with pendant */}
        <path d="M16 86 Q50 96 84 86" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 88 Q50 93 80 88" fill="none" stroke="#FDE68A" strokeWidth="1" opacity="0.4" />
        <polygon points="50,89 46,98 54,98" fill="#F59E0B" />
        <circle cx="50" cy="96" r="1.5" fill="#FDE68A" />

        {/* Ornate wing shields */}
        <path d="M4 25 L0 50 L8 72 L14 40 Z" fill="#D97706" opacity="0.7" />
        <path d="M8 30 L5 48 L10 62 L13 42 Z" fill="#F59E0B" opacity="0.4" />
        <path d="M2 35 L-2 28 L6 22" fill="none" stroke="#FDE68A" strokeWidth="1" opacity="0.5" />
        <path d="M96 25 L100 50 L92 72 L86 40 Z" fill="#D97706" opacity="0.7" />
        <path d="M92 30 L95 48 L90 62 L87 42 Z" fill="#F59E0B" opacity="0.4" />
        <path d="M98 35 L102 28 L94 22" fill="none" stroke="#FDE68A" strokeWidth="1" opacity="0.5" />

        {/* Crown with jewels */}
        <polygon points="50,0 46,12 54,12" fill="#FDE68A" />
        <polygon points="34,3 31,14 38,11" fill="#F59E0B" />
        <polygon points="66,3 69,14 62,11" fill="#F59E0B" />
        <polygon points="22,8 21,16 27,13" fill="#D97706" />
        <polygon points="78,8 79,16 73,13" fill="#D97706" />
        {/* Jewels */}
        <circle cx="50" cy="6" r="1.5" fill="#EF4444" opacity="0.8" />
        <circle cx="38" cy="9" r="1" fill="#3B82F6" opacity="0.6" />
        <circle cx="62" cy="9" r="1" fill="#3B82F6" opacity="0.6" />

        {/* Frame borders */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="#F59E0B" strokeWidth="2.5" opacity="0.6" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#FDE68A" strokeWidth="0.5" opacity="0.4" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </div>
  );
}
