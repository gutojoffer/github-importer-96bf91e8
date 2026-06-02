import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Search, UserPlus, Bell, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAmizades, BladerAmigo } from '@/hooks/useAmizades';
import { BuscarBladerModal } from './BuscarBladerModal';

const ELOS_COR: Record<string, string> = {
  Ferro: '#9CA3AF', Bronze: '#CD7F32', Prata: '#C0C0C0',
  Ouro: '#F59E0B', Platina: '#00DCFF', Diamante: '#A78BFA',
};

const STORAGE_KEY = 'blader.painelAmigos.colapsado';
const WIDTH_OPEN = 264;
const WIDTH_COLLAPSED = 60;

/** Hook compartilhado: lê/escreve o estado de colapso em localStorage e dispara evento entre instâncias. */
export function usePainelAmigosColapsado() {
  const [colapsado, setColapsado] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setColapsado(e.newValue === '1');
    };
    const onCustom = (e: Event) => {
      setColapsado((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('blader:painelAmigos:toggle' as any, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('blader:painelAmigos:toggle' as any, onCustom);
    };
  }, []);

  const setAndPersist = useCallback((v: boolean) => {
    setColapsado(v);
    localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    window.dispatchEvent(new CustomEvent('blader:painelAmigos:toggle', { detail: v }));
  }, []);

  return { colapsado, setColapsado: setAndPersist, larguraPainel: colapsado ? WIDTH_COLLAPSED : WIDTH_OPEN };
}

export function PainelAmigos({ drawer = false, onFechar }: { drawer?: boolean; onFechar?: () => void } = {}) {
  const { amigos, amigosOnline, amigosOffline, pendentes } = useAmizades();
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<BladerAmigo | null>(null);
  const [modalBusca, setModalBusca] = useState(false);
  const navigate = useNavigate();
  const { colapsado, setColapsado } = usePainelAmigosColapsado();

  // No modo drawer (mobile) sempre abre expandido
  const isCollapsed = drawer ? false : colapsado;

  const filtrar = (lista: BladerAmigo[]) =>
    !busca ? lista : lista.filter(a => (a.nome_blader || '').toLowerCase().includes(busca.toLowerCase()));

  const onOnline = filtrar(amigosOnline);
  const offOff = filtrar(amigosOffline);
  const totalNotificacoes = pendentes.length;

  return (
    <>
      {drawer && (
        <div
          onClick={onFechar}
          title="Fechar"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
            zIndex: 60, cursor: 'pointer',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
            padding: 16,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onFechar?.(); }}
            aria-label="Fechar amigos"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.15)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}


      <aside style={{
        position: 'fixed',
        top: drawer ? 0 : 54,
        right: 0,
        width: drawer ? 'min(86vw, 320px)' : (isCollapsed ? WIDTH_COLLAPSED : WIDTH_OPEN),
        height: drawer ? '100vh' : 'calc(100vh - 54px)',
        background: 'linear-gradient(180deg, #0a0d1a 0%, #07091a 100%)',
        borderLeft: '1px solid rgba(255,255,255,.06)',
        display: 'flex', flexDirection: 'column',
        zIndex: drawer ? 70 : 40,
        boxShadow: drawer ? '-8px 0 32px rgba(0,0,0,.5)' : 'none',
        transition: 'width .22s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
      }}>
        {/* Botão de colapso flutuante (apenas desktop) */}
        {!drawer && (
          <button
            onClick={() => setColapsado(!colapsado)}
            title={isCollapsed ? 'Expandir amigos' : 'Recolher amigos'}
            style={{
              position: 'absolute', top: 14, left: -12, zIndex: 2,
              width: 24, height: 24, borderRadius: '50%',
              background: '#0d1120', border: '1px solid rgba(0,220,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#00DCFF', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)',
            }}
          >
            {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        {isCollapsed ? (
          <CollapsedRail
            amigosOnline={amigosOnline}
            totalNotificacoes={totalNotificacoes}
            onAbrir={() => setColapsado(false)}
            onAdd={() => { setColapsado(false); setModalBusca(true); }}
            onSelecionar={a => { setColapsado(false); setSelecionado(a); }}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,.05)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="font-heading" style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: 0.3 }}>
                  Amigos
                </span>
                <span style={{
                  padding: '1px 7px', borderRadius: 999,
                  background: 'rgba(0,220,255,.1)',
                  border: '1px solid rgba(0,220,255,.25)',
                  color: '#00DCFF', fontSize: 10, fontWeight: 700,
                }}>{amigos.length}</span>
                {totalNotificacoes > 0 && (
                  <span title={`${totalNotificacoes} pedido(s) de amizade`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '1px 7px', borderRadius: 999,
                    background: 'rgba(255,45,85,.14)',
                    border: '1px solid rgba(255,45,85,.35)',
                    color: '#FF6B7A', fontSize: 10, fontWeight: 700,
                  }}>
                    <Bell size={9} /> {totalNotificacoes}
                  </span>
                )}
              </div>
              <button onClick={() => setModalBusca(true)} title="Adicionar amigo" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 9px', borderRadius: 7,
                background: 'rgba(0,220,255,.08)',
                border: '1px solid rgba(0,220,255,.22)',
                color: '#00DCFF', fontSize: 11, fontWeight: 700,
                fontFamily: 'Rajdhani,sans-serif', cursor: 'pointer',
              }}>
                <UserPlus size={11} /> Add
              </button>
            </div>

            {/* Notificação destacada quando há pedidos */}
            {totalNotificacoes > 0 && (
              <button
                onClick={() => navigate('/blader/home')}
                style={{
                  margin: '8px 10px 4px',
                  padding: '8px 10px',
                  background: 'linear-gradient(90deg, rgba(255,45,85,.14), rgba(255,45,85,.04))',
                  border: '1px solid rgba(255,45,85,.3)',
                  borderRadius: 9,
                  color: '#FFB4BC',
                  fontSize: 11.5, fontWeight: 600, fontFamily: 'Montserrat,sans-serif',
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                <span style={{ fontSize: 14 }}>👋</span>
                <span style={{ flex: 1 }}>
                  {totalNotificacoes} novo{totalNotificacoes > 1 ? 's' : ''} pedido{totalNotificacoes > 1 ? 's' : ''} de amizade
                </span>
              </button>
            )}

            {/* Search */}
            <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(255,255,255,.04)', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)' }} />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar nos amigos..."
                  style={{
                    width: '100%', padding: '7px 10px 7px 26px',
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.07)',
                    borderRadius: 8, color: '#E2E8F0', fontSize: 11.5, outline: 'none',
                    fontFamily: 'Montserrat,sans-serif',
                  }}
                />
              </div>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {amigos.length === 0 ? (
                <div style={{ padding: '34px 14px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 12 }}>
                  <div style={{ fontSize: 28, opacity: .25, marginBottom: 10 }}>👥</div>
                  Nenhum amigo ainda
                  <div onClick={() => setModalBusca(true)} style={{ marginTop: 12, fontSize: 11.5, color: '#00DCFF', cursor: 'pointer', fontWeight: 600 }}>
                    Adicionar amigos →
                  </div>
                </div>
              ) : (
                <>
                  {onOnline.length > 0 && (
                    <>
                      <SectionHeader label={`Online · ${onOnline.length}`} dotColor="#10B981" />
                      {onOnline.map(a => <AmigoRow key={a.id} amigo={a} onClick={() => setSelecionado(a)} />)}
                    </>
                  )}
                  {offOff.length > 0 && (
                    <>
                      <SectionHeader label={`Offline · ${offOff.length}`} dotColor="#374151" />
                      {offOff.map(a => <AmigoRow key={a.id} amigo={a} onClick={() => setSelecionado(a)} />)}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </aside>

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

function SectionHeader({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 14px 4px', fontSize: 9.5, fontWeight: 700,
      letterSpacing: 1.5, textTransform: 'uppercase',
      color: 'rgba(255,255,255,.32)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
      {label}
    </div>
  );
}

function CollapsedRail({
  amigosOnline, totalNotificacoes, onAbrir, onAdd, onSelecionar,
}: {
  amigosOnline: BladerAmigo[];
  totalNotificacoes: number;
  onAbrir: () => void;
  onAdd: () => void;
  onSelecionar: (a: BladerAmigo) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 8, flex: 1 }}>
      <button onClick={onAbrir} title="Amigos" style={{
        position: 'relative',
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(0,220,255,.08)',
        border: '1px solid rgba(0,220,255,.2)',
        color: '#00DCFF', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        👥
        {totalNotificacoes > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 999,
            background: '#FF2D55',
            color: '#fff', fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #07091a',
            fontFamily: 'Montserrat,sans-serif',
          }}>{totalNotificacoes > 9 ? '9+' : totalNotificacoes}</span>
        )}
      </button>

      <button onClick={onAdd} title="Adicionar amigo" style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.08)',
        color: 'rgba(255,255,255,.55)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <UserPlus size={15} />
      </button>

      <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 0' }} />

      {/* Avatares dos amigos online */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, padding: '0 0 12px', alignItems: 'center', width: '100%' }}>
        {amigosOnline.slice(0, 14).map(a => {
          const eloCor = ELOS_COR[a.elo?.elo || 'Ferro'] || '#9CA3AF';
          return (
            <button key={a.id} onClick={() => onSelecionar(a)} title={a.nome_blader || 'Blader'} style={{
              position: 'relative', width: 36, height: 36, borderRadius: '50%',
              padding: 0, border: `1.5px solid ${eloCor}50`,
              background: a.avatar_blader_url ? `url(${a.avatar_blader_url}) center/cover` : `${eloCor}22`,
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: eloCor, fontSize: 12, fontWeight: 700, fontFamily: 'Rajdhani,sans-serif',
            }}>
              {!a.avatar_blader_url && (a.nome_blader?.charAt(0) || '?')}
              <span style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 9, height: 9, borderRadius: '50%',
                background: '#10B981', border: '2px solid #07091a',
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AmigoRow({ amigo, onClick }: { amigo: BladerAmigo; onClick: () => void }) {
  const eloCor = ELOS_COR[amigo.elo?.elo || 'Ferro'] || '#9CA3AF';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 12px', cursor: 'pointer',
        borderRadius: 8, margin: '1px 6px',
        transition: 'background .12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: amigo.avatar_blader_url ? `url(${amigo.avatar_blader_url}) center/cover` : `${eloCor}22`,
          border: `1.5px solid ${eloCor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: eloCor, overflow: 'hidden',
          fontFamily: 'Rajdhani,sans-serif',
        }}>
          {!amigo.avatar_blader_url && (amigo.nome_blader?.charAt(0) || '?')}
        </div>
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 9, height: 9, borderRadius: '50%',
          background: amigo.online ? '#10B981' : '#374151',
          border: '2px solid #07091a',
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Rajdhani,sans-serif', fontWeight: 600,
          fontSize: 12.5, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{amigo.nome_blader || 'Blader'}</div>
        <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.32)', marginTop: 1 }}>
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
