import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notificacao } from '@/lib/notificacoes';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TIPOS_BLADER = [
  'resultado_torneio',
  'torneio_publicado',
  'torneio_iniciado',
  'torneio_amanha',
  'conquista',
  'vinculacao',
  'torre_x_resultado',
  'torre_x_desafio',
  'torre_x_aceito',
  'pedido_amizade',
  'amizade_aceita',
  'convite_time',
  'convite_aceito',
  'resultado_time',
] as const;

type Filtro = 'Todas' | 'Torneios' | 'Conquistas' | 'Sistema';

interface TipoConfig {
  cor: string;
  corBg: string;
  corBorder: string;
  icone: string;
  titulo: string;
}

function configTipo(n: Notificacao): TipoConfig {
  const map: Record<string, TipoConfig> = {
    resultado_torneio: {
      cor: '#F59E0B',
      corBg: 'rgba(245,158,11,.08)',
      corBorder: 'rgba(245,158,11,.15)',
      icone:
        n.dados?.posicao_final === 1
          ? '🏆'
          : n.dados?.posicao_final === 2
          ? '🥈'
          : n.dados?.posicao_final === 3
          ? '🥉'
          : '⚔️',
      titulo: `Resultado — ${n.dados?.torneio_nome ?? 'Torneio'}`,
    },
    torneio_iniciado: {
      cor: '#EF4444',
      corBg: 'rgba(239,68,68,.06)',
      corBorder: 'rgba(239,68,68,.12)',
      icone: '⚔️',
      titulo: 'Torneio iniciado',
    },
    torneio_amanha: {
      cor: '#F59E0B',
      corBg: 'rgba(245,158,11,.06)',
      corBorder: 'rgba(245,158,11,.12)',
      icone: '⏰',
      titulo: 'Torneio amanhã',
    },
    conquista: {
      cor: '#A78BFA',
      corBg: 'rgba(167,139,250,.08)',
      corBorder: 'rgba(167,139,250,.15)',
      icone: '⭐',
      titulo: 'Conquista desbloqueada',
    },
    torneio_publicado: {
      cor: '#00DCFF',
      corBg: 'rgba(0,220,255,.06)',
      corBorder: 'rgba(0,220,255,.12)',
      icone: '🏟️',
      titulo: 'Novo torneio disponível',
    },
    vinculacao: {
      cor: '#10B981',
      corBg: 'rgba(16,185,129,.06)',
      corBorder: 'rgba(16,185,129,.12)',
      icone: '🔗',
      titulo: 'Perfil vinculado',
    },
    pedido_amizade: {
      cor: '#00DCFF',
      corBg: 'rgba(0,220,255,.06)',
      corBorder: 'rgba(0,220,255,.12)',
      icone: '👋',
      titulo: 'Pedido de amizade',
    },
    amizade_aceita: {
      cor: '#34D399',
      corBg: 'rgba(16,185,129,.06)',
      corBorder: 'rgba(16,185,129,.12)',
      icone: '✅',
      titulo: 'Amizade aceita',
    },
    convite_time: {
      cor: '#00DCFF',
      corBg: 'rgba(0,220,255,.06)',
      corBorder: 'rgba(0,220,255,.12)',
      icone: '👥',
      titulo: 'Convite para time',
    },
    convite_aceito: {
      cor: '#34D399',
      corBg: 'rgba(16,185,129,.06)',
      corBorder: 'rgba(16,185,129,.12)',
      icone: '✅',
      titulo: 'Membro entrou no time',
    },
    resultado_time: {
      cor: '#F59E0B',
      corBg: 'rgba(245,158,11,.08)',
      corBorder: 'rgba(245,158,11,.15)',
      icone: '🏆',
      titulo: 'Resultado do time',
    },
  };
  return (
    map[n.tipo] || {
      cor: 'rgba(255,255,255,.4)',
      corBg: 'rgba(255,255,255,.03)',
      corBorder: 'rgba(255,255,255,.08)',
      icone: '🔔',
      titulo: 'Notificação',
    }
  );
}

function formatarDataCompleta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function agruparPorData(notificacoes: Notificacao[]) {
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const grupos: Record<string, { label: string; items: Notificacao[] }> = {};
  const ordem: string[] = [];

  notificacoes.forEach(n => {
    const data = new Date(n.created_at);
    let chave: string;
    let label: string;

    if (data.toDateString() === hoje.toDateString()) {
      chave = 'hoje';
      label = 'Hoje';
    } else if (data.toDateString() === ontem.toDateString()) {
      chave = 'ontem';
      label = 'Ontem';
    } else {
      chave = data.toISOString().slice(0, 10);
      label = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    }

    if (!grupos[chave]) {
      grupos[chave] = { label, items: [] };
      ordem.push(chave);
    }
    grupos[chave].items.push(n);
  });

  return ordem.map(k => grupos[k]);
}

function NotificacaoCard({
  notificacao: n,
  onLer,
}: {
  notificacao: Notificacao;
  onLer: (id: string) => void;
}) {
  const config = configTipo(n);

  return (
    <div
      onClick={() => !n.lida && onLer(n.id)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        background: n.lida ? '#08091a' : config.corBg,
        border: `1px solid ${n.lida ? 'rgba(255,255,255,.06)' : config.corBorder}`,
        borderLeft: `3px solid ${n.lida ? 'rgba(255,255,255,.1)' : config.cor}`,
        borderRadius: 12,
        cursor: n.lida ? 'default' : 'pointer',
        transition: 'all .15s',
        opacity: n.lida ? 0.75 : 1,
      }}
      onMouseEnter={e => {
        if (!n.lida) (e.currentTarget as HTMLDivElement).style.opacity = '0.9';
      }}
      onMouseLeave={e => {
        if (!n.lida) (e.currentTarget as HTMLDivElement).style.opacity = '1';
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          background: n.lida ? 'rgba(255,255,255,.04)' : config.corBg,
          border: `1px solid ${n.lida ? 'rgba(255,255,255,.07)' : config.corBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      >
        {config.icone}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            color: n.lida ? 'rgba(255,255,255,.3)' : config.cor,
            textTransform: 'uppercase',
            marginBottom: 3,
          }}
        >
          {config.titulo}
        </div>

        <div
          style={{
            fontSize: 13,
            color: n.lida ? 'rgba(255,255,255,.45)' : '#E2E8F0',
            lineHeight: 1.4,
            marginBottom: 6,
          }}
        >
          {n.mensagem}
        </div>

        {n.tipo === 'resultado_torneio' && n.dados && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: 6,
              marginTop: 8,
              padding: '10px 12px',
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.05)',
              borderRadius: 9,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#F59E0B',
                  lineHeight: 1,
                }}
              >
                {n.dados.posicao_final}º
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2, letterSpacing: 1 }}>
                LUGAR
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#A78BFA',
                  lineHeight: 1,
                }}
              >
                +{n.dados.xp_ganho ?? 0}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2, letterSpacing: 1 }}>XP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#00DCFF',
                  lineHeight: 1,
                }}
              >
                #{n.dados.ranking_global ?? '—'}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2, letterSpacing: 1 }}>
                GLOBAL
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#10B981',
                  lineHeight: 1,
                }}
              >
                {n.dados.vitorias ?? 0}V
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2, letterSpacing: 1 }}>
                VITÓRIAS
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginTop: 6 }}>
          {formatarDataCompleta(n.created_at)}
        </div>
      </div>

      {!n.lida && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: config.cor,
            flexShrink: 0,
            marginTop: 4,
            boxShadow: `0 0 6px ${config.cor}`,
          }}
        />
      )}
    </div>
  );
}

export default function BladerNotificacoes() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('Todas');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .in('tipo', TIPOS_BLADER as unknown as string[])
        .order('created_at', { ascending: false })
        .limit(200);
      if (!cancelled) {
        // dedupe defensivo (caso DB tenha duplicatas com mesmo mensagem+tipo+minuto)
        const seen = new Set<string>();
        const unique = ((data || []) as Notificacao[]).filter(n => {
          const ts = new Date(n.created_at).toISOString().slice(0, 16); // minuto
          const key = `${n.tipo}|${n.mensagem}|${ts}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setNotificacoes(unique);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`notif-page-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const novo = payload.new as Notificacao;
          if (!(TIPOS_BLADER as readonly string[]).includes(novo.tipo)) return;
          setNotificacoes(prev => {
            if (prev.some(p => p.id === novo.id)) return prev;
            return [novo, ...prev];
          });
          if (novo.tipo === 'resultado_torneio') {
            toast.success(novo.mensagem.split(' · ')[0], { duration: 5000 });
          } else if (novo.tipo === 'torneio_publicado') {
            toast.info(novo.mensagem, { duration: 4000 });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter(n => {
      if (filtro === 'Todas') return true;
      if (filtro === 'Torneios')
        return ['resultado_torneio', 'torneio_iniciado', 'torneio_publicado', 'torneio_amanha'].includes(
          n.tipo,
        );
      if (filtro === 'Conquistas') return n.tipo === 'conquista';
      if (filtro === 'Sistema') return ['vinculacao', 'geral'].includes(n.tipo);
      return true;
    });
  }, [notificacoes, filtro]);

  const grupos = useMemo(() => agruparPorData(notificacoesFiltradas), [notificacoesFiltradas]);

  async function marcarLida(id: string) {
    const alvo = notificacoes.find(n => n.id === id);
    if (!alvo || alvo.lida) return;
    setNotificacoes(prev => prev.map(n => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    window.dispatchEvent(new Event('notif:refresh'));
  }

  async function marcarTodasLidas() {
    if (!userId || naoLidas === 0) return;
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    await supabase.from('notificacoes').update({ lida: true }).eq('user_id', userId).eq('lida', false);
    window.dispatchEvent(new Event('notif:refresh'));
  }

  const lidasCount = notificacoes.filter(n => n.lida).length;

  async function excluirLidas() {
    if (!userId || lidasCount === 0) return;
    if (!confirm(`Excluir ${lidasCount} notificação(ões) lida(s)?`)) return;
    setNotificacoes(prev => prev.filter(n => !n.lida));
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('user_id', userId)
      .eq('lida', true);
    if (error) toast.error('Erro ao excluir');
    else toast.success('Notificações lidas excluídas');
    window.dispatchEvent(new Event('notif:refresh'));
  }

  const FILTROS: Filtro[] = ['Todas', 'Torneios', 'Conquistas', 'Sistema'];

  return (
    <>
      <div style={{ padding: '20px 24px 80px', maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: 'rgba(245,158,11,.1)',
                border: '1px solid rgba(245,158,11,.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FBBF24',
              }}
            >
              <Bell size={20} strokeWidth={1.6} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700,
                  fontSize: 22,
                  color: '#fff',
                  letterSpacing: 1,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                NOTIFICAÇÕES
              </h1>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
                {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Tudo em dia'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'rgba(0,220,255,.08)',
                  border: '1px solid rgba(0,220,255,.2)',
                  color: '#00DCFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <CheckCheck size={14} strokeWidth={1.6} />
                Marcar todas
              </button>
            )}
            {lidasCount > 0 && (
              <button
                onClick={excluirLidas}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,.08)',
                  border: '1px solid rgba(239,68,68,.2)',
                  color: '#F87171',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Excluir notificações lidas"
              >
                <Trash2 size={14} strokeWidth={1.6} />
                Excluir lidas ({lidasCount})
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTROS.map(f => {
            const ativo = filtro === f;
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: ativo ? 'rgba(0,220,255,.1)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${ativo ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)'}`,
                  color: ativo ? '#00DCFF' : 'rgba(255,255,255,.4)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
            Carregando...
          </div>
        )}

        {!loading &&
          grupos.map(grupo => (
            <div key={grupo.label} style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.25)',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {grupo.label}
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {grupo.items.map(n => (
                  <NotificacaoCard key={n.id} notificacao={n} onLer={marcarLida} />
                ))}
              </div>
            </div>
          ))}

        {!loading && notificacoesFiltradas.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#08091a',
              border: '1px dashed rgba(255,255,255,.07)',
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 40, opacity: 0.15, marginBottom: 12 }}>🔔</div>
            <div
              style={{
                fontFamily: 'Rajdhani,sans-serif',
                fontWeight: 700,
                fontSize: 18,
                color: 'rgba(255,255,255,.3)',
              }}
            >
              {notificacoes.length === 0 ? 'Nenhuma notificação' : 'Nada nesta categoria'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', marginTop: 6 }}>
              {notificacoes.length === 0
                ? 'Participe de torneios para receber notificações'
                : 'Tente outro filtro acima'}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
