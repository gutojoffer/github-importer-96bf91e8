import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTimes } from '@/hooks/useTimes';

interface RankingTime {
  id: string;
  nome: string;
  emoji: string;
  cor: string;
  cidade: string | null;
  estado: string | null;
  vitorias_total: number;
  derrotas_total: number;
  torneios_total: number;
  trofeus: number;
  totalMembros: number;
  winrate: number;
}

export default function TimesPage() {
  const { meuTime, convitesPendentes, winrateTime, aceitarConvite, recusarConvite } = useTimes();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meuPerfil, setMeuPerfil] = useState<{ cidade_blader?: string; estado_blader?: string } | null>(null);
  const [filtro, setFiltro] = useState<'cidade' | 'estado' | 'brasil'>('brasil');
  const [ranking, setRanking] = useState<RankingTime[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('cidade_blader, estado_blader').eq('id', user.id).maybeSingle()
      .then(({ data }) => setMeuPerfil(data as any));
  }, [user]);

  useEffect(() => {
    async function carregar() {
      let q = supabase
        .from('times')
        .select('id, nome, emoji, cor, cidade, estado, vitorias_total, derrotas_total, torneios_total, trofeus')
        .order('trofeus', { ascending: false })
        .order('vitorias_total', { ascending: false })
        .limit(20);

      if (filtro === 'cidade' && meuPerfil?.cidade_blader) q = q.eq('cidade', meuPerfil.cidade_blader);
      else if (filtro === 'estado' && meuPerfil?.estado_blader) q = q.eq('estado', meuPerfil.estado_blader);

      const { data } = await q;
      const times = (data || []) as any[];
      if (times.length === 0) { setRanking([]); return; }

      // Conta membros separadamente (por time)
      const { data: membros } = await supabase
        .from('time_membros')
        .select('time_id, status')
        .in('time_id', times.map(t => t.id))
        .eq('status', 'ativo');
      const counts = new Map<string, number>();
      (membros || []).forEach((m: any) => counts.set(m.time_id, (counts.get(m.time_id) || 0) + 1));

      setRanking(times.map(t => {
        const total = (t.vitorias_total || 0) + (t.derrotas_total || 0);
        return {
          ...t,
          totalMembros: counts.get(t.id) || 0,
          winrate: total > 0 ? Math.round((t.vitorias_total / total) * 100) : 0,
        };
      }));
    }
    carregar();
  }, [filtro, meuPerfil]);

  return (
    <div style={{ padding: '20px 24px 80px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff' }}>Times</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
            Equipes e torneios coletivos
          </div>
        </div>
        {!meuTime && (
          <button
            onClick={() => navigate('/blader/times/criar')}
            style={{
              padding: '8px 18px', borderRadius: 10,
              background: 'rgba(0,220,255,.1)', border: '1px solid rgba(0,220,255,.25)',
              color: '#00DCFF', fontSize: 13, fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1, cursor: 'pointer',
            }}
          >+ Criar time</button>
        )}
      </div>

      {/* Convites */}
      {convitesPendentes.map(convite => (
        <div key={convite.id} style={{
          background: '#0d1120', border: '1.5px solid rgba(0,220,255,.2)',
          borderRadius: 14, padding: 14, marginBottom: 12,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#00DCFF', textTransform: 'uppercase', marginBottom: 10 }}>
            👥 Convite para time
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: `${convite.time?.cor || '#00DCFF'}18`,
              border: `1px solid ${convite.time?.cor || '#00DCFF'}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>{convite.time?.emoji || '⚡'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 2 }}>
                {convite.time?.nome}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                📍 {convite.time?.cidade || '—'}{convite.time?.estado ? ` · ${convite.time.estado}` : ''}
                {convite.convidado_por_nome && ` · Convidado por ${convite.convidado_por_nome}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => convite.time && aceitarConvite(convite.id, convite.time.id)}
              style={{
                flex: 1, padding: '9px', borderRadius: 9,
                background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)',
                color: '#34D399', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                fontSize: 13, letterSpacing: 1, cursor: 'pointer',
              }}
            >✓ Entrar no time</button>
            <button
              onClick={() => recusarConvite(convite.id)}
              style={{
                flex: 1, padding: '9px', borderRadius: 9,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                color: 'rgba(255,255,255,.4)', fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >✕ Recusar</button>
          </div>
        </div>
      ))}

      {/* Meu time */}
      {meuTime && (
        <div style={{
          background: '#0d1120', border: `1px solid ${meuTime.cor}30`,
          borderRadius: 16, overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{
            height: 56, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg,${meuTime.cor}15,${meuTime.cor}05)`,
          }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 50%,${meuTime.cor}20,transparent)` }} />
          </div>
          <div style={{ padding: '0 16px 16px', marginTop: -20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 13,
              background: `${meuTime.cor}15`, border: `3px solid ${meuTime.cor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 8,
            }}>{meuTime.emoji}</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 3 }}>
              {meuTime.nome}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>
              📍 {meuTime.cidade || '—'}{meuTime.estado ? ` · ${meuTime.estado}` : ''} · {meuTime.membros.length} membros
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { v: `${winrateTime}%`, l: 'Winrate', c: '#34D399' },
                { v: meuTime.torneios_total, l: 'Torneios', c: '#F59E0B' },
                { v: meuTime.vitorias_total, l: 'Vitórias', c: '#00DCFF' },
                { v: meuTime.trofeus, l: 'Troféus', c: '#A78BFA' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                  borderRadius: 10, padding: 9, textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>
              Membros
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {meuTime.membros.map(m => {
                const p = m.profile;
                const wr = (p?.torneios_total || 0) > 0
                  ? Math.round(((p?.vitorias_total || 0) / (p!.torneios_total!)) * 100) : 0;
                const eloCor: Record<string, string> = {
                  Ferro: '#9CA3AF', Bronze: '#CD7F32', Prata: '#C0C0C0',
                  Ouro: '#F59E0B', Platina: '#00DCFF', Diamante: '#A78BFA',
                };
                const eloLabel = m.elo?.elo || 'Ferro';
                const cor = eloCor[eloLabel] || '#9CA3AF';
                return (
                  <div
                    key={m.id}
                    onClick={() => p && navigate(`/blader/perfil/${p.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
                      borderRadius: 10, cursor: 'pointer', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)')}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: p?.avatar_blader_url ? `url(${p.avatar_blader_url}) center/cover` : `${cor}18`,
                      border: `2px solid ${cor}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: cor, overflow: 'hidden',
                    }}>
                      {!p?.avatar_blader_url && (p?.nome_blader?.charAt(0) || '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{p?.nome_blader || 'Blader'}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
                        {eloLabel} · Andar {m.torre?.andar || 1} · {wr}% WR
                      </div>
                    </div>
                    <div style={{
                      padding: '2px 8px', borderRadius: 5, flexShrink: 0,
                      background: m.role === 'capitao' ? 'rgba(245,158,11,.1)' : 'rgba(255,255,255,.05)',
                      border: `1px solid ${m.role === 'capitao' ? 'rgba(245,158,11,.2)' : 'rgba(255,255,255,.08)'}`,
                      color: m.role === 'capitao' ? '#FCD34D' : 'rgba(255,255,255,.4)',
                      fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    }}>{m.role === 'capitao' ? '👑 Capitão' : 'Membro'}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => navigate(`/blader/times/${meuTime.id}`)}
                style={{
                  flex: 1, padding: 9, borderRadius: 9,
                  background: `${meuTime.cor}10`, border: `1px solid ${meuTime.cor}25`,
                  color: meuTime.cor, fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
                }}
              >Gerenciar time</button>
            </div>
          </div>
        </div>
      )}

      {/* Sem time */}
      {!meuTime && convitesPendentes.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '36px 20px', background: '#08091a',
          border: '1px dashed rgba(255,255,255,.07)', borderRadius: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 36, opacity: .15, marginBottom: 10 }}>👥</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 17, color: 'rgba(255,255,255,.35)', marginBottom: 6 }}>
            Você não está em nenhum time
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginBottom: 18 }}>
            Crie seu time ou aguarde um convite de outro blader
          </div>
          <button
            onClick={() => navigate('/blader/times/criar')}
            style={{
              padding: '9px 24px', borderRadius: 10,
              background: 'rgba(0,220,255,.1)', border: '1px solid rgba(0,220,255,.25)',
              color: '#00DCFF', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 13, letterSpacing: 1, cursor: 'pointer',
            }}
          >+ Criar meu time</button>
        </div>
      )}

      {/* Ranking */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
          color: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <div style={{ width: 3, height: 10, background: 'linear-gradient(180deg,#00DCFF,#A78BFA)' }} />
          Ranking de times
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { id: 'cidade', label: meuPerfil?.cidade_blader || 'Cidade' },
            { id: 'estado', label: meuPerfil?.estado_blader || 'Estado' },
            { id: 'brasil', label: 'Brasil' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id as any)}
              style={{
                padding: '4px 10px', borderRadius: 20,
                background: filtro === f.id ? 'rgba(0,220,255,.1)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${filtro === f.id ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)'}`,
                color: filtro === f.id ? '#00DCFF' : 'rgba(255,255,255,.4)',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ranking.length === 0 && (
          <div style={{
            padding: '24px 16px', textAlign: 'center',
            background: '#08091a', border: '1px dashed rgba(255,255,255,.06)',
            borderRadius: 12, color: 'rgba(255,255,255,.3)', fontSize: 12,
          }}>Nenhum time encontrado nesse filtro.</div>
        )}
        {ranking.map((time, i) => (
          <div
            key={time.id}
            onClick={() => navigate(`/blader/times/${time.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
              background: '#0d1120',
              border: `1px solid ${time.id === meuTime?.id ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)'}`,
              borderRadius: 11, cursor: 'pointer', transition: 'border-color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = time.id === meuTime?.id ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)')}
          >
            <div style={{
              fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 13,
              width: 24, textAlign: 'center', flexShrink: 0,
              color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,.3)',
            }}>{i + 1}</div>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `${time.cor || '#00DCFF'}15`,
              border: `1px solid ${time.cor || '#00DCFF'}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{time.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {time.nome}
                {time.id === meuTime?.id && (
                  <span style={{ fontSize: 10, color: '#00DCFF', marginLeft: 6 }}>(seu time)</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
                {time.totalMembros} membros · {time.cidade || '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0, textAlign: 'right' }}>
              <div>
                <div style={{
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15,
                  color: time.winrate >= 60 ? '#34D399' : time.winrate >= 45 ? '#FCD34D' : '#F87171',
                }}>{time.winrate}%</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)' }}>WR</div>
              </div>
              <div>
                <div style={{
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, color: '#A78BFA',
                }}>{time.trofeus}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)' }}>🏆</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
