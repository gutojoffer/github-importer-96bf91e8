import { useEffect, useRef, useState } from 'react';
import { useAmizades, BladerAmigo } from '@/hooks/useAmizades';

const ELOS_COR: Record<string, string> = {
  Ferro: '#9CA3AF', Bronze: '#CD7F32', Prata: '#C0C0C0',
  Ouro: '#F59E0B', Platina: '#00DCFF', Diamante: '#A78BFA',
};

export function BuscarBladerModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<BladerAmigo[]>([]);
  const [loading, setLoading] = useState(false);
  const { enviarSolicitacao, buscarBladers } = useAmizades();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) setTimeout(() => inputRef.current?.focus(), 100);
    else { setBusca(''); setResultados([]); }
  }, [aberto]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (busca.length < 2) { setResultados([]); return; }
      setLoading(true);
      const res = await buscarBladers(busca);
      setResultados(res);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca, buscarBladers]);

  if (!aberto) return null;

  async function handleAdicionar(id: string) {
    const ok = await enviarSolicitacao(id);
    if (ok) {
      setResultados(prev => prev.map(b => b.id === id ? { ...b, pendente: true } : b));
    }
  }

  return (
    <>
      <div onClick={onFechar} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 201, width: 'calc(100% - 32px)', maxWidth: 460,
        background: '#0d1120',
        border: '1px solid rgba(0,220,255,.2)',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,.06)',
        }}>
          <div style={{
            fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
            fontSize: 16, color: '#fff', letterSpacing: 1,
          }}>
            Adicionar amigo
          </div>
          <button onClick={onFechar} style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 22, lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', fontSize: 15, opacity: .35,
            }}>🔍</span>
            <input
              ref={inputRef}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar pelo nick do blader..."
              style={{
                width: '100%', padding: '10px 14px 10px 38px',
                background: '#111827',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10, color: '#E2E8F0', fontSize: 13, outline: 'none',
              }}
            />
          </div>
          {busca.length > 0 && busca.length < 2 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 6, paddingLeft: 4 }}>
              Digite pelo menos 2 caracteres...
            </div>
          )}
        </div>

        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
              Buscando...
            </div>
          )}

          {!loading && busca.length >= 2 && resultados.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
              <div style={{ fontSize: 28, opacity: .2, marginBottom: 8 }}>🔍</div>
              Nenhum blader encontrado para "{busca}"
            </div>
          )}

          {resultados.map(blader => {
            const eloCor = ELOS_COR[blader.elo?.elo || 'Ferro'] || '#9CA3AF';
            return (
              <div key={blader.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,.04)',
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                  background: blader.avatar_blader_url
                    ? `url(${blader.avatar_blader_url}) center/cover`
                    : `${eloCor}20`,
                  border: `2px solid ${eloCor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: eloCor, overflow: 'hidden',
                }}>
                  {!blader.avatar_blader_url && (blader.nome_blader?.charAt(0) || '?')}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
                    fontSize: 15, color: '#fff', marginBottom: 2,
                  }}>
                    {blader.nome_blader}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(blader.cidade_blader || blader.estado_blader) && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>
                        📍 {[blader.cidade_blader, blader.estado_blader].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    {blader.elo && (
                      <span style={{
                        padding: '1px 6px', borderRadius: 4,
                        background: `${eloCor}15`, color: eloCor,
                        border: `1px solid ${eloCor}25`,
                        fontSize: 9, fontWeight: 700, letterSpacing: .5,
                      }}>
                        {blader.elo.elo}
                      </span>
                    )}
                    {blader.torre && (
                      <span style={{
                        padding: '1px 6px', borderRadius: 4,
                        background: 'rgba(245,158,11,.1)', color: '#F59E0B',
                        border: '1px solid rgba(245,158,11,.2)',
                        fontSize: 9, fontWeight: 700,
                      }}>
                        🗼 Andar {blader.torre.andar}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 2 }}>
                    {blader.torneios_total || 0} torneios · {blader.xp_total || 0} XP
                  </div>
                </div>

                {blader.jaAmigo ? (
                  <div style={{
                    padding: '5px 12px', borderRadius: 8,
                    background: 'rgba(16,185,129,.08)',
                    border: '1px solid rgba(16,185,129,.15)',
                    color: '#34D399', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>✓ Amigos</div>
                ) : blader.pendente ? (
                  <div style={{
                    padding: '5px 12px', borderRadius: 8,
                    background: 'rgba(245,158,11,.08)',
                    border: '1px solid rgba(245,158,11,.15)',
                    color: '#FCD34D', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>⏳ Pendente</div>
                ) : (
                  <button
                    onClick={() => handleAdicionar(blader.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      background: 'rgba(0,220,255,.1)',
                      border: '1px solid rgba(0,220,255,.25)',
                      color: '#00DCFF', fontSize: 12, fontWeight: 700,
                      fontFamily: 'Rajdhani,sans-serif', letterSpacing: 1,
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >+ Adicionar</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
