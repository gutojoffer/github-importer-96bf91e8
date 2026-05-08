import { useEffect, useState, JSX } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAmizades } from '@/hooks/useAmizades';
import { formatarDataRelativa } from '@/utils/feedUtils';

interface ItemFeed {
  id: string;
  tipo: string;
  dados: any;
  user_id: string;
  created_at: string;
  perfil?: { nome_blader: string | null; avatar_blader_url: string | null };
}

export function FeedAmigos() {
  const [feed, setFeed] = useState<ItemFeed[]>([]);
  const { amigos } = useAmizades();

  useEffect(() => {
    if (amigos.length === 0) { setFeed([]); return; }
    let cancelled = false;
    const amigosIds = amigos.map(a => a.id);

    (async () => {
      const { data } = await supabase
        .from('feed_atividades')
        .select('id, tipo, dados, user_id, created_at')
        .in('user_id', amigosIds)
        .order('created_at', { ascending: false })
        .limit(20);

      const rows = (data || []) as any[];
      const userIds = Array.from(new Set(rows.map(r => r.user_id)));
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, nome_blader, avatar_blader_url')
        .in('id', userIds);
      const map = new Map<string, any>();
      (profs || []).forEach((p: any) => map.set(p.id, p));

      if (!cancelled) {
        setFeed(rows.map(r => ({ ...r, perfil: map.get(r.user_id) || null })));
      }
    })();

    const channel = supabase.channel(`feed-amigos-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_atividades' },
        async (payload: any) => {
          if (!amigosIds.includes(payload.new.user_id)) return;
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, nome_blader, avatar_blader_url')
            .eq('id', payload.new.user_id)
            .maybeSingle();
          setFeed(prev => [{ ...payload.new, perfil: prof || null }, ...prev].slice(0, 20));
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [amigos]);

  if (feed.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 2,
        textTransform: 'uppercase', color: 'rgba(255,255,255,.3)',
        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10,
      }}>
        <div style={{ width: 3, height: 10, background: 'linear-gradient(180deg,#00DCFF,#A78BFA)' }} />
        Feed de amigos
      </div>
      {feed.map(item => <FeedItem key={item.id} item={item} />)}
    </div>
  );
}

function FeedItem({ item }: { item: ItemFeed }) {
  const nome = item.perfil?.nome_blader || 'Alguém';
  const avatar = item.perfil?.avatar_blader_url;
  const d = item.dados || {};

  const configs: Record<string, { texto: JSX.Element; tag: string; tagCor: string; tagBg: string; tagBorder: string }> = {
    torneio_resultado: {
      texto: <><strong>{nome}</strong> ficou em <em style={{ fontStyle: 'normal', fontWeight: 600 }}>{d.posicao}º lugar</em> em "{d.torneio_nome}"</>,
      tag: d.posicao === 1 ? '🏆 Campeão' : d.posicao <= 3 ? '🥈 Pódio' : `⚔️ ${d.vitorias || 0}V`,
      tagCor: d.posicao === 1 ? '#F59E0B' : '#34D399',
      tagBg: d.posicao === 1 ? 'rgba(245,158,11,.1)' : 'rgba(16,185,129,.1)',
      tagBorder: d.posicao === 1 ? 'rgba(245,158,11,.2)' : 'rgba(16,185,129,.2)',
    },
    elo_subiu: {
      texto: <><strong>{nome}</strong> subiu para <em style={{ fontStyle: 'normal', fontWeight: 600 }}>{d.elo_novo}</em></>,
      tag: `🔷 ${d.elo_novo}`,
      tagCor: '#00DCFF', tagBg: 'rgba(0,220,255,.1)', tagBorder: 'rgba(0,220,255,.2)',
    },
    streak: {
      texto: <><strong>{nome}</strong> em streak de <em style={{ fontStyle: 'normal', fontWeight: 600 }}>{d.streak} vitórias</em>!</>,
      tag: `🔥 ${d.streak}x`,
      tagCor: '#F87171', tagBg: 'rgba(239,68,68,.1)', tagBorder: 'rgba(239,68,68,.2)',
    },
    torre_x_andar: {
      texto: <><strong>{nome}</strong> chegou ao andar <em style={{ fontStyle: 'normal', fontWeight: 600 }}>{d.andar_novo}</em> da Torre X</>,
      tag: `🗼 Andar ${d.andar_novo}`,
      tagCor: '#F59E0B', tagBg: 'rgba(245,158,11,.1)', tagBorder: 'rgba(245,158,11,.2)',
    },
    torneio_inscricao: {
      texto: <><strong>{nome}</strong> se inscreveu em <em style={{ fontStyle: 'normal', fontWeight: 600 }}>{d.torneio_nome}</em></>,
      tag: '📋 Inscrição',
      tagCor: '#A78BFA', tagBg: 'rgba(167,139,250,.1)', tagBorder: 'rgba(167,139,250,.2)',
    },
    conquista: {
      texto: <><strong>{nome}</strong> desbloqueou <em style={{ fontStyle: 'normal', fontWeight: 600 }}>{d.conquista_nome}</em></>,
      tag: `${d.conquista_icone || '⭐'} Conquista`,
      tagCor: '#FCD34D', tagBg: 'rgba(245,158,11,.1)', tagBorder: 'rgba(245,158,11,.2)',
    },
    amizade_aceita: {
      texto: <><strong>{nome}</strong> e você agora são amigos!</>,
      tag: '👥 Amigos',
      tagCor: '#34D399', tagBg: 'rgba(16,185,129,.1)', tagBorder: 'rgba(16,185,129,.2)',
    },
  };

  const cfg = configs[item.tipo];
  if (!cfg) return null;

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '11px 13px',
      background: '#0d1120',
      border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 12, marginBottom: 7,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: avatar ? `url(${avatar}) center/cover` : 'rgba(0,220,255,.15)',
        border: '1px solid rgba(0,220,255,.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#00DCFF', overflow: 'hidden',
      }}>
        {!avatar && nome.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', lineHeight: 1.5, marginBottom: 4 }}>
          {cfg.texto}
          <span style={{
            display: 'inline-block', marginLeft: 6,
            padding: '1px 7px', borderRadius: 4,
            background: cfg.tagBg, color: cfg.tagCor,
            border: `1px solid ${cfg.tagBorder}`,
            fontSize: 9, fontWeight: 700,
          }}>
            {cfg.tag}
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>
          {formatarDataRelativa(item.created_at)}
        </div>
      </div>
    </div>
  );
}
