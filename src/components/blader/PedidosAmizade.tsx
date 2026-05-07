import { useAmizades } from '@/hooks/useAmizades';

const ELOS_COR: Record<string, string> = {
  Ferro: '#9CA3AF', Bronze: '#CD7F32', Prata: '#C0C0C0',
  Ouro: '#F59E0B', Platina: '#00DCFF', Diamante: '#A78BFA',
};

export function PedidosAmizade() {
  const { pendentes, aceitarAmizade, recusarAmizade } = useAmizades();
  if (pendentes.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {pendentes.map(p => {
        const s = p.solicitante;
        const eloNome = s.elo?.elo || 'Ferro';
        const eloCor = ELOS_COR[eloNome] || '#9CA3AF';
        const winrate = (s.torneios_total ?? 0) > 0
          ? Math.round(((s.vitorias_total ?? 0) / (s.torneios_total ?? 1)) * 100) : 0;

        return (
          <div key={p.id} style={{
            background: '#0d1120',
            border: '1.5px solid rgba(0,220,255,.2)',
            borderRadius: 14, padding: 14,
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2,
              color: '#00DCFF', textTransform: 'uppercase', marginBottom: 10,
            }}>
              👋 Pedido de amizade
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: s.avatar_blader_url
                  ? `url(${s.avatar_blader_url}) center/cover`
                  : `${eloCor}18`,
                border: `2px solid ${eloCor}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: eloCor, overflow: 'hidden',
              }}>
                {!s.avatar_blader_url && (s.nome_blader?.charAt(0) || '?')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
                  fontSize: 17, color: '#fff', marginBottom: 2,
                }}>
                  {s.nome_blader || 'Blader'}
                </div>
                {(s.cidade_blader || s.estado_blader) && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                    📍 {[s.cidade_blader, s.estado_blader].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex', gap: 16, marginBottom: 12,
              padding: '10px 12px',
              background: 'rgba(255,255,255,.02)',
              borderRadius: 9, border: '1px solid rgba(255,255,255,.05)',
              justifyContent: 'space-around',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 18, color: '#34D399', lineHeight: 1 }}>{winrate}%</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>Winrate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 18, lineHeight: 1, color: eloCor }}>{eloNome}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>ELO</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 18, color: '#F59E0B', lineHeight: 1 }}>{s.torneios_total || 0}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>Torneios</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => aceitarAmizade(p.id, s.id)}
                style={{
                  flex: 1, padding: 9, borderRadius: 9,
                  background: 'rgba(16,185,129,.1)',
                  border: '1px solid rgba(16,185,129,.2)',
                  color: '#34D399', fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer',
                }}
              >✓ Aceitar</button>
              <button
                onClick={() => recusarAmizade(p.id)}
                style={{
                  flex: 1, padding: 9, borderRadius: 9,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                  color: 'rgba(255,255,255,.4)', fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >✕ Recusar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
