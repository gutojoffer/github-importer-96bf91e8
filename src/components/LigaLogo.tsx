import { useLiga } from '@/contexts/LigaContext';
import { Star } from 'lucide-react';

interface LigaLogoProps {
  size?: number;
  className?: string;
  fallbackIconSize?: number;
}

export default function LigaLogo({ size = 44, className = '', fallbackIconSize }: LigaLogoProps) {
  const { logoUrl } = useLiga();
  const iconSize = fallbackIconSize || Math.max(16, size * 0.45);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo da liga"
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Star className="text-white" style={{ width: iconSize, height: iconSize }} />
    </div>
  );
}
