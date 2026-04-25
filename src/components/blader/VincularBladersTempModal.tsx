import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BladerTempPendente {
  id: string;
  nome: string;
  organizador_id: string | null;
  inscricoes_count: number;
  liga_nome: string | null;
}

interface Props {
  userId: string;
  email: string | null | undefined;
  onClose: () => void;
  onLinked?: () => void;
}

export default function VincularBladersTempModal({ userId, email, onClose, onLinked }: Props) {
  const [pendentes, setPendentes] = useState<BladerTempPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [vinculando, setVinculando] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      if (!email) { onClose(); return; }
      const emailLower = email.toLowerCase().trim();

      // Buscar bladers_temp não vinculados com mesmo email
      const { data: temps, error } = await (supabase as any)
        .from('bladers_temp')
        .select('id, nome, organizador_id')
        .eq('email', emailLower)
        .is('vinculado_a', null);

      if (error || !temps || temps.length === 0) {
        if (!cancelled) onClose();
        return;
      }

      // Para cada um, contar inscrições e buscar nome da liga
      const ids = temps.map((t: any) => t.id);
      const orgIds = Array.from(new Set(temps.map((t: any) => t.organizador_id).filter(Boolean)));

      const [{ data: inscricoes }, { data: ligas }] = await Promise.all([
        supabase.from('inscricoes').select('blader_temp_id').in('blader_temp_id', ids),
        orgIds.length > 0
          ? supabase.from('profiles').select('id, nome_liga').in('id', orgIds as string[])
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const countByTemp = new Map<string, number>();
      (inscricoes ?? []).forEach((i: any) => {
        if (i.blader_temp_id) countByTemp.set(i.blader_temp_id, (countByTemp.get(i.blader_temp_id) || 0) + 1);
      });
      const ligaByOrg = new Map<string, string | null>();
      (ligas ?? []).forEach((l: any) => ligaByOrg.set(l.id, l.nome_liga));

      const enriched: BladerTempPendente[] = temps.map((t: any) => ({
        id: t.id,
        nome: t.nome,
        organizador_id: t.organizador_id,
        inscricoes_count: countByTemp.get(t.id) || 0,
        liga_nome: t.organizador_id ? (ligaByOrg.get(t.organizador_id) || null) : null,
      }));

      if (!cancelled) {
        setPendentes(enriched);
        setLoading(false);
      }
    }
    carregar();
    return () => { cancelled = true; };
  }, [email, onClose]);

  async function handleVincular() {
    setVinculando(true);
    const { error } = await (supabase as any).rpc('link_bladers_temp', {
      _user_id: userId,
      _temp_ids: pendentes.map(p => p.id),
    });
    setVinculando(false);

    if (error) {
      console.error('Erro ao vincular:', error);
      toast.error('Erro ao vincular cadastros.');
      return;
    }

    toast.success('Estatísticas importadas com sucesso! 🎉');
    onLinked?.();
    onClose();
  }

  if (loading) return null;
  if (pendentes.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#0d1120', border: '1px solid rgba(37,99,235,.2)', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 8 }}>
          Encontramos você!
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 20, lineHeight: 1.5 }}>
          Você participou de torneios antes de criar sua conta. Deseja vincular e importar suas estatísticas?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18, textAlign: 'left' }}>
          {pendentes.map(bt => (
            <div key={bt.id} style={{
              background: 'rgba(37,99,235,.08)',
              border: '1px solid rgba(37,99,235,.2)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{bt.nome}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                {bt.liga_nome || 'Liga'} · {bt.inscricoes_count} torneio{bt.inscricoes_count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={vinculando} style={{ flex: 1, padding: 11, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: vinculando ? 'wait' : 'pointer' }}>
            Não, obrigado
          </button>
          <button onClick={handleVincular} disabled={vinculando} style={{ flex: 1, padding: 11, background: 'linear-gradient(135deg, rgba(0,220,255,.25), rgba(37,99,235,.25))', border: '1px solid rgba(0,220,255,.4)', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: vinculando ? 'wait' : 'pointer' }}>
            {vinculando ? 'Vinculando...' : 'Vincular e importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
