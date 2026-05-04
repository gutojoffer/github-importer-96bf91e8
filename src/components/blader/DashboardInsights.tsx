import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AvatarBlader from '@/components/blader/AvatarBlader';

const secTitle: React.CSSProperties = {
  fontFamily: 'Rajdhani, sans-serif',
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 1.5,
  color: 'rgba(255,255,255,.7)',
  textTransform: 'uppercase',
  marginBottom: 10,
  display: 'flex',
  alignItems: 'center',
};

interface Oponente {
  id: string;
  nome: string;
  avatar?: string | null;
  vitorias: number;
  derrotas: number;
}

interface Rivalidades {
  rival?: Oponente;
  melhor?: Oponente;
  todos: Oponente[];
}

interface Comparativo {
  estado: string;
  totalBladers: number;
  eu: { xp: number; vitorias: number; torneios: number; streak: number; winrate: number };
  media: { xp: number; vitorias: number; torneios: number; streak: number; winrate: number };
}

interface DeckPerf {
  nome: string;
  vitorias: number;
  derrotas: number;
  total: number;
  winrate: number;
  bladePrincipal?: string | null;
}

interface ConquistaUI {
  id: number;
  slug: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  categoria: string | null;
  meta: number;
  progresso: number;
  concluida: boolean;
  nova: boolean;
}

export default function DashboardInsights({ userId }: { userId: string }) {
  const [rivalidades, setRivalidades] = useState<Rivalidades | null>(null);
  const [comparativo, setComparativo] = useState<Comparativo | null>(null);
  const [decks, setDecks] = useState<DeckPerf[]>([]);
  const [conquistas, setConquistas] = useState<ConquistaUI[]>([]);
  const [catConquista, setCatConquista] = useState<string>('Todas');

  useEffect(() => {
    if (!userId) return;
    carregarRivalidades(userId).then(setRivalidades).catch(console.error);
    carregarComparativo(userId).then(setComparativo).catch(console.error);
    carregarDecks(userId).then(setDecks).catch(console.error);
    carregarConquistas(userId).then(setConquistas).catch(console.error);
  }, [userId]);

  return (
    <div className="space-y-4">
      {rivalidades && (rivalidades.rival || rivalidades.melhor) && (
        <RivalidadesSection rivalidades={rivalidades} />
      )}
      {comparativo && <ComparativoSection comparativo={comparativo} />}
      {decks.length > 0 && <DecksSection decks={decks} />}
      {conquistas.length > 0 && (
        <ConquistasSection
          conquistas={conquistas}
          cat={catConquista}
          setCat={setCatConquista}
        />
      )}
    </div>
  );
}

/* ──────────────── DATA LOADERS ──────────────── */

// Como não há tabela `partidas`, derivamos rivalidades dos torneios em comum:
// quem mais cruzou torneios com o blader; "vitórias" = vezes que terminei
// acima (posição menor) e "derrotas" = vezes que terminei abaixo.
async function carregarRivalidades(userId: string): Promise<Rivalidades> {
  const { data: minhasInsc } = await supabase
    .from('inscricoes')
    .select('torneio_id, posicao_final')
    .eq('blader_id', userId)
    .not('posicao_final', 'is', null);

  if (!minhasInsc?.length) return { todos: [] };

  const torneioIds = minhasInsc.map(i => i.torneio_id);
  const minhaPosPorTorneio = new Map(minhasInsc.map(i => [i.torneio_id, i.posicao_final as number]));

  const { data: outras } = await supabase
    .from('inscricoes')
    .select('torneio_id, posicao_final, blader_id, profiles!inscricoes_blader_id_fkey(id, nome_blader, avatar_blader_url)')
    .in('torneio_id', torneioIds)
    .not('posicao_final', 'is', null)
    .neq('blader_id', userId);

  const map: Record<string, Oponente> = {};
  (outras ?? []).forEach((row: any) => {
    const oponenteId = row.blader_id;
    if (!oponenteId) return;
    const minhaPos = minhaPosPorTorneio.get(row.torneio_id);
    const suaPos = row.posicao_final;
    if (minhaPos == null || suaPos == null) return;
    if (!map[oponenteId]) {
      map[oponenteId] = {
        id: oponenteId,
        nome: row.profiles?.nome_blader || 'Blader',
        avatar: row.profiles?.avatar_blader_url || null,
        vitorias: 0,
        derrotas: 0,
      };
    }
    if (minhaPos < suaPos) map[oponenteId].vitorias++;
    else if (minhaPos > suaPos) map[oponenteId].derrotas++;
  });

  const todos = Object.values(map)
    .filter(o => o.vitorias + o.derrotas >= 2)
    .sort((a, b) => (b.vitorias + b.derrotas) - (a.vitorias + a.derrotas));

  const wr = (o: Oponente) => o.vitorias / Math.max(1, o.vitorias + o.derrotas);
  const rival  = [...todos].sort((a, b) => wr(a) - wr(b))[0];
  const melhor = [...todos].sort((a, b) => wr(b) - wr(a))[0];

  return { rival, melhor, todos: todos.slice(0, 5) };
}

async function carregarComparativo(userId: string): Promise<Comparativo | null> {
  const { data: meu } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!meu?.estado_blader) return null;

  const { data: bladers } = await supabase
    .from('profiles')
    .select('xp_total, vitorias_total, torneios_total, streak_max')
    .eq('estado_blader', meu.estado_blader)
    .eq('tem_perfil_blader', true)
    .neq('id', userId);

  if (!bladers?.length) return null;

  const n = bladers.length;
  const media = {
    xp:       bladers.reduce((s, b) => s + (b.xp_total || 0), 0) / n,
    vitorias: bladers.reduce((s, b) => s + (b.vitorias_total || 0), 0) / n,
    torneios: bladers.reduce((s, b) => s + (b.torneios_total || 0), 0) / n,
    streak:   bladers.reduce((s, b) => s + (b.streak_max || 0), 0) / n,
    winrate:  bladers.reduce((s, b) => {
      const v = b.vitorias_total || 0; const t = b.torneios_total || 0;
      return s + (t > 0 ? v / t : 0);
    }, 0) / n * 100,
  };

  const meuWr = meu.torneios_total > 0 ? (meu.vitorias_total / meu.torneios_total) * 100 : 0;

  return {
    estado: meu.estado_blader,
    totalBladers: n,
    eu: {
      xp: meu.xp_total || 0,
      vitorias: meu.vitorias_total || 0,
      torneios: meu.torneios_total || 0,
      streak: meu.streak_max || 0,
      winrate: meuWr,
    },
    media,
  };
}

async function carregarDecks(userId: string): Promise<DeckPerf[]> {
  const { data: combos } = await supabase
    .from('bey_combos')
    .select('nome, slot, bey_blades(nome)')
    .eq('user_id', userId);

  if (!combos?.length) return [];

  const nomesUnicos = [...new Set(combos.map((c: any) => c.nome))];
  const bladePrincipalMap = new Map<string, string | null>();
  combos.forEach((c: any) => {
    if (c.slot === 1 && c.bey_blades?.nome && !bladePrincipalMap.has(c.nome)) {
      bladePrincipalMap.set(c.nome, c.bey_blades.nome);
    }
  });

  const { data: insc } = await supabase
    .from('inscricoes')
    .select('vitorias, derrotas, deck_snapshot')
    .eq('blader_id', userId)
    .not('deck_snapshot', 'is', null);

  const acc = new Map<string, { v: number; d: number }>();
  (insc ?? []).forEach((row: any) => {
    const snap = Array.isArray(row.deck_snapshot) ? row.deck_snapshot : [];
    const nomes = new Set(snap.map((s: any) => s?.nome).filter(Boolean));
    nomes.forEach(nome => {
      const cur = acc.get(nome as string) || { v: 0, d: 0 };
      cur.v += row.vitorias || 0;
      cur.d += row.derrotas || 0;
      acc.set(nome as string, cur);
    });
  });

  return nomesUnicos
    .map(nome => {
      const r = acc.get(nome) || { v: 0, d: 0 };
      const total = r.v + r.d;
      return {
        nome,
        vitorias: r.v,
        derrotas: r.d,
        total,
        winrate: total > 0 ? Math.round((r.v / total) * 100) : 0,
        bladePrincipal: bladePrincipalMap.get(nome) || null,
      };
    })
    .filter(d => d.total > 0)
    .sort((a, b) => b.winrate - a.winrate);
}

async function carregarConquistas(userId: string): Promise<ConquistaUI[]> {
  const [{ data: defs }, { data: minhas }] = await Promise.all([
    supabase.from('conquistas_definicoes').select('*').order('id'),
    supabase.from('conquistas_bladers').select('*').eq('user_id', userId),
  ]);
  if (!defs) return [];
  const minhasMap = new Map((minhas ?? []).map((m: any) => [m.conquista_id, m]));
  return defs.map((def: any) => {
    const m = minhasMap.get(def.id);
    return {
      id: def.id,
      slug: def.slug,
      nome: def.nome,
      descricao: def.descricao,
      icone: def.icone,
      categoria: def.categoria,
      meta: def.meta || 1,
      progresso: m?.progresso || 0,
      concluida: m?.concluida || false,
      nova: !!(m?.concluida && !m?.notificado),
    };
  });
}

/* ──────────────── SECTIONS ──────────────── */

function MiniRival({ o, cor, label }: { o: Oponente; cor: string; label: string }) {
  const total = o.vitorias + o.derrotas;
  const wr = total > 0 ? Math.round((o.vitorias / total) * 100) : 0;
  return (
    <div style={{
      background: '#0d1120',
      border: `1px solid ${cor}26`,
      borderRadius: 13,
      padding: 14,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: cor, textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <AvatarBlader url={o.avatar} nome={o.nome} size={44} cor={`${cor}26`} borderColor={`${cor}4D`} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {o.nome}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
            {total} confronto{total > 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', borderRadius: 3, background: '#10B981', width: `${wr}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
        <span style={{ color: '#34D399', fontWeight: 700 }}>{o.vitorias}V</span>
        <span style={{ color: 'rgba(255,255,255,.3)' }}>{wr}% winrate</span>
        <span style={{ color: '#F87171', fontWeight: 700 }}>{o.derrotas}D</span>
      </div>
    </div>
  );
}

function RivalidadesSection({ rivalidades }: { rivalidades: Rivalidades }) {
  return (
    <div>
      <div style={secTitle}>Rivalidades</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {rivalidades.rival && <MiniRival o={rivalidades.rival} cor="#F87171" label="⚔️ Rival principal" />}
        {rivalidades.melhor && <MiniRival o={rivalidades.melhor} cor="#34D399" label="✨ Melhor matchup" />}
      </div>
    </div>
  );
}

function ComparativoSection({ comparativo }: { comparativo: Comparativo }) {
  const itens = [
    { label: 'Winrate',    eu: Math.round(comparativo.eu.winrate),  media: Math.round(comparativo.media.winrate),  sufixo: '%' },
    { label: 'XP total',   eu: comparativo.eu.xp,                   media: Math.round(comparativo.media.xp),       sufixo: '' },
    { label: 'Torneios',   eu: comparativo.eu.torneios,             media: Math.round(comparativo.media.torneios * 10) / 10, sufixo: '' },
    { label: 'Streak máx', eu: comparativo.eu.streak,               media: Math.round(comparativo.media.streak * 10) / 10,   sufixo: '' },
  ];
  return (
    <div>
      <div style={secTitle}>
        Você vs média de {comparativo.estado}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
          ({comparativo.totalBladers} bladers)
        </span>
      </div>
      <div style={{
        background: '#0d1120',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 13,
        padding: 14,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
      }}>
        {itens.map(item => {
          const acima = item.eu >= item.media;
          const diff = Math.round((item.eu - item.media) * 10) / 10;
          const max = Math.max(item.eu, item.media, 1);
          return (
            <div key={item.label}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 7 }}>{item.label}</div>
              <BarLine cor="#00DCFF" valor={item.eu} max={max} sufixo={item.sufixo} />
              <BarLine cor="rgba(255,255,255,.25)" valor={item.media} max={max} sufixo={item.sufixo} muted />
              <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: acima ? '#34D399' : '#F87171' }}>
                {acima ? '+' : ''}{diff}{item.sufixo} {acima ? 'acima' : 'abaixo'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarLine({ cor, valor, max, sufixo, muted }: { cor: string; valor: number; max: number; sufixo: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cor, flexShrink: 0 }} />
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: cor, borderRadius: 2, width: `${Math.min(100, (valor / max) * 100)}%` }} />
      </div>
      <span style={{ fontSize: 10, color: muted ? 'rgba(255,255,255,.3)' : cor, fontWeight: muted ? 400 : 700, width: 40, textAlign: 'right' }}>
        {valor}{sufixo}
      </span>
    </div>
  );
}

function DecksSection({ decks }: { decks: DeckPerf[] }) {
  return (
    <div>
      <div style={secTitle}>Performance por deck</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {decks.map((deck, idx) => (
          <div key={deck.nome} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 13px',
            background: '#0d1120',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 11,
          }}>
            <div style={{
              fontFamily: 'Orbitron,sans-serif', fontWeight: 700,
              fontSize: 14, width: 22, textAlign: 'center', flexShrink: 0,
              color: idx === 0 ? '#F59E0B' : 'rgba(255,255,255,.3)',
            }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {deck.nome}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>
                {deck.bladePrincipal && `${deck.bladePrincipal} · `}{deck.vitorias}V · {deck.derrotas}D
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
                fontSize: 18, lineHeight: 1,
                color: deck.winrate >= 60 ? '#34D399' : deck.winrate >= 45 ? '#FCD34D' : '#F87171',
              }}>
                {deck.winrate}%
              </div>
              <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden', marginTop: 4, marginLeft: 'auto' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: deck.winrate >= 60 ? '#10B981' : deck.winrate >= 45 ? '#F59E0B' : '#EF4444',
                  width: `${deck.winrate}%`,
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CATEGORIAS = ['Todas', 'torneios', 'batalhas', 'streaks', 'sociais', 'decks', 'especiais'];

function ConquistasSection({ conquistas, cat, setCat }: { conquistas: ConquistaUI[]; cat: string; setCat: (c: string) => void }) {
  const filtradas = conquistas.filter(c => cat === 'Todas' || c.categoria === cat);
  const totalDone = conquistas.filter(c => c.concluida).length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ ...secTitle, marginBottom: 0 }}>
          Conquistas
          <span style={{
            marginLeft: 8, padding: '1px 7px', borderRadius: 20,
            background: 'rgba(167,139,250,.12)',
            border: '1px solid rgba(167,139,250,.2)',
            color: '#C4B5FD', fontSize: 10, fontWeight: 700,
            letterSpacing: 0, textTransform: 'none',
          }}>
            {totalDone}/{conquistas.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {CATEGORIAS.map(c => {
          const ativa = cat === c;
          return (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap',
              background: ativa ? 'rgba(0,220,255,.1)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${ativa ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)'}`,
              color: ativa ? '#00DCFF' : 'rgba(255,255,255,.4)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
              {c}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
        {filtradas.map(c => (
          <div key={c.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 5, padding: '10px 6px',
            background: c.concluida ? 'rgba(255,255,255,.03)' : '#0d1120',
            border: `1px solid ${c.concluida ? 'rgba(167,139,250,.2)' : 'rgba(255,255,255,.06)'}`,
            borderRadius: 11, textAlign: 'center',
            opacity: c.concluida ? 1 : .5,
            position: 'relative',
            filter: c.concluida ? 'none' : 'grayscale(1)',
          }}>
            {c.nova && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#EF4444', border: '2px solid #060912',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, color: '#fff',
              }}>N</div>
            )}
            <div style={{ fontSize: 26, lineHeight: 1 }}>{c.icone || '🏅'}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: c.concluida ? '#fff' : 'rgba(255,255,255,.5)', lineHeight: 1.2 }}>
              {c.nome}
            </div>
            {c.descricao && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', lineHeight: 1.2 }}>
                {c.descricao}
              </div>
            )}
            {!c.concluida && c.progresso > 0 && (
              <>
                <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 1, overflow: 'hidden', marginTop: 2 }}>
                  <div style={{ height: '100%', borderRadius: 1, background: '#F59E0B', width: `${(c.progresso / c.meta) * 100}%` }} />
                </div>
                <div style={{ fontSize: 8, color: 'rgba(245,158,11,.7)' }}>
                  {c.progresso}/{c.meta}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
