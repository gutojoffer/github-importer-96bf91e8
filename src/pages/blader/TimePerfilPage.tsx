import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTimes, carregarTimePorId, type TimeCompleto } from '@/hooks/useTimes';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function TimePerfilPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sairDoTime, removerMembro, meuTime } = useTimes();
  const [time, setTime] = useState<TimeCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSair, setConfirmSair] = useState(false);
  const [removerAlvo, setRemoverAlvo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    carregarTimePorId(id).then(t => { setTime(t); setLoading(false); });
  }, [id, meuTime?.id]);

  if (loading) {
    return <div style={{ padding: 24, color: 'rgba(255,255,255,.4)' }}>Carregando time...</div>;
  }
  if (!time) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>
        Time não encontrado.
        <div style={{ marginTop: 16 }}>
          <button onClick={() => navigate('/blader/times')} style={{
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(0,220,255,.1)', border: '1px solid rgba(0,220,255,.25)',
            color: '#00DCFF', cursor: 'pointer', fontSize: 13,
          }}>← Voltar</button>
        </div>
      </div>
    );
  }

  const ehCapitao = user?.id === time.capitao_id;
  const ehMembro = !!time.membros.find(m => m.user_id === user?.id);
  const winrate = (time.vitorias_total + time.derrotas_total) > 0
    ? Math.round((time.vitorias_total / (time.vitorias_total + time.derrotas_total)) * 100) : 0;

  return (
    <div style={{ padding: '20px 24px 80px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/blader/times')}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >←</button>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff' }}>
          Perfil do time
        </div>
      </div>

      <div style={{
        background: '#0d1120', border: `1px solid ${time.cor}30`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          height: 80, position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg,${time.cor}25,${time.cor}05)`,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 50%,${time.cor}30,transparent)` }} />
        </div>
        <div style={{ padding: '0 20px 20px', marginTop: -28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `${time.cor}15`, border: `3px solid ${time.cor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, marginBottom: 10,
          }}>{time.emoji}</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 24, color: '#fff' }}>
            {time.nome}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4, marginBottom: 14 }}>
            📍 {time.cidade || '—'}{time.estado ? ` · ${time.estado}` : ''} · {time.membros.length}/{time.max_membros} membros
          </div>
          {time.descricao && (
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,.55)',
              padding: '10px 12px', background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.05)', borderRadius: 10, marginBottom: 14,
            }}>{time.descricao}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { v: `${winrate}%`, l: 'Winrate', c: '#34D399' },
              { v: time.torneios_total, l: 'Torneios', c: '#F59E0B' },
              { v: time.vitorias_total, l: 'Vitórias', c: '#00DCFF' },
              { v: time.trofeus, l: 'Troféus', c: '#A78BFA' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 10, padding: 10, textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: s.c, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>
        Membros
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {time.membros.map(m => {
          const p = m.profile;
          const ehEu = m.user_id === user?.id;
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              background: '#0d1120', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10,
            }}>
              <div
                onClick={() => p && navigate(`/blader/perfil/${p.id}`)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: p?.avatar_blader_url ? `url(${p.avatar_blader_url}) center/cover` : 'rgba(0,220,255,.12)',
                  border: '2px solid rgba(0,220,255,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#00DCFF', overflow: 'hidden', cursor: 'pointer',
                }}
              >{!p?.avatar_blader_url && (p?.nome_blader?.charAt(0) || '?')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{p?.nome_blader || 'Blader'} {ehEu && <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 10 }}>(você)</span>}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
                  {m.elo?.elo || 'Ferro'} · {p?.xp_total || 0} XP
                </div>
              </div>
              <div style={{
                padding: '2px 8px', borderRadius: 5, flexShrink: 0,
                background: m.role === 'capitao' ? 'rgba(245,158,11,.1)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${m.role === 'capitao' ? 'rgba(245,158,11,.2)' : 'rgba(255,255,255,.08)'}`,
                color: m.role === 'capitao' ? '#FCD34D' : 'rgba(255,255,255,.4)',
                fontSize: 9, fontWeight: 700, letterSpacing: 1,
              }}>{m.role === 'capitao' ? '👑 Capitão' : 'Membro'}</div>
              {ehCapitao && !ehEu && (
                <button
                  onClick={() => setRemoverAlvo(m.user_id)}
                  style={{
                    padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,.08)',
                    border: '1px solid rgba(239,68,68,.2)', color: '#F87171',
                    fontSize: 10, cursor: 'pointer', fontWeight: 600,
                  }}
                >Remover</button>
              )}
            </div>
          );
        })}
      </div>

      {ehMembro && !ehCapitao && (
        <button
          onClick={() => setConfirmSair(true)}
          style={{
            marginTop: 16, width: '100%', padding: 11, borderRadius: 10,
            background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.18)',
            color: '#F87171', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 13, letterSpacing: 1, cursor: 'pointer',
          }}
        >Sair do time</button>
      )}

      <ConfirmDialog
        open={confirmSair}
        onOpenChange={(o) => !o && setConfirmSair(false)}
        title="Sair do time?"
        description={`Você deixará o time "${time.nome}". Pode entrar novamente apenas com novo convite.`}
        confirmLabel="Sair"
        onConfirm={async () => { setConfirmSair(false); await sairDoTime(time.id); navigate('/blader/times'); }}
      />
      <ConfirmDialog
        open={!!removerAlvo}
        onOpenChange={(o) => !o && setRemoverAlvo(null)}
        title="Remover membro?"
        description="O blader será removido do time imediatamente."
        confirmLabel="Remover"
        onConfirm={async () => { if (removerAlvo) { await removerMembro(time.id, removerAlvo); setRemoverAlvo(null); } }}
      />
    </div>
  );
}
