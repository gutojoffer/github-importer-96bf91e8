import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NavbarPublica from '@/components/public/NavbarPublica';
import { cacheMemory } from '@/lib/cache';

interface RankingRow {
  user_id: string;
  pontos: number;
  elo: string;
  nome_blader: string | null;
  avatar_blader_url: string | null;
  cidade_blader: string | null;
  estado_blader: string | null;
}

const ELOS: Record<string, { cor: string; icone: string }> = {
  Ferro: { cor: '#9CA3AF', icone: '⚙️' },
  Bronze: { cor: '#CD7F32', icone: '🥉' },
  Prata: { cor: '#C0C0C0', icone: '🥈' },
  Ouro: { cor: '#F59E0B', icone: '🥇' },
  Platina: { cor: '#00DCFF', icone: '🔷' },
  Diamante: { cor: '#A78BFA', icone: '💎' },
};

export default function RankingPublicoPage() {
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [temporadaNome, setTemporadaNome] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const result = await cacheMemory('ranking-publico:top50', 60_000, async () => {
          const { data: temp } = await supabase
            .from('temporadas')
            .select('id, nome')
            .eq('ativa', true)
            .maybeSingle();

          if (!temp) return { nome: '', rows: [] as RankingRow[] };

          const { data: elos } = await supabase
            .from('elo_bladers')
            .select('user_id, pontos, elo')
            .eq('temporada_id', temp.id)
            .order('pontos', { ascending: false })
            .limit(50);

          if (!elos || elos.length === 0) return { nome: temp.nome, rows: [] as RankingRow[] };

          const userIds = elos.map((e) => e.user_id).filter(Boolean) as string[];
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, nome_blader, avatar_blader_url, cidade_blader, estado_blader')
            .in('id', userIds);

          const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
          const rows: RankingRow[] = elos
            .filter((e) => e.user_id && profMap.has(e.user_id))
            .map((e) => {
              const p = profMap.get(e.user_id!)!;
              return {
                user_id: e.user_id!,
                pontos: e.pontos ?? 0,
                elo: e.elo ?? 'Ferro',
                nome_blader: p.nome_blader,
                avatar_blader_url: p.avatar_blader_url,
                cidade_blader: p.cidade_blader,
                estado_blader: p.estado_blader,
              };
            });
          return { nome: temp.nome, rows };
        });
        setTemporadaNome(result.nome);
        setRanking(result.rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#070a14', color: '#e7ecf3', fontFamily: 'Montserrat, sans-serif' }}>
      <NavbarPublica />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 38, color: '#00DCFF', margin: 0 }}>
          Ranking BLADEX — Beyblade X Brasil
        </h1>
        <p style={{ color: '#cbd2dd', marginBottom: 24 }}>
          Top bladers do Brasil por pontuação ELO {temporadaNome && `na temporada ${temporadaNome}`}.
          Atualizado após cada torneio.
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#7a8392', padding: 40 }}>Carregando ranking...</p>
        ) : ranking.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7a8392', padding: 40 }}>Nenhum blader no ranking ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ranking.map((r, i) => {
              const eloCfg = ELOS[r.elo] || ELOS.Ferro;
              return (
                <Link
                  key={r.user_id}
                  to={`/blader/perfil/${r.user_id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', background: '#0d1120',
                    border: '1px solid rgba(255,255,255,.07)', borderRadius: 12,
                    textDecoration: 'none', color: '#e7ecf3',
                  }}
                >
                  <div style={{ width: 32, textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 18, color: i < 3 ? '#FFD23F' : '#7a8392' }}>
                    {i + 1}
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a2030', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#00DCFF', fontWeight: 700 }}>
                    {r.avatar_blader_url
                      ? <img src={r.avatar_blader_url} alt={r.nome_blader ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (r.nome_blader?.charAt(0) ?? '?')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.nome_blader ?? 'Blader'}
                    </div>
                    <div style={{ fontSize: 12, color: '#7a8392' }}>
                      📍 {r.cidade_blader ?? '—'}{r.estado_blader ? ` · ${r.estado_blader}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: eloCfg.cor, whiteSpace: 'nowrap' }}>
                    {eloCfg.icone} {r.elo}
                  </div>
                  <div style={{ width: 60, textAlign: 'right', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, color: '#00DCFF' }}>
                    {r.pontos}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <section style={{ textAlign: 'center', marginTop: 40, padding: '32px 16px', background: 'linear-gradient(135deg, rgba(0,220,255,.08), rgba(167,139,250,.06))', borderRadius: 16, border: '1px solid rgba(0,220,255,.2)' }}>
          <p style={{ color: '#cbd2dd', marginBottom: 16 }}>
            Quer aparecer no ranking? Crie sua conta e participe de torneios.
          </p>
          <Link to="/login" style={{ background: '#00DCFF', color: '#070a14', padding: '12px 26px', borderRadius: 10, fontWeight: 800, textDecoration: 'none', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1 }}>
            Entrar / Criar conta
          </Link>
        </section>
      </main>
    </div>
  );
}
