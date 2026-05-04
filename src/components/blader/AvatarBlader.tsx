interface Props {
  url?: string | null;
  nome?: string | null;
  size?: number;
  cor?: string;
  borderColor?: string;
}

/**
 * Avatar leve para listagens internas do dashboard. Usa foto real
 * (avatar_blader_url) ou cai para a inicial do nome.
 * Para o avatar "principal" do app, prefira <BladerAvatar>.
 */
export default function AvatarBlader({
  url, nome, size = 40,
  cor = 'rgba(0,220,255,.15)',
  borderColor = 'rgba(0,220,255,.3)',
}: Props) {
  const isPhoto = !!url && (url.startsWith('http') || url.startsWith('data:'));
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isPhoto ? `url(${url}) center/cover` : cor,
      border: `2px solid ${borderColor}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      overflow: 'hidden',
    }}>
      {!isPhoto && (nome?.charAt(0)?.toUpperCase() || '?')}
    </div>
  );
}
