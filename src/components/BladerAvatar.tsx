import { CSSProperties, useMemo } from 'react';
import { getBladerGradient, getBladerPalette, type BladerColorKey } from '@/lib/bladerColors';

interface BladerAvatarProps {
  /** URL da foto. Aceita http(s), data: e undefined/null. */
  url?: string | null;
  /** Nome usado para gerar iniciais quando não há foto. */
  name?: string | null;
  /** Cor do perfil (key da paleta). Default: azul. */
  colorKey?: string | null;
  /** Tamanho em pixels (lado do quadrado). Default: 40. */
  size?: number;
  /** Espessura da borda em pixels. Default: 2. */
  borderWidth?: number;
  /** Se deve renderizar com sombra colorida (para perfis em destaque). */
  glow?: boolean;
  /** Classe extra. */
  className?: string;
  /** Style extra (sobrescreve). */
  style?: CSSProperties;
}

/**
 * Avatar reutilizável do Blader.
 * - Se `url` for um http/data, mostra a foto com borda na cor do perfil.
 * - Caso contrário, gera iniciais sobre um fundo gradiente da cor escolhida.
 *
 * Aceita também emojis em `url` (ex: '🔵') — caso comum para players legados.
 */
export default function BladerAvatar({
  url,
  name,
  colorKey,
  size = 40,
  borderWidth = 2,
  glow = false,
  className,
  style,
}: BladerAvatarProps) {
  const palette = getBladerPalette(colorKey);
  const isPhoto = !!url && (url.startsWith('http') || url.startsWith('data:'));
  const isEmoji = !!url && !isPhoto && url.length <= 4; // 1-2 emojis

  const initials = useMemo(() => {
    const src = (name || '??').trim();
    if (!src) return '??';
    const parts = src.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: `${borderWidth}px solid ${palette.accent}`,
    boxShadow: glow ? `0 8px 24px ${palette.accent}40` : undefined,
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: getBladerGradient(colorKey),
    ...style,
  };

  if (isPhoto) {
    return (
      <div className={className} style={baseStyle}>
        <img
          src={url!}
          alt={name || 'Blader'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </div>
    );
  }

  const fontSize = Math.max(10, Math.round(size * (isEmoji ? 0.55 : 0.36)));
  return (
    <div className={className} style={baseStyle} aria-label={name || 'Blader'}>
      <span
        className="font-heading font-bold text-white select-none"
        style={{ fontSize, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,.4)' }}
      >
        {isEmoji ? url : initials}
      </span>
    </div>
  );
}
