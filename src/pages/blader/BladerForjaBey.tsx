import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts';
import { ChevronDown, ChevronUp, X, Save } from 'lucide-react';

type Linha = 'BX' | 'UX' | 'CX';

interface Peca {
  id: number;
  nome: string;
  imagem_url?: string | null;
  abreviacao?: string | null;
  linha?: string | null;
  tipo?: string | null;
  tipo_ataque?: string | null;
  peso_g?: number | null;
  atk?: number;
  def?: number;
  endr?: number;
  xdash?: number;
  br?: number;
}

interface Bey {
  slot: number;
  aberta: boolean;
  linha: Linha;
  blade: Peca | null;
  ratchet: Peca | null;
  bit: Peca | null;
  lockChip: Peca | null;
  mainBlade: Peca | null;
  assistBlade: Peca | null;
}

const CORES_LINHA: Record<Linha, string> = {
  BX: '#00DCFF',
  UX: '#EC4899',
  CX: '#FBBF24',
};

const CORES_BEY = ['#00DCFF', '#EC4899', '#FBBF24'];

function corLinha(l: Linha) { return CORES_LINHA[l]; }

function sumStat(b: Bey, key: 'atk' | 'def' | 'endr' | 'xdash' | 'br') {
  const pecas = [b.blade, b.ratchet, b.bit, b.lockChip, b.mainBlade, b.assistBlade];
  return pecas.reduce((acc, p) => acc + (p?.[key] ?? 0), 0);
}

const calcAtk = (b: Bey) => sumStat(b, 'atk');
const calcDef = (b: Bey) => sumStat(b, 'def');
const calcEndr = (b: Bey) => sumStat(b, 'endr');
const calcXdash = (b: Bey) => sumStat(b, 'xdash');
const calcBr = (b: Bey) => sumStat(b, 'br');

function beyVazia(b: Bey) {
  return !b.blade && !b.ratchet && !b.bit && !b.lockChip && !b.mainBlade && !b.assistBlade;
}

function previewCombo(b: Bey): string {
  if (b.linha === 'CX') {
    const partes = [b.lockChip?.nome, b.mainBlade?.nome, b.assistBlade?.nome, b.ratchet?.nome, b.bit?.abreviacao || b.bit?.nome].filter(Boolean);
    return partes.join(' · ');
  }
  const partes = [b.blade?.nome, b.ratchet?.nome, b.bit?.abreviacao || b.bit?.nome].filter(Boolean);
  return partes.join(' · ');
}

const BEY_INICIAL: Bey[] = [
  { slot: 1, aberta: true,  linha: 'BX', blade: null, ratchet: null, bit: null, lockChip: null, mainBlade: null, assistBlade: null },
  { slot: 2, aberta: false, linha: 'BX', blade: null, ratchet: null, bit: null, lockChip: null, mainBlade: null, assistBlade: null },
  { slot: 3, aberta: false, linha: 'BX', blade: null, ratchet: null, bit: null, lockChip: null, mainBlade: null, assistBlade: null },
];

export default function BladerForjaBey() {
  const [beys, setBeys] = useState<Bey[]>(BEY_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCarregando(false); return; }
      const { data } = await (supabase as any)
        .from('bey_combos')
        .select('slot, linha, bey_blades(*), bey_ratchets(*), bey_bits(*), bey_lock_chips(*), bey_main_blades(*), bey_assist_blades(*)')
        .eq('user_id', user.id)
        .order('slot');
      if (data?.length) {
        setBeys(prev => prev.map(b => {
          const salvo = data.find((d: any) => d.slot === b.slot);
          if (!salvo) return b;
          return {
            ...b,
            linha: (salvo.linha as Linha) || 'BX',
            blade: salvo.bey_blades || null,
            ratchet: salvo.bey_ratchets || null,
            bit: salvo.bey_bits || null,
            lockChip: salvo.bey_lock_chips || null,
            mainBlade: salvo.bey_main_blades || null,
            assistBlade: salvo.bey_assist_blades || null,
          };
        }));
      }
      setCarregando(false);
    }
    carregar();
  }, []);

  function atualizar(slot: number, patch: Partial<Bey>) {
    setBeys(prev => prev.map(b => b.slot === slot ? { ...b, ...patch } : b));
  }

  function toggleAberta(slot: number) {
    setBeys(prev => prev.map(b => b.slot === slot ? { ...b, aberta: !b.aberta } : b));
  }

  function limparBey(slot: number) {
    setBeys(prev => prev.map(b => b.slot === slot
      ? { ...b, blade: null, ratchet: null, bit: null, lockChip: null, mainBlade: null, assistBlade: null }
      : b));
  }

  function atualizarLinha(slot: number, linha: Linha) {
    setBeys(prev => prev.map(b => b.slot === slot
      ? { ...b, linha, blade: null, ratchet: null, bit: null, lockChip: null, mainBlade: null, assistBlade: null }
      : b));
  }

  async function salvarDeck() {
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Faça login para salvar.'); return; }
      await supabase.from('bey_combos').delete().eq('user_id', user.id);
      for (const bey of beys) {
        if (beyVazia(bey)) continue;
        await (supabase as any).from('bey_combos').insert({
          user_id: user.id,
          slot: bey.slot,
          linha: bey.linha,
          blade_id: bey.blade?.id || null,
          ratchet_id: bey.ratchet?.id || null,
          bit_id: bey.bit?.id || null,
          lock_chip_id: bey.lockChip?.id || null,
          main_blade_id: bey.mainBlade?.id || null,
          assist_blade_id: bey.assistBlade?.id || null,
          atk_total: calcAtk(bey),
          def_total: calcDef(bey),
          endr_total: calcEndr(bey),
          xdash_total: calcXdash(bey),
          br_total: calcBr(bey),
        });
      }
      toast.success('Deck salvo!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar deck');
    } finally {
      setSalvando(false);
    }
  }

  // Trava scroll do body enquanto a ForjaBey estiver montada (desktop)
  useEffect(() => {
    const isMobile = window.innerWidth < 900;
    if (isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 54px)',
      overflow: 'hidden',
      background: '#050714',
    }}
      className="forjabey-layout"
    >
      <style>{`
        .forjabey-col::-webkit-scrollbar,
        .forjabey-col-right::-webkit-scrollbar { width: 4px; }
        .forjabey-col::-webkit-scrollbar-track,
        .forjabey-col-right::-webkit-scrollbar-track { background: transparent; }
        .forjabey-col::-webkit-scrollbar-thumb {
          background: rgba(0, 220, 255, 0.15); border-radius: 2px;
        }
        .forjabey-col::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 220, 255, 0.3);
        }
        .forjabey-col-right::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.15); border-radius: 2px;
        }
        .forjabey-col-right::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.3);
        }
        @media (max-width: 900px) {
          .forjabey-layout {
            flex-direction: column !important;
            height: auto !important;
            overflow: visible !important;
          }
          .forjabey-left {
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,.05);
          }
          .forjabey-right {
            width: 100% !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Coluna esquerda */}
      <div className="forjabey-left forjabey-col" style={{
        width: 420, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,.05)',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '14px 12px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,220,255,.15) transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 1 }}>
              ⚙️ ForjaBey
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
              Monte seu deck de 3 beys
            </div>
          </div>
          <button
            onClick={salvarDeck}
            disabled={salvando}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 9,
              background: 'linear-gradient(135deg,#F59E0B,#EF4444)',
              border: 'none', color: '#0a0d18',
              fontFamily: 'Rajdhani,sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: 1, textTransform: 'uppercase',
              cursor: salvando ? 'wait' : 'pointer',
              opacity: salvando ? 0.6 : 1,
            }}
          >
            <Save size={13} />
            {salvando ? 'Salvando' : 'Salvar'}
          </button>
        </div>

        {carregando ? (
          <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, padding: 20, textAlign: 'center' }}>
            Carregando deck...
          </div>
        ) : (
          beys.map(bey => (
            <CardBey
              key={bey.slot}
              bey={bey}
              cor={CORES_BEY[bey.slot - 1]}
              onToggle={() => toggleAberta(bey.slot)}
              onLimpar={() => limparBey(bey.slot)}
              onLinha={l => atualizarLinha(bey.slot, l)}
              onPeca={(campo, peca) => atualizar(bey.slot, { [campo]: peca } as Partial<Bey>)}
            />
          ))
        )}
      </div>

      {/* Coluna direita */}
      <div className="forjabey-right forjabey-col-right" style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '14px 16px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(139,92,246,.15) transparent',
      }}>
        <PainelAnalise beys={beys} />
      </div>
    </div>
  );
}

// ----------------- CARD DE BEY -----------------

function CardBey({
  bey, cor, onToggle, onLimpar, onLinha, onPeca,
}: {
  bey: Bey;
  cor: string;
  onToggle: () => void;
  onLimpar: () => void;
  onLinha: (l: Linha) => void;
  onPeca: (campo: keyof Bey, p: Peca | null) => void;
}) {
  const vazia = beyVazia(bey);
  const preview = previewCombo(bey);
  const tipoPreview = bey.blade?.tipo_ataque || bey.mainBlade?.tipo_ataque || '';

  return (
    <div style={{
      marginBottom: 12,
      background: '#0b0f1f',
      border: `1px solid ${bey.aberta ? `${cor}44` : 'rgba(255,255,255,.07)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border .15s',
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 12px', cursor: 'pointer',
          background: bey.aberta ? `linear-gradient(90deg, ${cor}10, transparent)` : 'transparent',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `linear-gradient(135deg, ${cor}, ${cor}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron,sans-serif', fontWeight: 800,
          fontSize: 13, color: '#0a0d18',
        }}>
          {bey.slot}
        </div>

        <div style={{
          padding: '2px 7px', borderRadius: 5,
          background: `${corLinha(bey.linha)}18`,
          border: `1px solid ${corLinha(bey.linha)}44`,
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          color: corLinha(bey.linha),
          fontFamily: 'Orbitron,sans-serif',
        }}>
          {bey.linha}
        </div>

        {tipoPreview && (
          <div style={{
            padding: '2px 7px', borderRadius: 5,
            background: 'rgba(255,255,255,.05)',
            fontSize: 10, fontWeight: 600,
            color: 'rgba(255,255,255,.5)',
            letterSpacing: .5,
          }}>
            {tipoPreview}
          </div>
        )}

        <div style={{
          flex: 1, minWidth: 0,
          fontSize: 12, color: vazia ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.7)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontWeight: 500,
        }}>
          {!bey.aberta && (vazia ? 'Toque para montar' : preview)}
        </div>

        {!vazia && (
          <button
            onClick={e => { e.stopPropagation(); onLimpar(); }}
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.2)',
              color: '#F87171',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
            title="Limpar bey"
          >
            <X size={12} />
          </button>
        )}

        <div style={{ color: 'rgba(255,255,255,.4)', flexShrink: 0 }}>
          {bey.aberta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Body */}
      {bey.aberta && (
        <div style={{ padding: '6px 14px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          {/* Seletor de linha */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 12 }}>
            {(['BX', 'UX', 'CX'] as Linha[]).map(l => {
              const ativo = bey.linha === l;
              return (
                <button
                  key={l}
                  onClick={() => onLinha(l)}
                  style={{
                    flex: 1, padding: '8px 5px', borderRadius: 9,
                    border: `1px solid ${ativo ? corLinha(l) : 'rgba(255,255,255,.07)'}`,
                    background: ativo ? `${corLinha(l)}18` : 'rgba(255,255,255,.02)',
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontFamily: 'Orbitron,sans-serif', fontWeight: 700, fontSize: 12,
                    color: ativo ? corLinha(l) : 'rgba(255,255,255,.35)',
                  }}>
                    {l}
                  </div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,.2)', marginTop: 1 }}>
                    {l === 'BX' ? 'Basic' : l === 'UX' ? 'Unique' : 'Custom'}
                  </div>
                </button>
              );
            })}
          </div>

          {bey.linha === 'CX' ? (
            <>
              <PartSelector label="Lock Chip" tabela="bey_lock_chips" valor={bey.lockChip} onSelecionar={p => onPeca('lockChip', p)} />
              <PartSelector label="Main Blade" tabela="bey_main_blades" valor={bey.mainBlade} onSelecionar={p => onPeca('mainBlade', p)} />
              <PartSelector label="Assist Blade" tabela="bey_assist_blades" valor={bey.assistBlade} onSelecionar={p => onPeca('assistBlade', p)} />
              <PartSelector label="Ratchet" tabela="bey_ratchets" valor={bey.ratchet} onSelecionar={p => onPeca('ratchet', p)} />
              <PartSelector label="Bit" tabela="bey_bits" valor={bey.bit} onSelecionar={p => onPeca('bit', p)} />
            </>
          ) : (
            <>
              <PartSelector label="Blade" tabela="bey_blades" valor={bey.blade} onSelecionar={p => onPeca('blade', p)} linha={bey.linha} />
              <PartSelector label="Ratchet" tabela="bey_ratchets" valor={bey.ratchet} onSelecionar={p => onPeca('ratchet', p)} />
              <PartSelector label="Bit" tabela="bey_bits" valor={bey.bit} onSelecionar={p => onPeca('bit', p)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------- PART SELECTOR -----------------

function PartSelector({
  label, tabela, valor, onSelecionar, linha,
}: {
  label: string;
  tabela: string;
  valor: Peca | null;
  onSelecionar: (p: Peca | null) => void;
  linha?: Linha;
}) {
  const [aberto, setAberto] = useState(false);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [busca, setBusca] = useState('');
  const botaoRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  function abrirDropdown() {
    const rect = botaoRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setAberto(true);
  }

  // Fechar ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (botaoRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aberto]);

  // Fechar / reposicionar em scroll/resize
  useEffect(() => {
    if (!aberto) return;
    const close = () => setAberto(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [aberto]);

  useEffect(() => {
    let q: any = (supabase as any).from(tabela).select('*').order('nome');
    if (linha && (tabela === 'bey_blades')) q = q.eq('linha', linha);
    q.then(({ data }: any) => setPecas((data || []) as Peca[]));
  }, [tabela, linha]);

  const filtradas = useMemo(() =>
    pecas.filter(p => p.nome?.toLowerCase().includes(busca.toLowerCase())),
    [pecas, busca]);

  return (
    <div style={{ marginBottom: 10, position: 'relative' }}>
      <div style={{
        fontSize: 8, letterSpacing: 2, textTransform: 'uppercase',
        color: 'rgba(255,255,255,.22)', marginBottom: 7, fontWeight: 700,
      }}>
        {label}
      </div>

      <div
        ref={botaoRef}
        onClick={() => (aberto ? setAberto(false) : abrirDropdown())}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px',
          background: valor ? 'rgba(0,220,255,.03)' : '#111827',
          border: `1px solid ${valor ? 'rgba(0,220,255,.18)' : 'rgba(255,255,255,.08)'}`,
          borderRadius: 9, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: valor?.imagem_url ? `url(${valor.imagem_url}) center/contain no-repeat` : '#090c18',
          border: `1px ${valor ? 'solid' : 'dashed'} ${valor ? 'rgba(0,220,255,.18)' : 'rgba(255,255,255,.07)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 700,
        }}>
          {!valor?.imagem_url && (valor?.abreviacao || (valor ? valor.nome?.charAt(0) : '—'))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {valor ? (
            <>
              <div style={{
                fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 15,
                color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {valor.nome}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.32)', marginTop: 1 }}>
                {valor.tipo_ataque || valor.tipo || valor.abreviacao || ''}
                {valor.peso_g ? ` · ${valor.peso_g}g` : ''}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.22)' }}>
              Selecionar {label.toLowerCase()}...
            </div>
          )}
        </div>

        <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 11 }}>▾</div>
      </div>

      {/* Stats */}
      {valor && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(valor.atk ?? 0) > 0 && <StatBar label="ATK" value={valor.atk!} color="#EF4444" />}
          {(valor.def ?? 0) > 0 && <StatBar label="DEF" value={valor.def!} color="#60A5FA" />}
          {(valor.endr ?? 0) > 0 && <StatBar label="ENDR" value={valor.endr!} color="#34D399" />}
          {(valor.xdash ?? 0) > 0 && <StatBar label="XDASH" value={valor.xdash!} color="#C4B5FD" />}
          {(valor.br ?? 0) > 0 && <StatBar label="BR" value={valor.br!} color="#FCD34D" />}
        </div>
      )}

      {/* Dropdown via portal */}
      {aberto && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
            background: '#0d1120', border: '1px solid rgba(0,220,255,.15)',
            borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,.7)',
            display: 'flex', flexDirection: 'column', maxHeight: 280, overflow: 'hidden',
          }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
            <input
              autoFocus value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              style={{
                width: '100%', padding: '7px 10px', background: '#111827',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
                color: '#E2E8F0', fontSize: 12, outline: 'none',
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {valor && (
              <div
                onClick={() => { onSelecionar(null); setAberto(false); setBusca(''); }}
                style={{
                  padding: '9px 12px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,.03)',
                  fontSize: 11, color: '#F87171',
                  background: 'rgba(239,68,68,.04)',
                }}
              >
                ✕ Remover seleção
              </div>
            )}
            {filtradas.map(p => (
              <div
                key={p.id}
                onClick={() => { onSelecionar(p); setAberto(false); setBusca(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                  cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.03)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,220,255,.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: p.imagem_url ? `url(${p.imagem_url}) center/contain no-repeat` : '#090c18',
                  border: '1px solid rgba(255,255,255,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: 'rgba(255,255,255,.3)', fontWeight: 600,
                }}>
                  {!p.imagem_url && (p.abreviacao || p.nome?.charAt(0))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>
                    {p.tipo_ataque || p.tipo || ''}{p.linha ? ` · ${p.linha}` : ''}
                  </div>
                </div>
                {p.linha && (
                  <span style={{
                    padding: '2px 6px', borderRadius: 4, fontSize: 8, fontWeight: 700,
                    background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)',
                  }}>
                    {p.linha}
                  </span>
                )}
              </div>
            ))}
            {filtradas.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 12 }}>
                Nenhuma peça encontrada
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: .8, color: 'rgba(255,255,255,.32)', width: 32, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.min(100, value)}%`,
          background: `linear-gradient(90deg,${color},${color}88)`,
        }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color, width: 22, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ----------------- PAINEL DE ANÁLISE -----------------

function PainelAnalise({ beys }: { beys: Bey[] }) {
  const beysAtivas = beys.filter(b => !beyVazia(b));

  const radarData = useMemo(() => {
    const eixos: { eixo: string; key: 'atk' | 'def' | 'endr' | 'xdash' | 'br' }[] = [
      { eixo: 'Ataque', key: 'atk' },
      { eixo: 'Defesa', key: 'def' },
      { eixo: 'Endurance', key: 'endr' },
      { eixo: 'X-Dash', key: 'xdash' },
      { eixo: 'Burst Resist', key: 'br' },
    ];
    return eixos.map(({ eixo, key }) => {
      const row: any = { eixo };
      beys.forEach(b => {
        row[`Bey ${b.slot}`] = sumStat(b, key);
      });
      return row;
    });
  }, [beys]);

  // Score / médias
  const ataqueMedio = beysAtivas.length ? Math.round(beysAtivas.reduce((a, b) => a + calcAtk(b), 0) / beysAtivas.length) : 0;
  const defesaMedia = beysAtivas.length ? Math.round(beysAtivas.reduce((a, b) => a + calcDef(b), 0) / beysAtivas.length) : 0;
  const staminaMedia = beysAtivas.length ? Math.round(beysAtivas.reduce((a, b) => a + calcEndr(b), 0) / beysAtivas.length) : 0;
  const versatilidade = beysAtivas.length
    ? Math.round(((new Set(beysAtivas.map(b => b.blade?.tipo_ataque || b.mainBlade?.tipo_ataque || '')).size) / 4) * 100)
    : 0;

  const score = useMemo(() => {
    if (!beysAtivas.length) return 0;
    const total = (ataqueMedio + defesaMedia + staminaMedia + versatilidade) / 4;
    return Math.min(10, Math.round((total / 100) * 10 * 10) / 10);
  }, [beysAtivas, ataqueMedio, defesaMedia, staminaMedia, versatilidade]);

  // Tips
  const tips = useMemo(() => {
    const t: { tipo: 'ok' | 'aviso' | 'problema'; texto: string }[] = [];
    if (beysAtivas.length === 0) {
      t.push({ tipo: 'aviso', texto: 'Monte ao menos 1 bey para ver a análise.' });
      return t;
    }
    if (beysAtivas.length < 3) {
      t.push({ tipo: 'aviso', texto: `Você tem ${beysAtivas.length} bey(s) montada(s). Decks completos têm 3.` });
    } else {
      t.push({ tipo: 'ok', texto: 'Deck completo com 3 beys.' });
    }
    const tipos = new Set(beysAtivas.map(b => b.blade?.tipo_ataque || b.mainBlade?.tipo_ataque).filter(Boolean));
    if (tipos.size >= 3) t.push({ tipo: 'ok', texto: 'Boa diversidade de tipos no deck.' });
    else if (tipos.size === 1) t.push({ tipo: 'problema', texto: 'Todas as beys têm o mesmo tipo. Considere diversificar.' });
    else if (tipos.size === 2) t.push({ tipo: 'aviso', texto: 'Apenas 2 tipos diferentes — adicione variedade.' });

    if (ataqueMedio > 70) t.push({ tipo: 'ok', texto: 'Ataque alto, ótimo para finalizações.' });
    if (defesaMedia < 30 && beysAtivas.length >= 2) t.push({ tipo: 'aviso', texto: 'Defesa baixa em geral — vulnerável a ataques.' });
    if (staminaMedia > 70) t.push({ tipo: 'ok', texto: 'Boa stamina, dura bem em batalhas longas.' });

    beysAtivas.forEach(b => {
      if (b.linha === 'CX' && (!b.lockChip || !b.mainBlade || !b.assistBlade)) {
        t.push({ tipo: 'problema', texto: `Bey ${b.slot} (CX) está incompleta.` });
      }
      if (b.linha !== 'CX' && (!b.blade || !b.ratchet || !b.bit)) {
        t.push({ tipo: 'problema', texto: `Bey ${b.slot} está incompleta.` });
      }
    });

    return t;
  }, [beysAtivas, ataqueMedio, defesaMedia, staminaMedia]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720, margin: '0 auto' }}>
      {/* Resumo + Score */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,220,255,.06), #0b0f1f 60%)',
        border: '1px solid rgba(0,220,255,.18)',
        borderRadius: 14, padding: 18,
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{
          width: 84, height: 84, borderRadius: '50%',
          background: 'conic-gradient(#00DCFF 0%, #00DCFF ' + (score * 10) + '%, rgba(255,255,255,.06) ' + (score * 10) + '%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%', background: '#0b0f1f',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 800, fontSize: 22, color: '#00DCFF' }}>
              {score.toFixed(1)}
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', letterSpacing: 1 }}>/ 10</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: .5 }}>
            Análise do Deck
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>
            {beysAtivas.length}/3 beys montadas
          </div>
        </div>
      </div>

      {/* Radar */}
      <div style={{
        background: '#0b0f1f', border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 14, padding: 16,
      }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', marginBottom: 10 }}>
          Comparação de stats
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,.08)" />
              <PolarAngleAxis dataKey="eixo" tick={{ fill: 'rgba(255,255,255,.5)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,.25)', fontSize: 9 }} stroke="rgba(255,255,255,.08)" />
              {beys.map((b, i) => (
                <Radar
                  key={b.slot}
                  name={`Bey ${b.slot}${b.blade?.nome || b.mainBlade?.nome ? ` · ${b.blade?.nome || b.mainBlade?.nome}` : ''}`}
                  dataKey={`Bey ${b.slot}`}
                  stroke={CORES_BEY[i]}
                  strokeWidth={2}
                  strokeDasharray={i === 1 ? '5 4' : i === 2 ? '2 3' : undefined}
                  fill={CORES_BEY[i]}
                  fillOpacity={0.12}
                />
              ))}
              <Tooltip contentStyle={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda detalhada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {beys.map((b, i) => (
            <div key={b.slot} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,.02)',
            }}>
              <div style={{
                width: 28, height: 3, borderRadius: 2,
                background: CORES_BEY[i],
                ...(i === 1 ? { backgroundImage: `repeating-linear-gradient(90deg, ${CORES_BEY[i]} 0 6px, transparent 6px 10px)`, background: 'transparent' } : {}),
                ...(i === 2 ? { backgroundImage: `repeating-linear-gradient(90deg, ${CORES_BEY[i]} 0 2px, transparent 2px 5px)`, background: 'transparent' } : {}),
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: CORES_BEY[i], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Bey {b.slot} · {beyVazia(b) ? 'vazia' : previewCombo(b)}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
                  ATK {calcAtk(b)} · DEF {calcDef(b)} · ENDR {calcEndr(b)} · XDASH {calcXdash(b)} · BR {calcBr(b)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Médias do deck */}
      <div style={{
        background: '#0b0f1f', border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 14, padding: 16,
      }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', marginBottom: 12 }}>
          Médias do deck
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BarraMedia label="Ataque" valor={ataqueMedio} cor="#EF4444" />
          <BarraMedia label="Defesa" valor={defesaMedia} cor="#60A5FA" />
          <BarraMedia label="Stamina" valor={staminaMedia} cor="#34D399" />
          <BarraMedia label="Versatilidade" valor={versatilidade} cor="#A78BFA" />
        </div>
      </div>

      {/* Tips */}
      <div style={{
        background: '#0b0f1f', border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 14, padding: 16,
      }}>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', marginBottom: 12 }}>
          Análise & dicas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              padding: '8px 11px', borderRadius: 9,
              background: t.tipo === 'ok' ? 'rgba(52,211,153,.06)' : t.tipo === 'aviso' ? 'rgba(251,191,36,.06)' : 'rgba(239,68,68,.06)',
              border: `1px solid ${t.tipo === 'ok' ? 'rgba(52,211,153,.18)' : t.tipo === 'aviso' ? 'rgba(251,191,36,.18)' : 'rgba(239,68,68,.18)'}`,
            }}>
              <span style={{ fontSize: 13 }}>{t.tipo === 'ok' ? '✅' : t.tipo === 'aviso' ? '⚠️' : '❌'}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', lineHeight: 1.4 }}>{t.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarraMedia({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.6)', letterSpacing: .5 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{valor}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${Math.min(100, valor)}%`,
          background: `linear-gradient(90deg, ${cor}, ${cor}88)`,
          transition: 'width .8s ease-out',
        }} />
      </div>
    </div>
  );
}
