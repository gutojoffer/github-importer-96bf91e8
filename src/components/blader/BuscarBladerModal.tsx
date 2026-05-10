import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAmizades } from '@/hooks/useAmizades';
import { useIsMobile } from '@/hooks/use-mobile';

const ELOS_COR: Record<string, string> = {
  Ferro: '#9CA3AF', Bronze: '#CD7F32', Prata: '#C0C0C0',
  Ouro: '#F59E0B', Platina: '#00DCFF', Diamante: '#A78BFA',
};

const PROFILE_FIELDS = 'id, nome_blader, avatar_blader_url, cidade_blader, estado_blader, xp_total, vitorias_total, torneios_total';

async function enrichWithStatusEElo(bladers: any[], userId: string) {
  if (bladers.length === 0) return [];
  const ids = bladers.map(b => b.id);

  const { data: temp } = await supabase
    .from('temporadas').select('id').eq('ativa', true).maybeSingle();

  const [amizadesRes, elosRes] = await Promise.all([
    supabase.from('amizades')
      .select('solicitante_id, destinatario_id, status')
      .or(`and(solicitante_id.eq.${userId},destinatario_id.in.(${ids.join(',')})),and(destinatario_id.eq.${userId},solicitante_id.in.(${ids.join(',')}))`),
    temp?.id
      ? supabase.from('elo_bladers').select('user_id, elo, pontos').in('user_id', ids).eq('temporada_id', temp.id)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const amizades = (amizadesRes.data || []) as any[];
  const eloMap = new Map<string, any>();
  ((elosRes as any).data || []).forEach((e: any) => eloMap.set(e.user_id, e));

  return bladers.map(b => {
    const amizade = amizades.find(a =>
      (a.solicitante_id === userId && a.destinatario_id === b.id) ||
      (a.destinatario_id === userId && a.solicitante_id === b.id)
    );
    return {
      ...b,
      elo: eloMap.get(b.id) || null,
      statusAmizade: amizade?.status || null,
      jaAmigo: amizade?.status === 'aceita',
      pendente: amizade?.status === 'pendente',
    };
  });
}

export function BuscarBladerModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<any[]>([]);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [loadingRec, setLoadingRec] = useState(true);
  const { enviarSolicitacao, amigos } = useAmizades();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const carregarRecomendacoes = useCallback(async () => {
    setLoadingRec(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingRec(false); return; }

      const { data: meuPerfil } = await supabase
        .from('profiles')
        .select('cidade_blader, estado_blader')
        .eq('id', user.id)
        .maybeSingle();

      const amigosIds = new Set(amigos.map(a => a.id));
      let lista: any[] = [];

      if (meuPerfil?.cidade_blader) {
        const { data } = await supabase
          .from('profiles')
          .select(PROFILE_FIELDS)
          .eq('cidade_blader', meuPerfil.cidade_blader)
          .eq('tem_perfil_blader', true)
          .neq('id', user.id)
          .limit(10);
        lista = (data || []).filter(b => !amigosIds.has(b.id));
      }

      if (lista.length < 3 && meuPerfil?.estado_blader) {
        const { data: doEstado } = await supabase
          .from('profiles')
          .select(PROFILE_FIELDS)
          .eq('estado_blader', meuPerfil.estado_blader)
          .eq('tem_perfil_blader', true)
          .neq('id', user.id)
          .limit(10);
        const extras = (doEstado || []).filter(b =>
          !amigosIds.has(b.id) && !lista.find(n => n.id === b.id)
        );
        lista.push(...extras);
      }

      if (lista.length < 3) {
        const { data: quaisquer } = await supabase
          .from('profiles')
          .select(PROFILE_FIELDS)
          .eq('tem_perfil_blader', true)
          .neq('id', user.id)
          .order('xp_total', { ascending: false })
          .limit(10);
        const extras = (quaisquer || []).filter(b =>
          !amigosIds.has(b.id) && !lista.find(n => n.id === b.id)
        );
        lista.push(...extras);
      }

      const comStatus = await enrichWithStatusEElo(lista.slice(0, 10), user.id);
      setRecomendacoes(comStatus);
    } catch (e) {
      console.error('Erro recomendacoes:', e);
    } finally {
      setLoadingRec(false);
    }
  }, [amigos]);

  useEffect(() => {
    if (aberto) {
      carregarRecomendacoes();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setBusca('');
      setResultados([]);
    }
  }, [aberto, carregarRecomendacoes]);

  useEffect(() => {
    if (busca.length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setLoadingBusca(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setResultados([]); return; }
        const { data, error } = await supabase
          .from('profiles')
          .select(PROFILE_FIELDS)
          .ilike('nome_blader', `%${busca}%`)
          .eq('tem_perfil_blader', true)
          .neq('id', user.id)
          .limit(10);
        if (error) { console.error('Erro busca:', error); setResultados([]); return; }
        const comStatus = await enrichWithStatusEElo(data || [], user.id);
        setResultados(comStatus);
      } finally {
        setLoadingBusca(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  if (!aberto) return null;

  const mostrarBusca = busca.length >= 2;
  const lista = mostrarBusca ? resultados : recomendacoes;
  const tituloLista = mostrarBusca
    ? `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''} para "${busca}"`
    : 'Bladers da sua região';

  function handleAdicionar(id: string) {
    enviarSolicitacao(id).then(ok => {
      if (!ok) return;
      const upd = (arr: any[]) => arr.map(r => r.id === id ? { ...r, pendente: true } : r);
      setResultados(upd);
      setRecomendacoes(upd);
    });
  }

  return createPortal(
    <>
      <div onClick={onFechar} style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,.85)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 99999, width: 'calc(100% - 32px)', maxWidth: 560,
        background: '#0d1120',
        border: '1px solid rgba(0,220,255,.2)',
        borderRadius: 16,
        boxShadow: '0 32px 80px rgba(0,0,0,.9)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxHeight: '80vh',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
            fontSize: 16, color: '#fff', letterSpacing: 1,
          }}>Adicionar amigo</div>
          <button onClick={onFechar} style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)',
            color: 'rgba(255,255,255,.5)', cursor: 'pointer',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '12px 14px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', fontSize: 15, color: 'rgba(255,255,255,.3)',
            }}>🔍</span>
            <input
              ref={inputRef}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar pelo nick do blader..."
              style={{
                width: '100%', padding: '10px 34px 10px 38px',
                background: '#111827',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10, color: '#E2E8F0',
                fontSize: 13, outline: 'none',
              }}
            />
            {busca.length > 0 && (
              <button onClick={() => setBusca('')} style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: 16,
              }}>×</button>
            )}
          </div>
          {busca.length === 1 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 5, paddingLeft: 2 }}>
              Continue digitando...
            </div>
          )}
        </div>

        <div style={{
          padding: '4px 14px 8px',
          fontSize: 9, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.25)',
          flexShrink: 0,
        }}>
          {loadingBusca ? 'Buscando...' : tituloLista}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadingBusca && (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13 }}>
              <div style={{ fontSize: 24, marginBottom: 8, opacity: .3 }}>🔍</div>
              Buscando bladers...
            </div>
          )}

          {!mostrarBusca && loadingRec && (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13 }}>
              Carregando sugestões...
            </div>
          )}

          {!loadingBusca && mostrarBusca && resultados.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,.25)' }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: .2 }}>😕</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Nenhum blader encontrado</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>
                Verifique o nick e tente novamente
              </div>
            </div>
          )}

          {!mostrarBusca && !loadingRec && recomendacoes.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13 }}>
              Sem sugestões por enquanto. Use a busca acima!
            </div>
          )}

          {!loadingBusca && lista.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 8,
              padding: '10px 14px 14px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,220,255,.1) transparent',
            }}>
              {lista.map(blader => (
                <BuscarBladerCard
                  key={blader.id}
                  blader={blader}
                  onAdicionar={() => handleAdicionar(blader.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

function BuscarBladerCard({ blader, onAdicionar }: { blader: any; onAdicionar: () => void }) {
  const eloCor = ELOS_COR[blader.elo?.elo || 'Ferro'] || '#9CA3AF';

  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 12,
      padding: '12px 10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 7,
      textAlign: 'center',
      transition: 'border-color .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,220,255,.18)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: blader.avatar_blader_url
          ? `url(${blader.avatar_blader_url}) center/cover`
          : `${eloCor}15`,
        border: `2px solid ${eloCor}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700, color: eloCor, overflow: 'hidden',
        flexShrink: 0,
      }}>
        {!blader.avatar_blader_url && blader.nome_blader?.charAt(0)?.toUpperCase()}
      </div>

      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
        fontSize: 13, color: '#fff',
        whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', width: '100%',
      }}>
        {blader.nome_blader}
      </div>

      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,.35)',
        whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', width: '100%',
      }}>
        {blader.cidade_blader ? `📍 ${blader.cidade_blader}` : '—'}
      </div>

      {blader.elo && (
        <div style={{
          padding: '2px 8px', borderRadius: 5,
          background: `${eloCor}15`, color: eloCor,
          border: `1px solid ${eloCor}25`,
          fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
        }}>
          {blader.elo.elo}
        </div>
      )}

      {blader.jaAmigo ? (
        <div style={{
          width: '100%', padding: '6px', borderRadius: 8, textAlign: 'center',
          background: 'rgba(16,185,129,.08)',
          border: '1px solid rgba(16,185,129,.15)',
          color: '#34D399', fontSize: 11, fontWeight: 700,
        }}>
          ✓ Amigos
        </div>
      ) : blader.pendente ? (
        <div style={{
          width: '100%', padding: '6px', borderRadius: 8, textAlign: 'center',
          background: 'rgba(245,158,11,.08)',
          border: '1px solid rgba(245,158,11,.15)',
          color: '#FCD34D', fontSize: 11, fontWeight: 700,
        }}>
          ⏳ Enviado
        </div>
      ) : (
        <button
          onClick={onAdicionar}
          style={{
            width: '100%', padding: '6px', borderRadius: 8,
            background: 'rgba(0,220,255,.1)',
            border: '1px solid rgba(0,220,255,.25)',
            color: '#00DCFF', fontSize: 11, fontWeight: 700,
            fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1,
            cursor: 'pointer', transition: 'background .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,220,255,.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,220,255,.1)'; }}
        >
          + Adicionar
        </button>
      )}
    </div>
  );
}
