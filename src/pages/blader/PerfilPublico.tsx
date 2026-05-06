import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ELOS_CONFIG: Record<string, { cor: string; bg: string; border: string }> = {
  Ferro:    { cor: '#9CA3AF', bg: 'rgba(156,163,175,.1)', border: 'rgba(156,163,175,.2)' },
  Bronze:   { cor: '#CD7F32', bg: 'rgba(205,127,50,.1)',  border: 'rgba(205,127,50,.2)' },
  Prata:    { cor: '#C0C0C0', bg: 'rgba(192,192,192,.1)', border: 'rgba(192,192,192,.2)' },
  Ouro:     { cor: '#F59E0B', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.2)' },
  Platina:  { cor: '#00DCFF', bg: 'rgba(0,220,255,.1)',   border: 'rgba(0,220,255,.2)' },
  Diamante: { cor: '#A78BFA', bg: 'rgba(167,139,250,.1)', border: 'rgba(167,139,250,.2)' },
};

export default function PerfilPublico() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<any>(null);
  const [elo, setElo] = useState<any>(null);
  const [torre, setTorre] = useState<any>(null);
  const [conquistas, setConquistas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [catConquista, setCatConquista] = useState('Todas');

  const ehEuMesmo = user?.id === id;

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      if (!id) return;
      setLoading(true);

      const { data: p } = await supabase
        .from('profiles')
        .select('id, nome_blader, avatar_blader_url, cidade_blader, estado_blader, beyblade_favorita, bio_blader, xp_total, vitorias_total, torneios_total, streak_max, nivel, created_at, tem_perfil_blader')
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;
      if (!p || !p.tem_perfil_blader) {
        setPerfil(null);
        setLoading(false);
        return;
      }
      setPerfil(p);

      // ELO temporada ativa
      const { data: temp } = await supabase
        .from('temporadas').select('id').eq('ativa', true).maybeSingle();

      if (temp) {
        const { data: eloData } = await supabase
          .from('elo_bladers')
          .select('pontos, elo')
          .eq('user_id', id)
          .eq('temporada_id', temp.id)
          .maybeSingle();
        if (eloData) {
          const { count: posElo } = await supabase
            .from('elo_bladers')
            .select('*', { count: 'exact', head: true })
            .eq('temporada_id', temp.id)
            .gt('pontos', eloData.pontos || 0);
          if (!cancelled) setElo({ ...eloData, posicao: (posElo || 0) + 1 });
        }
      }

      // Torre X
      const { data: torreData } = await supabase
        .from('torre_x_pontos')
        .select('pontos, andar, tier')
        .eq('user_id', id)
        .maybeSingle();

      if (torreData && p.cidade_blader) {
        const { count: posTorre } = await supabase
          .from('torre_x_pontos')
          .select('*', { count: 'exact', head: true })
          .eq('cidade', p.cidade_blader)
          .gt('pontos', torreData.pontos || 0);
        if (!cancelled) setTorre({ ...torreData, posicaoCidade: (posTorre || 0) + 1 });
      } else if (torreData) {
        if (!cancelled) setTorre({ ...torreData, posicaoCidade: 1 });
      }

      // Conquistas
      const { data: todasDefs } = await supabase
        .from('conquistas_definicoes').select('*').order('categoria').order('id');
      const { data: progBl } = await supabase
        .from('conquistas_bladers').select('*').eq('user_id', id);

      const comProg = (todasDefs || []).map((def: any) => {
        const prog = (progBl || []).find((b: any) => b.conquista_id === def.id);
        return { ...def, progresso: prog?.progresso || 0, concluida: prog?.concluida || false };
      });
      if (!cancelled) setConquistas(comProg);

      // Histórico
      const { data: hist } = await supabase
        .from('inscricoes')
        .select('posicao_final, vitorias, derrotas, xp_ganho, inscrito_em, deck_snapshot, torneio_id')
        .eq('blader_id', id)
        .not('posicao_final', 'is', null)
        .order('inscrito_em', { ascending: false })
        .limit(10);

      let enriched: any[] = [];
      if (hist && hist.length > 0) {
        const tIds = [...new Set(hist.map((h: any) => h.torneio_id).filter(Boolean))];
        const { data: torneiosData } = await supabase
          .from('tournaments')
          .select('id, name, horario_inicio, local_cidade, local_estado, max_players')
          .in('id', tIds);
        const tMap = new Map((torneiosData || []).map((t: any) => [t.id, t]));
        enriched = hist.map((h: any) => ({ ...h, torneio: tMap.get(h.torneio_id) }));
      }
      if (!cancelled) setHistorico(enriched);
      if (!cancelled) setLoading(false);
    }
    carregar();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>Carregando perfil...</div>;
  }
  if (!perfil) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>
        Blader não encontrado.
        <div style={{ marginTop: 16 }}>
          <button onClick={() => navigate(-1)} style={{ color: '#00DCFF', background: 'none', border: 'none', cursor: 'pointer' }}>← Voltar</button>
        </div>
      </div>
    );
  }

  const winrate = perfil.torneios_total > 0
    ? Math.round((perfil.vitorias_total / perfil.torneios_total) * 100) : 0;

  const eloCfg = ELOS_CONFIG[elo?.elo || 'Ferro'];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>
      {/* HERO */}
      <div style={{
        background: '#0d1120',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 16, padding: '20px',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: perfil.bio_blader ? 14 : 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: perfil.avatar_blader_url
              ? `url(${perfil.avatar_blader_url}) center/cover`
              : 'rgba(0,220,255,.15)',
            border: '3px solid rgba(0,220,255,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#00DCFF', overflow: 'hidden',
          }}>
            {!perfil.avatar_blader_url && perfil.nome_blader?.charAt(0)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 4 }}>
              {perfil.nome_blader}
            </div>

            {elo && (
              <div style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                background: eloCfg.bg, border: `1px solid ${eloCfg.border}`,
                color: eloCfg.cor, fontSize: 11, fontWeight: 700, letterSpacing: 1,
                marginBottom: 6,
              }}>
                {elo.elo} · Temp. 1
              </div>
            )}

            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>
              📍 {perfil.cidade_blader || '—'}{perfil.estado_blader ? ` · ${perfil.estado_blader}` : ''}
              {perfil.beyblade_favorita && ` · ⚡ ${perfil.beyblade_favorita}`}
            </div>

            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>
              Blader desde {new Date(perfil.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
            {ehEuMesmo && (
              <button
                onClick={() => navigate('/blader/settings')}
                style={{
                  padding: '7px 14px', borderRadius: 9,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700,
                  fontFamily: 'Rajdhani,sans-serif', letterSpacing: 1, cursor: 'pointer',
                }}
              >✏️ Editar perfil</button>
            )}
            {!ehEuMesmo && user && (
              <button
                onClick={() => navigate('/blader/torre-x')}
                style={{
                  padding: '7px 14px', borderRadius: 9,
                  background: 'rgba(239,68,68,.1)',
                  border: '1px solid rgba(239,68,68,.2)',
                  color: '#F87171', fontSize: 12, fontWeight: 700,
                  fontFamily: 'Rajdhani,sans-serif', letterSpacing: 1, cursor: 'pointer',
                }}
              >⚔️ Desafiar Torre X</button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copiado!');
              }}
              style={{
                padding: '7px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.07)',
                color: 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700,
                fontFamily: 'Rajdhani,sans-serif', cursor: 'pointer',
              }}
            >🔗 Copiar link</button>
          </div>
        </div>

        {perfil.bio_blader && (
          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,.5)',
            lineHeight: 1.6, paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,.06)',
          }}>
            {perfil.bio_blader}
          </div>
        )}
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { val: perfil.torneios_total || 0, lbl: 'Torneios',   cor: '#F59E0B' },
          { val: perfil.vitorias_total || 0, lbl: 'Vitórias',   cor: '#34D399' },
          { val: `${winrate}%`,              lbl: 'Winrate',    cor: '#00DCFF' },
          { val: perfil.streak_max || 0,     lbl: 'Streak máx', cor: '#F87171' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#0d1120',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 22, color: s.cor, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ELO + TORRE X */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {elo && (
          <div style={{
            background: '#0d1120',
            border: `1px solid ${eloCfg.border}`,
            borderRadius: 12, padding: '12px',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>
              ELO · Temporada 1
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                padding: '4px 12px', borderRadius: 7,
                background: eloCfg.bg, border: `1px solid ${eloCfg.border}`,
                color: eloCfg.cor, fontFamily: 'Rajdhani,sans-serif',
                fontWeight: 700, fontSize: 15, letterSpacing: 1,
              }}>{elo.elo}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 18, color: eloCfg.cor }}>{elo.pontos}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>#{elo.posicao} geral</div>
              </div>
            </div>
          </div>
        )}

        {torre && (
          <div style={{
            background: '#0d1120',
            border: '1px solid rgba(245,158,11,.15)',
            borderRadius: 12, padding: '12px',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>
              Torre X
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                padding: '4px 12px', borderRadius: 7,
                background: 'rgba(245,158,11,.1)',
                border: '1px solid rgba(245,158,11,.2)',
                color: '#F59E0B', fontFamily: 'Rajdhani,sans-serif',
                fontWeight: 700, fontSize: 15,
              }}>{torre.tier}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 18, color: '#F59E0B' }}>Andar {torre.andar}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>#{torre.posicaoCidade} na cidade</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONQUISTAS */}
      <div style={{
        background: '#0d1120',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 14, padding: '14px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            Conquistas
            <span style={{
              marginLeft: 8, padding: '1px 7px', borderRadius: 20,
              background: 'rgba(167,139,250,.12)',
              border: '1px solid rgba(167,139,250,.2)',
              color: '#C4B5FD', fontSize: 10, fontWeight: 700,
            }}>
              {conquistas.filter(c => c.concluida).length}/{conquistas.length}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 5, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {['Todas', 'torneios', 'batalhas', 'streaks', 'sociais', 'decks', 'especiais'].map(cat => (
            <button key={cat} onClick={() => setCatConquista(cat)} style={{
              padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
              background: catConquista === cat ? 'rgba(0,220,255,.1)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${catConquista === cat ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)'}`,
              color: catConquista === cat ? '#00DCFF' : 'rgba(255,255,255,.4)',
              fontSize: 10, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
            }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 7 }}>
          {conquistas
            .filter(c => catConquista === 'Todas' || c.categoria === catConquista)
            .map(c => (
              <div
                key={c.id}
                title={`${c.nome}: ${c.descricao || ''}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4, padding: '8px 4px',
                  background: c.concluida ? 'rgba(255,255,255,.03)' : '#0a0d18',
                  border: `1px solid ${c.concluida ? 'rgba(167,139,250,.2)' : 'rgba(255,255,255,.05)'}`,
                  borderRadius: 10, textAlign: 'center',
                  opacity: c.concluida ? 1 : 0.35,
                  filter: c.concluida ? 'none' : 'grayscale(1)',
                }}
              >
                <div style={{ fontSize: 22, lineHeight: 1 }}>{c.icone}</div>
                <div style={{
                  fontSize: 9, fontWeight: 600,
                  color: c.concluida ? '#fff' : 'rgba(255,255,255,.4)',
                  lineHeight: 1.2,
                }}>{c.nome}</div>
              </div>
            ))}
          {conquistas.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 12, padding: 12 }}>
              Sem conquistas cadastradas
            </div>
          )}
        </div>
      </div>

      {/* HISTÓRICO */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
          Histórico de torneios
        </div>

        {historico.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px',
            background: '#08091a',
            border: '1px dashed rgba(255,255,255,.07)',
            borderRadius: 14, color: 'rgba(255,255,255,.25)', fontSize: 13,
          }}>Nenhum torneio disputado ainda</div>
        ) : (
          historico.map((h, i) => (
            <div key={i} style={{
              background: '#0d1120',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 13, padding: '13px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {h.posicao_final === 1 ? '🏆' : h.posicao_final === 2 ? '🥈' : h.posicao_final === 3 ? '🥉' : '⚔️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                    {h.torneio?.name || '—'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>
                    {h.torneio?.horario_inicio ? new Date(h.torneio.horario_inicio).toLocaleDateString('pt-BR') : ''}
                    {h.torneio?.local_cidade && ` · ${h.torneio.local_cidade}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 20,
                    color: h.posicao_final === 1 ? '#F59E0B' : h.posicao_final <= 3 ? '#9CA3AF' : '#fff',
                  }}>{h.posicao_final}º</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)' }}>lugar</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
                {[
                  { v: h.vitorias || 0, l: 'V', c: '#34D399' },
                  { v: h.derrotas || 0, l: 'D', c: '#F87171' },
                  { v: h.xp_ganho || 0, l: 'XP', c: '#A78BFA' },
                ].map((s, j) => (
                  <div key={j} style={{
                    padding: '5px', background: 'rgba(255,255,255,.03)',
                    borderRadius: 7, textAlign: 'center',
                    border: '1px solid rgba(255,255,255,.05)',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,.25)', marginTop: 1 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {h.deck_snapshot && Array.isArray(h.deck_snapshot) && h.deck_snapshot.length > 0 && (
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,.02)',
                  borderRadius: 8, marginTop: 8,
                  border: '1px solid rgba(255,255,255,.05)',
                }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 5 }}>
                    Deck utilizado
                  </div>
                  {h.deck_snapshot.slice(0, 3).map((bey: any, bi: number) => (
                    <div key={bi} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '3px 0',
                      borderBottom: bi < 2 ? '1px solid rgba(255,255,255,.04)' : 'none',
                      fontSize: 11,
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: ['#00DCFF', '#FF00B4', '#F59E0B'][bi],
                      }} />
                      <span style={{ color: 'rgba(255,255,255,.6)', fontFamily: 'Rajdhani,sans-serif', fontWeight: 600 }}>
                        {bey.bey_blades?.nome || bey.blade_nome || '—'}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,.25)' }}>
                        {bey.bey_ratchets?.nome || bey.ratchet_nome || ''}
                        {(bey.bey_bits?.abreviacao || bey.bit_abrev) ? ` · ${bey.bey_bits?.abreviacao || bey.bit_abrev}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
