import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAmizades, BladerAmigo } from '@/hooks/useAmizades';
import { BuscarBladerModal } from './BuscarBladerModal';

const ELOS_COR: Record<string, string> = {
  Ferro: '#9CA3AF', Bronze: '#CD7F32', Prata: '#C0C0C0',
  Ouro: '#F59E0B', Platina: '#00DCFF', Diamante: '#A78BFA',
};

export function PainelAmigos() {
  const { amigos, amigosOnline, amigosOffline } = useAmizades();
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<BladerAmigo | null>(null);
  const [modalBusca, setModalBusca] = useState(false);
  const navigate = useNavigate();

  const filtrar = (lista: BladerAmigo[]) =>
    !busca ? lista : lista.filter(a => (a.nome_blader || '').toLowerCase().includes(busca.toLowerCase()));

  const onOnline = filtrar(amigosOnline);
  const offOff = filtrar(amigosOffline);

  return (
    <>
      <div style={{
        width: 240, flexShrink: 0,
        background: '#08091a',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 14, overflow: 'hidden',
        position: 'sticky', top: 14,
        maxHeight: 'calc(100vh - 80px)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 13px',
          borderBottom: '1px solid rgba(255,255,255,.05)',
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' }}>
            Amigos
            <span style={{
              marginLeft: 7, padding: '1px 6px', borderRadius: 20,
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)',
              color: 'rgba(255,255,255,.4)', fontSize: 9, fontWeight: 700,
            }}>{amigos.length}</span>
          </div>
          <button onClick={() => setModalBusca(true)} style={{
            padding: '4px 10px', borderRadius: 7,
            background: 'rgba(0,220,255,.08)',
            border: '1px solid rgba(0,220,255,.2)',
            color: '#00DCFF', fontSize: 11, fontWeight: 700,
            fontFamily: 'Rajdhani,sans-serif', cursor: 'pointer',
          }}>+ Add</button>
        </div>

        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,.04)', flexShrink: 0 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar nos amigos..."
            style={{
              width: '100%', padding: '6px 10px',
              background: '#111827', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 8, color: '#E2E8F0', fontSize: 11, outline: 'none',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {amigos.length === 0 ? (
            <div style={{ padding: '28px 14px', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 12 }}>
              <div style={{ fontSize: 24, opacity: .2, marginBottom: 8 }}>👥</div>
              Nenhum amigo ainda
              <div onClick={() => setModalBusca(true)} style={{ marginTop: 10, fontSize: 11, color: 'rgba(0,220,255,.5)', cursor: 'pointer' }}>
                Adicionar amigos →
              </div>
            </div>
          ) : (
            <>
              {onOnline.length > 0 && (
                <>
                  <div style={{ padding: '6px 12px 3px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
                    Online ({onOnline.length})
                  </div>
                  {onOnline.map(a => <AmigoRow key={a.id} amigo={a} onClick={() => setSelecionado(a)} />)}
                </>
              )}
              {offOff.length > 0 && (
                <>
                  <div style={{ padding: '8px 12px 3px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
                    Offline ({offOff.length})
                  </div>
                  {offOff.map(a => <AmigoRow key={a.id} amigo={a} onClick={() => setSelecionado(a)} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <BuscarBladerModal aberto={modalBusca} onFechar={() => setModalBusca(false)} />

      {selecionado && (
        <CardAmigoExpandido
          amigo={selecionado}
          onFechar={() => setSelecionado(null)}
          onDesafiar={() => { navigate('/blader/torre-x'); setSelecionado(null); }}
          onVerPerfil={() => { navigate(`/blader/perfil/${selecionado.id}`); setSelecionado(null); }}
        />
      )}
    </>
  );
}

function AmigoRow({ amigo, onClick }: { amigo: BladerAmigo; onClick: () => void }) {
  const eloCor = ELOS_COR[amigo.elo?.elo || 'Ferro'] || '#9CA3AF';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 11px', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,.03)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: amigo.avatar_blader_url ? `url(${amigo.avatar_blader_url}) center/cover` : `${eloCor}18`,
          border: `1.5px solid ${eloCor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: eloCor, overflow: 'hidden',
        }}>
          {!amigo.avatar_blader_url && (amigo.nome_blader?.charAt(0) || '?')}
        </div>
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 9, height: 9, borderRadius: '50%',
          background: amigo.online ? '#10B981' : '#374151',
          border: '1.5px solid #08091a',
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Rajdhani,sans-serif', fontWeight: 600,
          fontSize: 12, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{amigo.nome_blader || 'Blader'}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>
          {amigo.elo?.elo || 'Ferro'} · Andar {amigo.torre?.andar || 1}
        </div>
      </div>
    </div>
  );
}

function CardAmigoExpandido({ amigo, onFechar, onDesafiar, onVerPerfil }: {
  amigo: BladerAmigo;
  onFechar: () => void;
  onDesafiar: () => void;
  onVerPerfil: () => void;
}) {
  const { removerAmigo, amigosEmComum } = useAmizades();
  const { user } = useAuth();
  const [comuns, setComuns] = useState<BladerAmigo[]>([]);
  const [meuElo, setMeuElo] = useState<any>(null);
  const [meuTorre, setMeuTorre] = useState<any>(null);
  const [meuWinrate, setMeuWinrate] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const c = await amigosEmComum(amigo.id);
      if (!cancelled) setComuns(c);

      const [perfRes, eloRes, torreRes] = await Promise.all([
        supabase.from('profiles').select('xp_total, vitorias_total, torneios_total').eq('id', user.id).maybeSingle(),
        supabase.from('elo_bladers').select('pontos, elo').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('torre_x_pontos').select('andar').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      const p: any = perfRes.data;
      setMeuElo(eloRes.data);
      setMeuTorre(torreRes.data);
      setMeuWinrate((p?.torneios_total ?? 0) > 0
        ? Math.round(((p.vitorias_total ?? 0) / p.torneios_total) * 100) : 0);
    })();
    return () => { cancelled = true; };
  }, [amigo.id, user, amigosEmComum]);

  const eloCor = ELOS_COR[amigo.elo?.elo || 'Ferro'] || '#9CA3AF';
  const amigoWinrate = (amigo.torneios_total ?? 0) > 0
    ? Math.round(((amigo.vitorias_total ?? 0) / (amigo.torneios_total ?? 1)) * 100) : 0;

  const comparativos = [
    { lbl: 'Winrate', voce: meuWinrate, ele: amigoWinrate, sufixo: '%' },
    { lbl: 'Torre X', voce: meuTorre?.andar || 0, ele: amigo.torre?.andar || 0, sufixo: '' },
    { lbl: 'ELO pts', voce: meuElo?.pontos || 0, ele: amigo.elo?.pontos || 0, sufixo: '' },
  ];

  return (
    <>
      <div onClick={onFechar} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 201, width: 'calc(100% - 32px)', maxWidth: 360,
        background: '#0d1120',
        border: `1px solid ${eloCor}30`,
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px',
          background: 'rgba(255,255,255,.02)',
          borderBottom: '1px solid rgba(255,255,255,.05)',
        }}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
            Perfil do amigo
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: amigo.avatar_blader_url ? `url(${amigo.avatar_blader_url}) center/cover` : `${eloCor}18`,
              border: `3px solid ${eloCor}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: eloCor, overflow: 'hidden',
            }}>
              {!amigo.avatar_blader_url && (amigo.nome_blader?.charAt(0) || '?')}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 3 }}>
                {amigo.nome_blader || 'Blader'}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {amigo.elo && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 5,
                    background: `${eloCor}15`, color: eloCor,
                    border: `1px solid ${eloCor}25`, fontSize: 10, fontWeight: 700,
                  }}>{amigo.elo.elo}</span>
                )}
                {amigo.torre && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 5,
                    background: 'rgba(245,158,11,.1)', color: '#F59E0B',
                    border: '1px solid rgba(245,158,11,.2)', fontSize: 10, fontWeight: 700,
                  }}>🗼 Andar {amigo.torre.andar}</span>
                )}
              </div>
              {(amigo.cidade_blader || amigo.estado_blader) && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
                  📍 {[amigo.cidade_blader, amigo.estado_blader].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
            {[
              { v: `${amigoWinrate}%`, l: 'Winrate', c: '#34D399' },
              { v: amigo.torneios_total || 0, l: 'Torneios', c: '#F59E0B' },
              { v: `+${amigo.xp_total || 0}`, l: 'XP total', c: '#A78BFA' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 8, background: 'rgba(255,255,255,.03)',
                borderRadius: 9, textAlign: 'center',
                border: '1px solid rgba(255,255,255,.05)',
              }}>
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 16, color: s.c, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 10 }}>
            Você vs {amigo.nome_blader?.split(' ')[0] || 'Amigo'}
          </div>
          {comparativos.map((c, i) => {
            const max = Math.max(c.voce, c.ele, 1);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', width: 50, flexShrink: 0 }}>{c.lbl}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#F87171', width: 36, textAlign: 'right', flexShrink: 0 }}>
                  {c.ele}{c.sufixo}
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: '2px 0 0 2px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ height: '100%', background: '#EF4444', width: `${(c.ele / max) * 100}%` }} />
                  </div>
                  <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,.2)', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: '0 2px 2px 0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#00DCFF', width: `${(c.voce / max) * 100}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#00DCFF', width: 36, flexShrink: 0 }}>
                  {c.voce}{c.sufixo}
                </span>
              </div>
            );
          })}

          {comuns.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
              👥 {comuns.length} amigo{comuns.length !== 1 ? 's' : ''} em comum:{' '}
              {comuns.slice(0, 2).map(c => c.nome_blader).join(', ')}
              {comuns.length > 2 && ` e mais ${comuns.length - 2}`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 7, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <button onClick={onDesafiar} style={{
            flex: 1, padding: 9, borderRadius: 9,
            background: 'rgba(239,68,68,.1)',
            border: '1px solid rgba(239,68,68,.2)',
            color: '#F87171', fontFamily: 'Rajdhani,sans-serif',
            fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
          }}>⚔️ Torre X</button>
          <button onClick={onVerPerfil} style={{
            flex: 1, padding: 9, borderRadius: 9,
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.08)',
            color: 'rgba(255,255,255,.5)', fontFamily: 'Rajdhani,sans-serif',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>Ver perfil</button>
          <button
            onClick={() => { if (amigo.amizadeId) removerAmigo(amigo.amizadeId); onFechar(); }}
            style={{
              padding: '9px 12px', borderRadius: 9,
              background: 'rgba(239,68,68,.06)',
              border: '1px solid rgba(239,68,68,.12)',
              color: 'rgba(239,68,68,.5)', cursor: 'pointer', fontSize: 12,
            }}
            title="Remover amigo"
          >🗑</button>
        </div>
      </div>
    </>
  );
}
