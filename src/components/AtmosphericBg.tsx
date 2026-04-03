import { memo } from 'react';

interface AtmosphericBgProps {
  image: string;
  tint?: string;
}

const AtmosphericBg = memo(({ image, tint }: AtmosphericBgProps) => (
  <div
    className="fixed inset-0 pointer-events-none z-0 overflow-hidden anim-atmospheric"
    aria-hidden="true"
    style={{ willChange: 'opacity, transform' }}
  >
    <img
      src={image}
      alt=""
      loading="lazy"
      width={1024}
      height={1024}
      className="absolute bottom-0 right-0 w-[70vh] max-w-[600px] h-auto object-contain select-none"
      style={{
        opacity: 0.12,
        mixBlendMode: 'screen',
        filter: tint ? `drop-shadow(0 0 80px ${tint})` : undefined,
      }}
      draggable={false}
    />
  </div>
));

AtmosphericBg.displayName = 'AtmosphericBg';
export default AtmosphericBg;
