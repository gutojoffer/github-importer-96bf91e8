import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AvatarBlader from '@/components/blader/AvatarBlader';
import { ArrowLeft, Swords } from 'lucide-react';

type Desafio = {
  id: string;
  desafiante_id: string;
  desafiado_id: string;
  status: string;
  cidade: string | null;
  created_at: string;
  resultado_relato_desafiante?: string | null;
  resultado_relato_desafiado?: string | null;
  desafiante_nome?: string | null;
  desafiante_avatar?: string | null;
  desafiado_nome?: string | null;
  desafiado_avatar?: string | null;
};

export default function TorreXDesafios() {
  const { user } = useAuth();
  const userId = user?.id;
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'recebidos' | 'em_andamento' | 'enviados' | 'historico'>('recebidos');
  const [resultadoOpen, setResultadoOpen] = useState<Desafio | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void carregar();
    const ch = supabase.channel(`torre-x-desafios-page-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torre_x_desafios', filter: `desafiado_id=eq.${userId}` }, () => carregar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torre_x_desafios', filter: `desafiante_id=eq.${userId}` }, () => carregar())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  async function carregar() {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('torre_x_desafios')
      .select('*')
      .or(`desafiante_id.eq.${userId},desafiado_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!data) { setDesafios([]); setLoading(false); return; }
    const ids = Array.from(new Set(data.flatMap((d: any) => [d.desafiante_id, d.desafiado_id]).filter(Boolean)));
    const { data: profs } = await supabase
      .from('profiles').select('id, nome_blader, avatar_blader_url').in('id', ids);
    const map = new Map((profs || []).map((p: any) => [p.id, p]));
    setDesafios(data.map((d: any) => ({
      ...d,
      desafiante_nome: map.get(d.desafiante_id)?.nome_blader ?? null,
      desafiante_avatar: map.get(d.desafiante_id)?.avatar_blader_url ?? null,
      desafiado_nome: map.get(d.desafiado_id)?.nome_blader ?? null,
      desafiado_avatar: map.get(d.desafiado_id)?.avatar_blader_url ?? null,
    })));
    setLoading(false);
  }

  async function aceitar(d: Desafio) {
    await supabase.from('torre_x_desafios').update({ status: 'aceito', confirmado_desafiado: true }).eq('id', d.id);
    toast.success('Desafio aceito!');
    void carregar();
  }
  async function recusar(d: Desafio) {
    if (!confirm('Recusar este desafio?')) return;
    await supabase.from('torre_x_desafios').update({ status: 'recusado' }).eq('id', d.id);
    toast.message('Desafio recusado.');
    void carregar();
  }
  async function cancelar(d: Desafio) {
    if (!confirm('Cancelar o desafio enviado?')) return;
    setCancelandoId(d.id);
    const { error } = await supabase.from('torre_x_desafios').delete().eq('id', d.id);
    setCancelandoId(null);
    if (error) { toast.error(`Erro ao cancelar: ${error.message}`); return; }
    toast.success('Desafio cancelado.');
    void carregar();
  }
  async function enviarResultado(d: Desafio, venci: boolean) {
    setEnviando(true);
    const { data, error } = await (supabase as any).rpc('resolver_desafio_torre_x', {
      _desafio_id: d.id, _eu_venci: venci,
    });
    setEnviando(false);
    if (error) { toast.error(`Erro: ${error.message}`); return; }
    const status = (data as any)?.status;
    if (status === 'aguardando_oponente') toast.success('Resultado registrado! Aguardando confirmação do oponente.');
    else if (status === 'em_disputa') toast.error('Resultados divergentes — desafio em disputa.');
    else if (status === 'finalizado') {
      const delta = (data as any)?.delta ?? 0;
      const ganhou = (data as any)?.vencedor === userId;
      toast.success(ganhou ? `🏆 Vitória! +${delta} pts` : `Derrota registrada. -${delta} pts`);
    }
    setResultadoOpen(null);
    void carregar();
  }

  const recebidos = desafios.filter(d => d.desafiado_id === userId && d.status === 'pendente');
  const emAndamento = desafios.filter(d => ['aceito', 'em_andamento', 'em_disputa'].includes(d.status));
  const enviados = desafios.filter(d => d.desafiante_id === userId && d.status === 'pendente');
  const historico = desafios.filter(d => ['finalizado', 'recusado', 'cancelado'].includes(d.status)).slice(0, 30);

  const tabs = [
    { id: 'recebidos', label: 'Recebidos', count: recebidos.length },
    { id: 'em_andamento', label: 'Em andamento', count: emAndamento.length },
    { id: 'enviados', label: 'Enviados', count: enviados.length },
    { id: 'historico', label: 'Histórico', count: historico.length },
  ] as const;

  return (
    <div style={{ minHeight: '100%', background: '#060912', color: '#fff', padding: '20px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link to="/blader/torre-x" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.5)',
          fontSize: 12, marginBottom: 12, textDecoration: 'none',
        }}>
          <ArrowLeft size={14} /> Voltar para Torre X
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Swords size={26} color="#00DCFF" />
          <div>
            <h1 style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: 1, margin: 0 }}>
              MEUS <span style={{ color: '#00DCFF' }}>DESAFIOS</span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
              Todos os desafios da Torre X recebidos, enviados e finalizados
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', marginBottom: 14, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setAba(t.id as any)} style={{
              flex: 1, minWidth: 110, padding: 8, borderRadius: 8,
              background: aba === t.id ? '#0d1120' : 'transparent',
              border: aba === t.id ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
              color: aba === t.id ? '#fff' : 'rgba(255,255,255,.45)',
              fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
            }}>{t.label}{t.count ? ` (${t.count})` : ''}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && <Empty text="Carregando…" />}

          {!loading && aba === 'recebidos' && (
            recebidos.length === 0
              ? <Empty text="Nenhum desafio recebido no momento." />
              : recebidos.map(d => (
                <Card key={d.id} desafio={d} eu={userId}>
                  <button onClick={() => recusar(d)} style={btnGhost}>Recusar</button>
                  <button onClick={() => aceitar(d)} style={btnGreen}>Aceitar</button>
                </Card>
              ))
          )}

          {!loading && aba === 'em_andamento' && (
            emAndamento.length === 0
              ? <Empty text="Nenhum desafio em andamento." />
              : emAndamento.map(d => {
                const sou_des = d.desafiante_id === userId;
                const meu = sou_des ? d.resultado_relato_desafiante : d.resultado_relato_desafiado;
                return (
                  <Card key={d.id} desafio={d} eu={userId}>
                    {d.status === 'em_disputa' && <Tag color="#F87171" bg="rgba(239,68,68,.15)">Em disputa</Tag>}
                    {!meu && (
                      <button onClick={() => setResultadoOpen(d)} style={btnPrimary}>▶ Iniciar desafio</button>
                    )}
                    {meu && d.status !== 'em_disputa' && <Tag color="#00DCFF" bg="rgba(0,220,255,.1)">Resultado enviado</Tag>}
                  </Card>
                );
              })
          )}

          {!loading && aba === 'enviados' && (
            enviados.length === 0
              ? <Empty text="Você não enviou nenhum desafio pendente." />
              : enviados.map(d => (
                <Card key={d.id} desafio={d} eu={userId}>
                  <Tag color="#FBBF24" bg="rgba(245,158,11,.1)">Aguardando</Tag>
                  <button onClick={() => cancelar(d)} disabled={cancelandoId === d.id} style={btnDanger}>
                    {cancelandoId === d.id ? 'Cancelando…' : 'Cancelar'}
                  </button>
                </Card>
              ))
          )}

          {!loading && aba === 'historico' && (
            historico.length === 0
              ? <Empty text="Sem histórico ainda." />
              : historico.map(d => {
                const isVitoria = d.status === 'finalizado' && ((d as any).vencedor_id === userId);
                const isDerrota = d.status === 'finalizado' && (d as any).vencedor_id && (d as any).vencedor_id !== userId;
                const txt = d.status === 'finalizado' ? (isVitoria ? 'Vitória' : (isDerrota ? 'Derrota' : 'Finalizado')) : d.status;
                const color = isVitoria ? '#34D399' : isDerrota ? '#F87171' : 'rgba(255,255,255,.5)';
                return (
                  <Card key={d.id} desafio={d} eu={userId}>
                    <Tag color={color} bg="rgba(255,255,255,.04)">{txt}</Tag>
                  </Card>
                );
              })
          )}
        </div>
      </div>

      {resultadoOpen && (
        <ResultadoModal
          desafio={resultadoOpen}
          eu={userId}
          enviando={enviando}
          onClose={() => setResultadoOpen(null)}
          onConfirmar={(venci) => enviarResultado(resultadoOpen, venci)}
        />
      )}
    </div>
  );
}

const btnGhost: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)',
  fontSize: 11, fontWeight: 700, cursor: 'pointer',
};
const btnGreen: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, background: 'rgba(16,185,129,.15)',
  border: '1px solid rgba(16,185,129,.3)', color: '#34D399',
  fontSize: 11, fontWeight: 700, cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,.12)',
  border: '1px solid rgba(239,68,68,.3)', color: '#F87171',
  fontSize: 11, fontWeight: 700, cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8,
  background: 'linear-gradient(135deg,#00DCFF,#0EA5E9)',
  border: 'none', color: '#031018',
  fontSize: 11, fontWeight: 800, cursor: 'pointer',
  letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Rajdhani,sans-serif',
};

function Tag({ color, bg, children }: any) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: bg, border: `1px solid ${color}40`, color, letterSpacing: 1, textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, border: '1px dashed rgba(255,255,255,.08)', borderRadius: 10 }}>
      {text}
    </div>
  );
}

function Card({ desafio, eu, children }: { desafio: Desafio; eu?: string; children?: React.ReactNode }) {
  const sou_des = desafio.desafiante_id === eu;
  const nome = sou_des ? desafio.desafiado_nome : desafio.desafiante_nome;
  const avatar = sou_des ? desafio.desafiado_avatar : desafio.desafiante_avatar;
  const data = new Date(desafio.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
      borderRadius: 10, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
      flexWrap: 'wrap',
    }}>
      <AvatarBlader url={avatar || null} nome={nome || null} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
          {sou_des ? 'Você desafiou' : 'Te desafiou'}: {nome || 'Blader'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
          {desafio.cidade || '—'} · {data}
        </div>
      </div>
      {children}
    </div>
  );
}

function ResultadoModal({
  desafio, eu, enviando, onClose, onConfirmar,
}: {
  desafio: Desafio; eu?: string; enviando: boolean;
  onClose: () => void; onConfirmar: (venci: boolean) => void;
}) {
  const [escolha, setEscolha] = useState<boolean | null>(null);
  const sou_des = desafio.desafiante_id === eu;
  const nome = sou_des ? desafio.desafiado_nome : desafio.desafiante_nome;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: '100%', background: '#0d1120', border: '1px solid rgba(0,220,255,.25)', borderRadius: 14, padding: 24, color: '#fff' }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>RESULTADO DO DESAFIO</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 18 }}>
          vs <strong style={{ color: '#fff' }}>{nome || 'oponente'}</strong> — registre se você venceu ou perdeu. Os pontos só serão aplicados quando ambos confirmarem.
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <button onClick={() => setEscolha(true)} style={{
            flex: 1, padding: 16, borderRadius: 10, cursor: 'pointer',
            background: escolha === true ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.03)',
            border: escolha === true ? '2px solid #10B981' : '1px solid rgba(255,255,255,.08)',
            color: escolha === true ? '#34D399' : 'rgba(255,255,255,.7)',
            fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16,
          }}>🏆<br />VENCI</button>
          <button onClick={() => setEscolha(false)} style={{
            flex: 1, padding: 16, borderRadius: 10, cursor: 'pointer',
            background: escolha === false ? 'rgba(239,68,68,.18)' : 'rgba(255,255,255,.03)',
            border: escolha === false ? '2px solid #EF4444' : '1px solid rgba(255,255,255,.08)',
            color: escolha === false ? '#F87171' : 'rgba(255,255,255,.7)',
            fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16,
          }}>💥<br />PERDI</button>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={enviando} style={{
            padding: '10px 16px', borderRadius: 8,
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Cancelar</button>
          <button
            onClick={() => escolha !== null && onConfirmar(escolha)}
            disabled={escolha === null || enviando}
            style={{
              padding: '10px 20px', borderRadius: 8,
              background: escolha === null ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,#00DCFF,#0EA5E9)',
              border: 'none', color: escolha === null ? 'rgba(255,255,255,.3)' : '#031018',
              fontSize: 12, fontWeight: 800, cursor: escolha === null ? 'not-allowed' : 'pointer',
              letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Rajdhani,sans-serif',
            }}>{enviando ? 'Enviando…' : 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}
