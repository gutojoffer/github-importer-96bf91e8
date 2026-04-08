export default function ArenaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #090b12 70%)' }}>
      {/* Animated diagonal lines */}
      <div className="arena-line arena-line-blue" />
      <div className="arena-line arena-line-red" />

      {/* Orbital particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`arena-particle ${i % 2 === 0 ? 'arena-particle-blue' : 'arena-particle-red'}`}
          style={{
            '--orbit-delay': `${i * -1.5}s`,
            '--orbit-size': `${120 + i * 25}px`,
            '--orbit-duration': `${8 + i * 2}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
