interface Props { size: number; animated?: boolean }

export default function FramePrata({ size, animated = true }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={animated ? 'animate-pulse-prata' : ''}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      {/* Base with pendant */}
      <path d="M18 88 Q50 96 82 88" fill="none" stroke="#B0B8C8" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="50,90 47,97 53,97" fill="#B0B8C8" />

      {/* Double side shields */}
      <path d="M6 28 L2 50 L10 68 L14 42 Z" fill="#B0B8C8" opacity="0.6" />
      <path d="M10 32 L7 48 L12 60 L14 44 Z" fill="#F0F0F0" opacity="0.3" />
      <path d="M94 28 L98 50 L90 68 L86 42 Z" fill="#B0B8C8" opacity="0.6" />
      <path d="M90 32 L93 48 L88 60 L86 44 Z" fill="#F0F0F0" opacity="0.3" />

      {/* 4 crystalline points */}
      <polygon points="50,1 47,12 53,12" fill="#F0F0F0" />
      <polygon points="35,4 33,14 39,12" fill="#B0B8C8" />
      <polygon points="65,4 67,14 61,12" fill="#B0B8C8" />
      <polygon points="50,0 48,8 52,8" fill="#F0F0F0" opacity="0.6" />

      {/* Corner crystals */}
      <path d="M16 16 L12 10 L18 7" fill="none" stroke="#6B7280" strokeWidth="1.5" />
      <path d="M84 16 L88 10 L82 7" fill="none" stroke="#6B7280" strokeWidth="1.5" />

      {/* Frame border */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="#B0B8C8" strokeWidth="2" opacity="0.5" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#F0F0F0" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
