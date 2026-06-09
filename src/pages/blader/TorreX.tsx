import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheMemory, invalidate } from '@/lib/cache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AvatarBlader from '@/components/blader/AvatarBlader';

type TorrePontos = {
  user_id: string;
  pontos: number;
  andar: number;
  tier: string;
  cidade: string | null;
  estado: string | null;
  rejeicoes_seguidas: number;
};

type RankingItem = TorrePontos & {
  nome_blader: string | null;
  avatar_blader_url: string | null;
};

type Desafio = {
  id: string;
  desafiante_id: string;
  desafiado_id: string;
  status: string;
  pontos_em_jogo: number;
  cidade: string | null;
  created_at: string;
  desafiante_nome?: string | null;
  desafiante_avatar?: string | null;
  desafiado_nome?: string | null;
  desafiado_avatar?: string | null;
};

function calcularAndar(pontos: number): number {
  if (pontos <= 500) return Math.max(1, Math.ceil((pontos / 500) * 20));
  if (pontos <= 1500) return Math.ceil(20 + ((pontos - 500) / 1000) * 30);
  if (pontos <= 3000) return Math.ceil(50 + ((pontos - 1500) / 1500) * 30);
  if (pontos <= 5000) return Math.ceil(80 + ((pontos - 3000) / 2000) * 19);
  return 100;
}

function getTier(pontos: number) {
  if (pontos <= 500) return { nome: 'Iniciante', cor: '#9CA3AF', icone: '🏗️' };
  if (pontos <= 1500) return { nome: 'Escalador', cor: '#34D399', icone: '⚡' };
  if (pontos <= 3000) return { nome: 'Conquistador', cor: '#00DCFF', icone: '🗡️' };
  if (pontos <= 5000) return { nome: 'Elite', cor: '#F59E0B', icone: '⚜️' };
  return { nome: 'Lendário', cor: '#F87171', icone: '🔱' };
}

export default function TorreX() {
  const { user } = useAuth();
  const userId = user?.id;
  const [aba, setAba] = useState<'ranking' | 'desafios'>('ranking');
  const [meu, setMeu] = useState<(TorrePontos & { nome_blader?: string | null; avatar_blader_url?: string | null }) | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [filtro, setFiltro] = useState<'cidade' | 'estado' | 'nacional'>('nacional');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    void carregarMeu();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void carregarRanking();
    void carregarDesafios();
  }, [userId, filtro, meu?.cidade, meu?.estado]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`torre-x-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'torre_x_desafios',
        filter: `desafiado_id=eq.${userId}`,
      }, () => { void carregarDesafios(); })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'torre_x_desafios',
        filter: `desafiante_id=eq.${userId}`,
      }, () => { void carregarDesafios(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  async function carregarMeu() {
    if (!userId) return;
    setLoading(true);
    const { data: pontos } = await supabase
      .from('torre_x_pontos').select('*').eq('user_id', userId).maybeSingle();

    let final = pontos;
    if (!final) {
      const { data: novo, error: errEnsure } = await (supabase as any)
        .rpc('ensure_torre_x_row');
      if (errEnsure) {
        console.warn('[TorreX] ensure_torre_x_row falhou:', errEnsure.message);
      }
      final = novo as any;
    }

    const { data: prof } = await supabase
      .from('profiles').select('nome_blader, avatar_blader_url')
      .eq('id', userId).maybeSingle();

    setMeu(final ? { ...(final as any), nome_blader: prof?.nome_blader, avatar_blader_url: prof?.avatar_blader_url } : null);
    setLoading(false);
  }

  async function carregarRanking() {
    if (!userId) return;
    const cidadeKey = filtro === 'cidade' ? meu?.cidade || '' : '';
    const estadoKey = filtro === 'estado' ? meu?.estado || '' : '';
    const cacheKey = `torre-x:rank:${filtro}:${cidadeKey}:${estadoKey}`;
    const rows = await cacheMemory(cacheKey, 30_000, async () => {
      let q = supabase
        .from('torre_x_pontos')
        .select('user_id, pontos, andar, tier, cidade, estado, rejeicoes_seguidas')
        .order('pontos', { ascending: false })
        .limit(100);
      if (filtro === 'cidade' && meu?.cidade) q = q.eq('cidade', meu.cidade);
      else if (filtro === 'estado' && meu?.estado) q = q.eq('estado', meu.estado);
      const { data } = await q;
      if (!data || data.length === 0) return [] as RankingItem[];
      const ids = data.map((r: any) => r.user_id);
      const { data: profs } = await supabase
        .from('profiles').select('id, nome_blader, avatar_blader_url').in('id', ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      return data.map((r: any) => ({
        ...r,
        nome_blader: map.get(r.user_id)?.nome_blader ?? null,
        avatar_blader_url: map.get(r.user_id)?.avatar_blader_url ?? null,
      })) as RankingItem[];
    });
    setRanking(rows);
  }

  async function carregarDesafios() {
    if (!userId) return;
    const { data } = await supabase
      .from('torre_x_desafios')
      .select('*')
      .or(`desafiante_id.eq.${userId},desafiado_id.eq.${userId}`)
      .in('status', ['pendente', 'aceito', 'em_andamento'])
      .order('created_at', { ascending: false });
    if (!data) { setDesafios([]); return; }
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
  }

  async function enviarDesafio(alvoId: string, alvoNome: string | null) {
    try {
      if (!userId) { toast.error('Faça login para desafiar.'); return; }
      if (alvoId === userId) { toast.error('Você não pode desafiar a si mesmo.'); return; }

      let meuRow: any = meu;
      if (!meuRow) {
        await carregarMeu();
        const { data: refreshed } = await supabase
          .from('torre_x_pontos').select('*').eq('user_id', userId).maybeSingle();
        meuRow = refreshed;
      }
      if (!meuRow) { toast.error('Não foi possível carregar seu perfil da Torre X.'); return; }

      const ativo = desafios.find(d =>
        ((d.desafiante_id === alvoId && d.desafiado_id === userId) ||
         (d.desafiado_id === alvoId && d.desafiante_id === userId)) &&
        ['pendente', 'aceito', 'em_andamento'].includes(d.status)
      );
      if (ativo) { toast.error('Já existe um desafio ativo entre vocês.'); return; }

      const { error: errDes } = await supabase.from('torre_x_desafios').insert({
        desafiante_id: userId, desafiado_id: alvoId, status: 'pendente',
        cidade: meuRow.cidade ?? null, pontos_em_jogo: 25,
      });
      if (errDes) {
        console.error('[TorreX] erro ao inserir desafio:', errDes);
        toast.error(`Falha ao enviar desafio: ${errDes.message}`);
        return;
      }

      const { error: errNot } = await supabase.from('notificacoes').insert({
        user_id: alvoId, tipo: 'torre_x_desafio',
        mensagem: `⚔️ ${meuRow.nome_blader || 'Um blader'} te desafiou na Torre X!`,
        lida: false, dados: { desafiante_id: userId } as any,
      });
      if (errNot) console.warn('[TorreX] notificação falhou:', errNot.message);

      toast.success(`Desafio enviado para ${alvoNome || 'oponente'}.`);
      void carregarDesafios();
    } catch (e: any) {
      console.error('[TorreX] enviarDesafio exception:', e);
      toast.error(`Erro inesperado: ${e?.message || e}`);
    }
  }

  async function aceitarDesafio(d: Desafio) {
    await supabase.from('torre_x_desafios').update({ status: 'aceito', confirmado_desafiado: true }).eq('id', d.id);
    await supabase.from('notificacoes').insert({
      user_id: d.desafiante_id, tipo: 'torre_x_aceito',
      mensagem: `✅ ${meu?.nome_blader || 'Seu oponente'} aceitou o desafio!`, lida: false,
      dados: { desafio_id: d.id } as any,
    });
    toast.success('Desafio aceito!');
    void carregarDesafios();
  }

  async function recusarDesafio(d: Desafio) {
    await supabase.from('torre_x_desafios').update({ status: 'recusado' }).eq('id', d.id);
    toast.message('Desafio recusado.');
    void carregarDesafios();
  }

  const rankingFiltrado = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return ranking;
    return ranking.filter(r => (r.nome_blader || '').toLowerCase().includes(q));
  }, [ranking, busca]);

  const recebidos = desafios.filter(d => d.desafiado_id === userId && d.status === 'pendente');
  const enviados = desafios.filter(d => d.desafiante_id === userId);
  const aceitos = desafios.filter(d => d.status === 'aceito' || d.status === 'em_andamento');

  return (
    <div style={{ minHeight: '100%', background: '#060912', color: '#fff', padding: '20px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 26 }}>🗼</span>
          <div>
            <h1 style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: 1, margin: 0 }}>
              TORRE <span style={{ color: '#00DCFF' }}>X</span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
              Suba de andar enfrentando outros bladers
            </p>
          </div>
        </div>

        {/* Minha posição */}
        {meu && (() => {
          const tier = getTier(meu.pontos);
          const andar = calcularAndar(meu.pontos);
          const proxAndar = Math.min(100, andar + 1);
          const limites = [0, 500, 1500, 3000, 5000, 99999];
          const tierIdx = [0, 500, 1500, 3000, 5000].findIndex(l => meu.pontos <= l);
          const min = tierIdx <= 0 ? 0 : limites[tierIdx - 1] + 1;
          const max = limites[Math.max(0, tierIdx)];
          const progresso = Math.min(100, Math.max(0, ((meu.pontos - min) / Math.max(1, max - min)) * 100));
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: 16, borderRadius: 14, marginBottom: 14,
              background: 'linear-gradient(135deg, rgba(0,220,255,.08), rgba(124,58,237,.06))',
              border: '1px solid rgba(0,220,255,.18)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: 'rgba(0,220,255,.1)', border: '1px solid rgba(0,220,255,.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 24, color: '#00DCFF', lineHeight: 1 }}>{andar}</div>
                <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>andar</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tier.cor }}>{tier.icone} {tier.nome}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>· {meu.nome_blader || 'Blader'}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${progresso}%`, height: '100%', background: tier.cor, transition: 'width .3s' }} />
                </div>
                <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
                  Próximo andar: {proxAndar} · {meu.cidade || '—'}{meu.estado ? `/${meu.estado}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 24, color: '#fff', lineHeight: 1 }}>{meu.pontos}</div>
                <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>pts</div>
              </div>
            </div>
          );
        })()}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', marginBottom: 14 }}>
          {([
            { id: 'ranking', label: 'Ranking' },
            { id: 'desafios', label: `Desafios${recebidos.length ? ` (${recebidos.length})` : ''}` },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setAba(t.id)} style={{
              flex: 1, padding: 8, borderRadius: 8,
              background: aba === t.id ? '#0d1120' : 'transparent',
              border: aba === t.id ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
              color: aba === t.id ? '#fff' : 'rgba(255,255,255,.45)',
              fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
            }}>{t.label}</button>
          ))}
        </div>

        {aba === 'ranking' && (
          <div>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {(['cidade', 'estado', 'nacional'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)} style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: filtro === f ? 'rgba(0,220,255,.12)' : 'rgba(255,255,255,.04)',
                  border: filtro === f ? '1px solid rgba(0,220,255,.3)' : '1px solid rgba(255,255,255,.06)',
                  color: filtro === f ? '#00DCFF' : 'rgba(255,255,255,.6)',
                  fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 1,
                  textTransform: 'uppercase', cursor: 'pointer',
                }}>{f}</button>
              ))}
              <input
                value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar blader..."
                style={{
                  flex: 1, minWidth: 180, padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                  color: '#fff', fontSize: 12, fontFamily: 'Montserrat,sans-serif',
                }}
              />
            </div>

            {/* Lista ranking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loading && <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Carregando…</div>}
              {!loading && rankingFiltrado.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, border: '1px dashed rgba(255,255,255,.08)', borderRadius: 10 }}>
                  Nenhum blader encontrado neste filtro.
                </div>
              )}
              {rankingFiltrado.map((r, i) => {
                const tier = getTier(r.pontos);
                const isMe = r.user_id === userId;
                return (
                  <div key={r.user_id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    borderRadius: 10,
                    background: isMe ? 'rgba(0,220,255,.06)' : 'rgba(255,255,255,.02)',
                    border: isMe ? '1px solid rgba(0,220,255,.25)' : '1px solid rgba(255,255,255,.05)',
                  }}>
                    <div style={{ width: 28, fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, color: i < 3 ? '#FBBF24' : 'rgba(255,255,255,.45)', fontSize: 14, textAlign: 'center' }}>
                      {i + 1}
                    </div>
                    <AvatarBlader url={r.avatar_blader_url} nome={r.nome_blader} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.nome_blader || 'Blader'}{isMe && <span style={{ color: '#00DCFF', fontSize: 10, marginLeft: 6 }}>(você)</span>}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
                        {tier.icone} {tier.nome} · andar {calcularAndar(r.pontos)} · {r.cidade || '—'}{r.estado ? `/${r.estado}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, color: '#fff', fontSize: 16, lineHeight: 1 }}>{r.pontos}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: 1, textTransform: 'uppercase' }}>pts</div>
                    </div>
                    {!isMe && (
                      <button onClick={() => enviarDesafio(r.user_id, r.nome_blader)} style={{
                        padding: '6px 10px', borderRadius: 8,
                        background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
                        color: '#F87171', fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani,sans-serif',
                        letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
                      }}>⚔️ Desafiar</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aba === 'desafios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Section title={`Recebidos (${recebidos.length})`}>
              {recebidos.length === 0 && <Empty text="Nenhum desafio recebido." />}
              {recebidos.map(d => (
                <DesafioCard key={d.id} desafio={d} eu={userId} onAceitar={() => aceitarDesafio(d)} onRecusar={() => recusarDesafio(d)} />
              ))}
            </Section>

            <Section title={`Em andamento (${aceitos.length})`}>
              {aceitos.length === 0 && <Empty text="Sem partidas em andamento." />}
              {aceitos.map(d => (
                <DesafioCard key={d.id} desafio={d} eu={userId} aceito />
              ))}
            </Section>

            <Section title={`Enviados (${enviados.filter(d => d.status === 'pendente').length})`}>
              {enviados.filter(d => d.status === 'pendente').length === 0 && <Empty text="Nenhum desafio enviado pendente." />}
              {enviados.filter(d => d.status === 'pendente').map(d => (
                <DesafioCard key={d.id} desafio={d} eu={userId} enviado />
              ))}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,.35)', fontSize: 12, border: '1px dashed rgba(255,255,255,.07)', borderRadius: 10 }}>
      {text}
    </div>
  );
}

function DesafioCard({
  desafio, eu, onAceitar, onRecusar, aceito, enviado,
}: {
  desafio: Desafio; eu?: string;
  onAceitar?: () => void; onRecusar?: () => void;
  aceito?: boolean; enviado?: boolean;
}) {
  const sou_desafiante = desafio.desafiante_id === eu;
  const oponenteNome = sou_desafiante ? desafio.desafiado_nome : desafio.desafiante_nome;
  const oponenteAvatar = sou_desafiante ? desafio.desafiado_avatar : desafio.desafiante_avatar;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
      borderRadius: 10, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
    }}>
      <AvatarBlader url={oponenteAvatar || null} nome={oponenteNome || null} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
          {oponenteNome || 'Blader'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
          {desafio.cidade || '—'} · {desafio.pontos_em_jogo} pts em jogo
        </div>
      </div>
      {aceito && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', color: '#34D399', letterSpacing: 1, textTransform: 'uppercase' }}>
          Aceito
        </span>
      )}
      {enviado && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', color: '#FBBF24', letterSpacing: 1, textTransform: 'uppercase' }}>
          Aguardando
        </span>
      )}
      {onAceitar && (
        <>
          <button onClick={onRecusar} style={{
            padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>Recusar</button>
          <button onClick={onAceitar} style={{
            padding: '6px 10px', borderRadius: 8, background: 'rgba(16,185,129,.15)',
            border: '1px solid rgba(16,185,129,.3)', color: '#34D399',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>Aceitar</button>
        </>
      )}
    </div>
  );
}
