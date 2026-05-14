import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTimes } from '@/hooks/useTimes';
import { useAmizades } from '@/hooks/useAmizades';

export default function CriarTimePage() {
  const navigate = useNavigate();
  const { criarTime, convidarMembro } = useTimes();
  const { amigos } = useAmizades();

  const [nome, setNome] = useState('');
  const [emoji, setEmoji] = useState('⚡');
  const [cor, setCor] = useState('#00DCFF');
  const [descricao, setDescricao] = useState('');
  const [convocados, setConvocados] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const emojis = ['⚡', '🔥', '💫', '🌊', '👑', '🗡️', '🛡️', '🌀', '💎', '🚀', '🦅', '🐉'];
  const cores = ['#00DCFF', '#FF00B4', '#F59E0B', '#10B981', '#F87171', '#A78BFA', '#60A5FA', '#FB923C'];

  async function handleCriar() {
    if (!nome.trim()) { toast.error('Digite o nome do time.'); return; }
    setSalvando(true);
    const time = await criarTime({ nome: nome.trim(), emoji, cor, descricao: descricao.trim() || undefined });
    if (time) {
      for (const id of convocados) {
        await convidarMembro((time as any).id, id);
      }
      navigate('/blader/times');
    }
    setSalvando(false);
  }

  return (
    <div style={{ padding: '20px 24px 80px', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/blader/times')}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >←</button>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff' }}>
          Criar time
        </div>
      </div>

      {/* Preview */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: `${cor}08`, border: `1px solid ${cor}25`, borderRadius: 12, marginBottom: 20,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: `${cor}15`, border: `2px solid ${cor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>{emoji}</div>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff' }}>
            {nome || 'Nome do time'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
            Você · {convocados.length + 1} membro{convocados.length > 0 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{
        background: '#0d1120', border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 7 }}>Nome do time *</div>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Thunder Bladers"
            maxLength={30}
            style={{
              width: '100%', padding: '10px 13px',
              background: '#111827', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 10, color: '#E2E8F0', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 7 }}>Ícone</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {emojis.map(e => (
              <div
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 42, height: 42, borderRadius: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  background: emoji === e ? 'rgba(0,220,255,.1)' : 'rgba(255,255,255,.04)',
                  border: `1.5px solid ${emoji === e ? 'rgba(0,220,255,.3)' : 'rgba(255,255,255,.08)'}`,
                  transition: 'all .15s',
                }}
              >{e}</div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 7 }}>Cor</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {cores.map(c => (
              <div
                key={c}
                onClick={() => setCor(c)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: `3px solid ${cor === c ? '#fff' : 'transparent'}`,
                  transition: 'border-color .15s',
                  boxShadow: cor === c ? `0 0 8px ${c}80` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 7 }}>
            Descrição (opcional)
          </div>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Fale sobre o time..."
            maxLength={200}
            rows={2}
            style={{
              width: '100%', padding: '10px 13px',
              background: '#111827', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 10, color: '#E2E8F0', fontSize: 13,
              outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>

        {amigos.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 7 }}>
              Convidar amigos (até 5 convites)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {amigos.map(amigo => {
                const jaConvocado = convocados.includes(amigo.id);
                const lotado = convocados.length >= 5;
                return (
                  <div key={amigo.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px',
                    background: jaConvocado ? 'rgba(16,185,129,.05)' : 'rgba(255,255,255,.02)',
                    border: `1px solid ${jaConvocado ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.06)'}`,
                    borderRadius: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: amigo.avatar_blader_url ? `url(${amigo.avatar_blader_url}) center/cover` : 'rgba(0,220,255,.15)',
                      border: '1px solid rgba(0,220,255,.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#00DCFF', overflow: 'hidden',
                    }}>
                      {!amigo.avatar_blader_url && (amigo.nome_blader?.charAt(0) || '?')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                        {amigo.nome_blader || 'Blader'}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
                        {amigo.elo?.elo || 'Ferro'}
                      </div>
                    </div>
                    <button
                      onClick={() => setConvocados(prev =>
                        jaConvocado ? prev.filter(id => id !== amigo.id) : [...prev, amigo.id]
                      )}
                      disabled={!jaConvocado && lotado}
                      style={{
                        padding: '5px 12px', borderRadius: 8,
                        background: jaConvocado ? 'rgba(16,185,129,.1)' : 'rgba(0,220,255,.08)',
                        border: `1px solid ${jaConvocado ? 'rgba(16,185,129,.2)' : 'rgba(0,220,255,.2)'}`,
                        color: jaConvocado ? '#34D399' : '#00DCFF',
                        fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
                        cursor: !jaConvocado && lotado ? 'not-allowed' : 'pointer',
                        opacity: !jaConvocado && lotado ? .4 : 1,
                      }}
                    >{jaConvocado ? '✓ Convidado' : '+ Convidar'}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleCriar}
          disabled={!nome.trim() || salvando}
          style={{
            width: '100%', padding: 12,
            background: nome.trim() ? 'linear-gradient(135deg,rgba(0,220,255,.2),rgba(0,220,255,.1))' : 'rgba(255,255,255,.04)',
            border: `1px solid ${nome.trim() ? 'rgba(0,220,255,.3)' : 'rgba(255,255,255,.08)'}`,
            borderRadius: 11,
            color: nome.trim() ? '#00DCFF' : 'rgba(255,255,255,.3)',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1,
            cursor: nome.trim() ? 'pointer' : 'not-allowed', transition: 'all .2s',
          }}
        >{salvando ? 'Criando...' : '⚡ Criar time'}</button>
      </div>
    </div>
  );
}
