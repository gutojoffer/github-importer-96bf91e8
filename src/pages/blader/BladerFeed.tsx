import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAmizades } from '@/hooks/useAmizades';

interface ItemFeed {
  id: string;
  tipo: string;
  dados: any;
  user_id: string;
  created_at: string;
  perfil?: { nome_blader: string | null; avatar_blader_url: string | null } | null;
}

const icones: Record<string, string> = {
  torneio_resultado: '🏆',
  elo_subiu: '🔷',
  streak: '🔥',
  torre_x_andar: '🗼',
  conquista: '⭐',
  torneio_inscricao: '📋',
  amizade_aceita: '👥',
};

const tags: Record<string, { label: string; cor: string; bg: string; border: string }> = {
  torneio_resultado: { label: 'Torneio', cor: '#F59E0B', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)' },
  elo_subiu: { label: 'ELO', cor: '#00DCFF', bg: 'rgba(0,220,255,.08)', border: 'rgba(0,220,255,.2)' },
  streak: { label: 'Streak', cor: '#F87171', bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.2)' },
  torre_x_andar: { label: 'Torre X', cor: '#F59E0B', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)' },
  conquista: { label: 'Conquista', cor: '#C4B5FD', bg: 'rgba(167,139,250,.08)', border: 'rgba(167,139,250,.2)' },
  torneio_inscricao: { label: 'Inscrição', cor: '#34D399', bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.2)' },
  amizade_aceita: { label: 'Amizade', cor: '#00DCFF', bg: 'rgba(0,220,255,.06)', border: 'rgba(0,220,255,.15)' },
};

function formatarTempo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `há ${d}d`;
  if (h > 0) return `há ${h}h`;
  if (min > 0) return `há ${min}min`;
  return 'agora';
}

function agruparPorData(itens: ItemFeed[]) {
  const grupos: Record<string, ItemFeed[]> = {};
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
  const semana = new Date(hoje); semana.setDate(semana.getDate() - 7);
  itens.forEach(item => {
    const data = new Date(item.created_at); data.setHours(0, 0, 0, 0);
    let grupo: string;
    if (data >= hoje) grupo = 'Hoje';
    else if (data >= ontem) grupo = 'Ontem';
    else if (data >= semana) grupo = 'Esta semana';
    else grupo = 'Mais antigo';
    if (!grupos[grupo]) grupos[grupo] = [];
    grupos[grupo].push(item);
  });
  return grupos;
}

function renderTexto(item: ItemFeed) {
  const nome = item.perfil?.nome_blader || '—';
  const d = item.dados || {};
  switch (item.tipo) {
    case 'torneio_resultado': return <><b>{nome}</b> ficou em <b>{d.posicao}º lugar</b> em "{d.torneio_nome}"</>;
    case 'elo_subiu': return <><b>{nome}</b> subiu para o elo <b>{d.elo_novo}</b></>;
    case 'streak': return <><b>{nome}</b> está em streak de <b>{d.streak} vitórias</b> consecutivas!</>;
    case 'torre_x_andar': return <><b>{nome}</b> chegou ao andar <b>{d.andar_novo}</b> da Torre X{d.tier ? ` — ${d.tier}` : ''}</>;
    case 'conquista': return <><b>{nome}</b> desbloqueou a conquista <b>"{d.conquista_nome}"</b></>;
    case 'torneio_inscricao': return <><b>{nome}</b> se inscreveu em <b>"{d.torneio_nome}"</b></>;
    case 'amizade_aceita': return <><b>{nome}</b> e você agora são <b>amigos</b></>;
    default: return <>{nome} realizou uma atividade</>;
  }
}

function renderDetalhe(item: ItemFeed) {
  const d = item.dados || {};
  if (item.tipo !== 'torneio_resultado') return null;
  return (
    <div style={{ marginTop: 7, padding: '8px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18, flexShrink: 0, color: d?.posicao === 1 ? '#F59E0B' : 'rgba(255,255,255,.4)' }}>
        {d?.posicao === 1 ? '🏆' : d?.posicao === 2 ? '🥈' : d?.posicao === 3 ? '🥉' : '⚔️'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {d?.torneio_nome}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
          {(d?.vitorias != null || d?.derrotas != null) && (
            <span><b style={{ color: '#34D399' }}>{d?.vitorias ?? 0}V</b> {d?.derrotas ?? 0}D</span>
          )}
          {d?.xp_ganho != null && <span>+<b style={{ color: '#A78BFA' }}>{d.xp_ganho}</b> XP</span>}
        </div>
      </div>
    </div>
  );
}

export default function BladerFeed() {
  const navigate = useNavigate();
  const { amigos } = useAmizades();
  const [itens, setItens] = useState<ItemFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('todos');

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      if (!amigos.length) { setItens([]); setLoading(false); return; }
      setLoading(true);
      const ids = amigos.map(a => a.id);

      const tiposPorFiltro: Record<string, string[]> = {
        torneios: ['torneio_resultado', 'torneio_inscricao'],
        elo: ['elo_subiu'],
        torre: ['torre_x_andar'],
        streaks: ['streak'],
        conquistas: ['conquista'],
      };

      let query = supabase
        .from('feed_atividades')
        .select('id, tipo, dados, user_id, created_at')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filtro !== 'todos' && tiposPorFiltro[filtro]) {
        query = query.in('tipo', tiposPorFiltro[filtro]);
      }

      const { data } = await query;
      const rows = (data || []) as any[];
      const userIds = Array.from(new Set(rows.map(r => r.user_id)));
      const { data: profs } = userIds.length
        ? await supabase.from('profiles').select('id, nome_blader, avatar_blader_url').in('id', userIds)
        : { data: [] as any[] };
      const map = new Map<string, any>();
      (profs || []).forEach((p: any) => map.set(p.id, p));

      if (!cancelled) {
        setItens(rows.map(r => ({ ...r, perfil: map.get(r.user_id) || null })));
        setLoading(false);
      }
    }
    carregar();
    return () => { cancelled = true; };
  }, [amigos, filtro]);

  useEffect(() => {
    if (!amigos.length) return;
    const ids = amigos.map(a => a.id);
    const channel = supabase.channel(`feed-page-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_atividades' }, async (payload: any) => {
        if (!ids.includes(payload.new.user_id)) return;
        const { data: prof } = await supabase.from('profiles').select('id, nome_blader, avatar_blader_url').eq('id', payload.new.user_id).maybeSingle();
        setItens(prev => [{ ...payload.new, perfil: prof || null }, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [amigos]);

  const grupos = agruparPorData(itens);
  const ordemGrupos = ['Hoje', 'Ontem', 'Esta semana', 'Mais antigo'];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 3 }}>
          Feed de amigos
        </h1>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
          Atividades dos seus {amigos.length} amigos
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'torneios', label: '🏆 Torneios' },
          { id: 'elo', label: '🏅 ELO' },
          { id: 'torre', label: '🗼 Torre X' },
          { id: 'streaks', label: '🔥 Streaks' },
          { id: 'conquistas', label: '⭐ Conquistas' },
        ].map(f => {
          const ativo = filtro === f.id;
          return (
            <button key={f.id} onClick={() => setFiltro(f.id)} style={{
              padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap',
              background: ativo ? 'rgba(0,220,255,.1)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${ativo ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)'}`,
              color: ativo ? '#00DCFF' : 'rgba(255,255,255,.4)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            }}>{f.label}</button>
          );
        })}
      </div>

      {!amigos.length && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#08091a', border: '1px dashed rgba(255,255,255,.07)', borderRadius: 16 }}>
          <div style={{ fontSize: 36, opacity: .15, marginBottom: 10 }}>📡</div>
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 17, color: 'rgba(255,255,255,.35)', marginBottom: 6 }}>
            Nenhum amigo ainda
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginBottom: 18 }}>
            Adicione amigos para acompanhar as atividades deles aqui
          </div>
          <button onClick={() => navigate('/blader/home')} style={{
            padding: '8px 20px', borderRadius: 9, background: 'rgba(0,220,255,.1)',
            border: '1px solid rgba(0,220,255,.25)', color: '#00DCFF',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
          }}>Adicionar amigos</button>
        </div>
      )}

      {loading && amigos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: '#0d1120', border: '1px solid rgba(255,255,255,.05)' }} />
          ))}
        </div>
      )}

      {!loading && amigos.length > 0 && itens.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#08091a', border: '1px dashed rgba(255,255,255,.07)', borderRadius: 16 }}>
          <div style={{ fontSize: 32, opacity: .15, marginBottom: 10 }}>📡</div>
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,.3)', marginBottom: 5 }}>
            Nenhuma atividade ainda
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
            {filtro !== 'todos' ? 'Tente outro filtro' : 'As atividades dos seus amigos aparecerão aqui'}
          </div>
        </div>
      )}

      {!loading && ordemGrupos.map(grupo => {
        const grupoItens = grupos[grupo];
        if (!grupoItens?.length) return null;
        return (
          <div key={grupo} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              color: 'rgba(255,255,255,.25)', marginBottom: 8, paddingBottom: 6,
              borderBottom: '1px solid rgba(255,255,255,.06)',
            }}>{grupo}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {grupoItens.map(item => {
                const avatar = item.perfil?.avatar_blader_url;
                const nome = item.perfil?.nome_blader;
                const tag = tags[item.tipo];
                const icone = icones[item.tipo] || '📢';
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/blader/perfil/${item.user_id}`)}
                    style={{
                      display: 'flex', gap: 10, padding: '11px 13px',
                      background: '#0d1120', border: '1px solid rgba(255,255,255,.07)',
                      borderRadius: 12, cursor: 'pointer', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.14)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)')}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: avatar ? `url(${avatar}) center/cover` : 'rgba(0,220,255,.15)',
                      border: '1.5px solid rgba(0,220,255,.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#00DCFF', overflow: 'hidden',
                    }}>
                      {!avatar && nome?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', lineHeight: 1.5, flex: 1 }}>
                          {renderTexto(item)}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', flexShrink: 0, whiteSpace: 'nowrap', marginTop: 1 }}>
                          {formatarTempo(item.created_at)}
                        </div>
                      </div>
                      {renderDetalhe(item)}
                      {tag && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          marginTop: 6, padding: '2px 7px', borderRadius: 4,
                          background: tag.bg, color: tag.cor, border: `1px solid ${tag.border}`,
                          fontSize: 9, fontWeight: 700,
                        }}>{icone} {tag.label}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
