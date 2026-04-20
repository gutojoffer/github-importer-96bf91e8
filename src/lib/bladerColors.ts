/**
 * Paleta de cores personalizáveis para o perfil do Blader.
 * Cada cor define um gradient (from → to) + uma cor de destaque (accent).
 * Usadas em: header do perfil, borda da foto, stats, badges, sidebar/topbar.
 */

export type BladerColorKey =
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'green'
  | 'teal'
  | 'gold';

export interface BladerColorPalette {
  key: BladerColorKey;
  label: string;
  from: string;
  to: string;
  accent: string;
  /** Fundo translúcido para badges/cards. */
  soft: string;
  /** Borda translúcida (~40% opacity do accent). */
  border: string;
}

export const BLADER_COLORS: Record<BladerColorKey, BladerColorPalette> = {
  blue:   { key: 'blue',   label: 'Azul',    from: '#1e3a8a', to: '#2563EB', accent: '#60A5FA', soft: 'rgba(96,165,250,.12)',  border: 'rgba(96,165,250,.4)'  },
  purple: { key: 'purple', label: 'Roxo',    from: '#4c1d95', to: '#7C3AED', accent: '#A78BFA', soft: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.4)' },
  pink:   { key: 'pink',   label: 'Rosa',    from: '#831843', to: '#EC4899', accent: '#F9A8D4', soft: 'rgba(249,168,212,.12)', border: 'rgba(249,168,212,.4)' },
  red:    { key: 'red',    label: 'Vermelho',from: '#7f1d1d', to: '#DC2626', accent: '#F87171', soft: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.4)' },
  orange: { key: 'orange', label: 'Laranja', from: '#7c2d12', to: '#EA580C', accent: '#FB923C', soft: 'rgba(251,146,60,.12)',  border: 'rgba(251,146,60,.4)'  },
  green:  { key: 'green',  label: 'Verde',   from: '#064e3b', to: '#10B981', accent: '#34D399', soft: 'rgba(52,211,153,.12)',  border: 'rgba(52,211,153,.4)'  },
  teal:   { key: 'teal',   label: 'Teal',    from: '#134e4a', to: '#0D9488', accent: '#2DD4BF', soft: 'rgba(45,212,191,.12)',  border: 'rgba(45,212,191,.4)'  },
  gold:   { key: 'gold',   label: 'Ouro',    from: '#78350f', to: '#D97706', accent: '#FCD34D', soft: 'rgba(252,211,77,.12)',  border: 'rgba(252,211,77,.4)'  },
};

export const BLADER_COLOR_KEYS = Object.keys(BLADER_COLORS) as BladerColorKey[];

/** Retorna a paleta da cor escolhida, com fallback para azul. */
export function getBladerPalette(key?: string | null): BladerColorPalette {
  if (key && key in BLADER_COLORS) return BLADER_COLORS[key as BladerColorKey];
  return BLADER_COLORS.blue;
}

/** Gradient CSS pronto para usar em backgrounds. */
export function getBladerGradient(key?: string | null, angle = 135): string {
  const p = getBladerPalette(key);
  return `linear-gradient(${angle}deg, ${p.from} 0%, ${p.to} 100%)`;
}

/** Gradient mais rico para o header do perfil (3 cores). */
export function getBladerHeaderGradient(key?: string | null): string {
  const p = getBladerPalette(key);
  return `linear-gradient(135deg, ${p.from} 0%, ${p.to} 50%, ${p.from} 100%)`;
}
