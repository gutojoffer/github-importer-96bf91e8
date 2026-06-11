import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAmizades } from '@/hooks/useAmizades';

const icones: Record<string, string> = {
  torneio_resultado: '🏆',
  elo_subiu: '🔷',
  streak: '🔥',
  torre_x_andar: '🗼',
  conquista: '⭐',
  torneio_inscricao: '📋',
  amizade_aceita: '👥',
};

interface Item {
  id?: string;
  tipo: string;
  dados: any;
  created_at: string;
  user_id: string;
  perfil?: { nome_blader: string | null; avatar_blader_url: string | null } | null;
}

function formatarTempo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return 'agora';
}

export function FeedPreviewHome() {
  const navigate = useNavigate();
  const { amigos } = useAmizades();
  const [itens, setItens] = useState<Item[]>([]);

  useEffect(() => {
    if (!amigos.length) { setItens([]); return; }
    let cancelled = false;
    (async () => {
      const ids = amigos.map(a => a.id);
      const { data } = await supabase
        .from('feed_atividades')
        .select('id, tipo, dados, user_id, created_at')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .limit(3);
      const rows = (data || []) as any[];
      const userIds = Array.from(new Set(rows.map(r => r.user_id)));
      const { data: profs } = userIds.length
        ? await supabase.from('profiles').select('id, nome_blader, avatar_blader_url').in('id', userIds)
        : { data: [] as any[] };
      const map = new Map<string, any>();
      (profs || []).forEach((p: any) => map.set(p.id, p));
      if (!cancelled) setItens(rows.map(r => ({ ...r, perfil: map.get(r.user_id) || null })));
    })();
    return () => { cancelled = true; };
  }, [amigos]);

  if (!amigos.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>
          Feed de amigos
        </div>
        <button onClick={() => navigate('/blader/feed')} style={{
          background: 'none', border: 'none', color: '#00DCFF', fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0,
        }}>Ver tudo →</button>
      </div>

      {itens.length === 0 ? null : (
        <div style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,.07)', borderRadius: 11, overflow: 'hidden' }}>
          {itens.map((item, i) => {
            const nome = item.perfil?.nome_blader || '—';
            const avatar = item.perfil?.avatar_blader_url;
            const d = item.dados || {};
            const textos: Record<string, string> = {
              torneio_resultado: `${nome} ficou em ${d.posicao}º em "${d.torneio_nome}"`,
              elo_subiu: `${nome} subiu para ${d.elo_novo}`,
              streak: `${nome} em streak de ${d.streak} vitórias`,
              torre_x_andar: `${nome} chegou ao andar ${d.andar_novo} da Torre X`,
              conquista: `${nome} desbloqueou "${d.conquista_nome}"`,
              torneio_inscricao: `${nome} se inscreveu em "${d.torneio_nome}"`,
              amizade_aceita: `${nome} e você agora são amigos`,
            };
            return (
              <div key={item.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                borderBottom: i < itens.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
              }}>
                <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' }}>
                  {icones[item.tipo] || '📢'}
                </span>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: avatar ? `url(${avatar}) center/cover` : 'rgba(0,220,255,.15)',
                  border: '1px solid rgba(255,255,255,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#00DCFF', overflow: 'hidden',
                }}>
                  {!avatar && nome.charAt(0)}
                </div>
                <div style={{
                  flex: 1, fontSize: 11, color: 'rgba(255,255,255,.55)', lineHeight: 1.4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {textos[item.tipo] || ''}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', flexShrink: 0 }}>
                  {formatarTempo(item.created_at)}
                </div>
              </div>
            );
          })}
          <div
            onClick={() => navigate('/blader/feed')}
            style={{
              padding: 8, textAlign: 'center', background: 'rgba(0,220,255,.03)',
              cursor: 'pointer', fontSize: 11, color: '#00DCFF', fontWeight: 500,
              borderTop: '1px solid rgba(255,255,255,.04)', transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,220,255,.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,220,255,.03)')}
          >
            Ver feed completo →
          </div>
        </div>
      )}
    </div>
  );
}
