import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Camera, X, Search } from 'lucide-react';

type TabKey = 'blades' | 'ratchets' | 'bits' | 'lock_chips' | 'main_blades' | 'assist_blades';

interface TabDef {
  key: TabKey;
  label: string;
  table: string;
  hasStats: boolean;
  hasLinha: boolean;
  hasTipo: boolean;
  hasSpin: boolean;
  hasPeso: boolean;
}

const TABS: TabDef[] = [
  { key: 'blades',        label: 'Blades',         table: 'bey_blades',        hasStats: true,  hasLinha: true,  hasTipo: true,  hasSpin: true,  hasPeso: true  },
  { key: 'ratchets',      label: 'Ratchets',       table: 'bey_ratchets',      hasStats: true,  hasLinha: true,  hasTipo: false, hasSpin: false, hasPeso: false },
  { key: 'bits',          label: 'Bits',           table: 'bey_bits',          hasStats: true,  hasLinha: true,  hasTipo: false, hasSpin: false, hasPeso: false },
  { key: 'lock_chips',    label: 'Lock Chips (CX)',table: 'bey_lock_chips',    hasStats: false, hasLinha: false, hasTipo: false, hasSpin: false, hasPeso: false },
  { key: 'main_blades',   label: 'Main Blades (CX)',table: 'bey_main_blades',  hasStats: true,  hasLinha: false, hasTipo: true,  hasSpin: false, hasPeso: false },
  { key: 'assist_blades', label: 'Assist Blades (CX)',table: 'bey_assist_blades',hasStats: false,hasLinha: false,hasTipo: false, hasSpin: false, hasPeso: false },
];

interface Peca {
  id: number;
  nome: string;
  imagem_url?: string | null;
  linha?: string | null;
  tipo_ataque?: string | null;
  spin?: string | null;
  peso_g?: number | null;
  atk?: number | null;
  def?: number | null;
  endr?: number | null;
  xdash?: number | null;
  br?: number | null;
  [key: string]: any;
}

const STAT_KEYS: Array<'atk' | 'def' | 'endr' | 'xdash' | 'br'> = ['atk', 'def', 'endr', 'xdash', 'br'];

export default function AdminForjaBey() {
  const [activeTab, setActiveTab] = useState<TabKey>('blades');
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLinha, setFilterLinha] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterImg, setFilterImg] = useState<'all' | 'com' | 'sem'>('all');
  const [editing, setEditing] = useState<Peca | null>(null);
  const [showModal, setShowModal] = useState(false);

  const tabDef = TABS.find(t => t.key === activeTab)!;

  async function fetchPecas() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from(tabDef.table)
      .select('*')
      .order('nome', { ascending: true });
    if (error) toast.error('Erro ao carregar peças');
    setPecas(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPecas();
    setSearch(''); setFilterLinha('all'); setFilterTipo('all'); setFilterImg('all');
  }, [activeTab]);

  const filtered = useMemo(() => {
    return pecas.filter(p => {
      if (search && !p.nome?.toLowerCase().includes(search.toLowerCase())) return false;
      if (tabDef.hasLinha && filterLinha !== 'all' && p.linha !== filterLinha) return false;
      if (tabDef.hasTipo && filterTipo !== 'all' && p.tipo_ataque !== filterTipo) return false;
      if (filterImg === 'com' && !p.imagem_url) return false;
      if (filterImg === 'sem' && p.imagem_url) return false;
      return true;
    });
  }, [pecas, search, filterLinha, filterTipo, filterImg, tabDef]);

  const stats = useMemo(() => ({
    total: pecas.length,
    comImg: pecas.filter(p => p.imagem_url).length,
    semImg: pecas.filter(p => !p.imagem_url).length,
  }), [pecas]);

  async function uploadImagem(file: File, id: number) {
    const ext = file.name.split('.').pop();
    const path = `${tabDef.table}/${id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('bey-parts').upload(path, file, { upsert: true });
    if (upErr) { toast.error('Falha no upload'); return; }
    const { data } = supabase.storage.from('bey-parts').getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    const { error } = await (supabase as any).from(tabDef.table).update({ imagem_url: publicUrl }).eq('id', id);
    if (error) { toast.error('Falha ao salvar URL'); return; }
    toast.success('Imagem atualizada!');
    fetchPecas();
  }

  async function deletePeca(id: number) {
    if (!confirm('Deletar esta peça?')) return;
    const { error } = await (supabase as any).from(tabDef.table).delete().eq('id', id);
    if (error) { toast.error('Erro ao deletar: ' + error.message); return; }
    toast.success('Peça deletada');
    fetchPecas();
  }

  function openCreate() {
    setEditing({ id: 0, nome: '', linha: tabDef.hasLinha ? 'BX' : null });
    setShowModal(true);
  }
  function openEdit(p: Peca) {
    setEditing({ ...p });
    setShowModal(true);
  }

  async function savePeca(imagemFile?: File | null, removerImagem?: boolean) {
    if (!editing) return;
    if (!editing.nome?.trim()) { toast.error('Nome obrigatório'); return; }

    const payload: any = { nome: editing.nome.trim() };
    if (tabDef.hasLinha) payload.linha = editing.linha || 'BX';
    if (tabDef.hasTipo) payload.tipo_ataque = editing.tipo_ataque || null;
    if (tabDef.hasSpin) payload.spin = editing.spin || 'Right';
    if (tabDef.hasPeso) payload.peso_g = editing.peso_g ? Number(editing.peso_g) : null;
    if (tabDef.hasStats) {
      STAT_KEYS.forEach(k => { payload[k] = Number(editing[k] ?? 0); });
    }

    // Upload da imagem se selecionada
    if (imagemFile) {
      const ext = imagemFile.name.split('.').pop();
      const path = `${tabDef.table}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('bey-parts').upload(path, imagemFile, { upsert: true });
      if (upErr) { toast.error('Erro no upload da imagem'); return; }
      const { data } = supabase.storage.from('bey-parts').getPublicUrl(path);
      payload.imagem_url = `${data.publicUrl}?t=${Date.now()}`;
    } else if (removerImagem) {
      payload.imagem_url = null;
    }

    if (editing.id && editing.id > 0) {
      const { error } = await (supabase as any).from(tabDef.table).update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Peça atualizada');
    } else {
      const { error } = await (supabase as any).from(tabDef.table).insert(payload);
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Peça criada');
    }
    setShowModal(false);
    setEditing(null);
    fetchPecas();
  }

  const linhasDisponiveis = Array.from(new Set(pecas.map(p => p.linha).filter(Boolean))) as string[];
  const tiposDisponiveis = Array.from(new Set(pecas.map(p => p.tipo_ataque).filter(Boolean))) as string[];

  return (
    <div style={{ padding: 24, background: '#0a0d18', minHeight: '100dvh', color: '#fff' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: 1 }}>
          ForjaBey · Gerenciamento de Peças
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
          Cadastre, edite e gerencie todas as peças do sistema ForjaBey.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#08091a', padding: 4, borderRadius: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: '1 1 auto',
              padding: '10px 14px',
              background: activeTab === t.key ? 'linear-gradient(135deg, #00d4ff22, #00d4ff11)' : 'transparent',
              border: activeTab === t.key ? '1px solid #00d4ff44' : '1px solid transparent',
              color: activeTab === t.key ? '#00d4ff' : '#9ca3af',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: 0.5,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total de peças', val: stats.total, color: '#00d4ff' },
          { label: 'Com imagem', val: stats.comImg, color: '#39FF14' },
          { label: 'Sem imagem', val: stats.semImg, color: '#FF2D55' },
        ].map(c => (
          <div key={c.label} style={{ background: '#0f1322', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, fontFamily: 'Rajdhani, sans-serif' }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#6b7280' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#0f1322', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, color: '#fff', fontSize: 13 }}
          />
        </div>
        {tabDef.hasLinha && (
          <select value={filterLinha} onChange={e => setFilterLinha(e.target.value)}
            style={{ padding: '8px 10px', background: '#0f1322', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, color: '#fff', fontSize: 13 }}>
            <option value="all">Todas linhas</option>
            {['BX','UX','CX'].concat(linhasDisponiveis.filter(l => !['BX','UX','CX'].includes(l))).map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        )}
        {tabDef.hasTipo && (
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
            style={{ padding: '8px 10px', background: '#0f1322', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, color: '#fff', fontSize: 13 }}>
            <option value="all">Todos tipos</option>
            {['Attack','Defense','Stamina','Balance'].concat(tiposDisponiveis.filter(t => !['Attack','Defense','Stamina','Balance'].includes(t))).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <select value={filterImg} onChange={e => setFilterImg(e.target.value as any)}
          style={{ padding: '8px 10px', background: '#0f1322', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, color: '#fff', fontSize: 13 }}>
          <option value="all">Todas</option>
          <option value="com">Com imagem</option>
          <option value="sem">Sem imagem</option>
        </select>
        <button onClick={openCreate}
          style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #00d4ff, #0099cc)', border: 'none', color: '#000', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Nova peça
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: 13 }}>
          Nenhuma peça encontrada. Clique em "Nova peça" para criar.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(p => (
            <PecaCard key={p.id} peca={p} tabDef={tabDef} onUpload={uploadImagem} onEdit={openEdit} onDelete={deletePeca} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && editing && (
        <PecaModal
          editing={editing} setEditing={setEditing} tabDef={tabDef}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={savePeca}
        />
      )}
    </div>
  );
}

function PecaCard({ peca, tabDef, onUpload, onEdit, onDelete }: {
  peca: Peca; tabDef: TabDef;
  onUpload: (file: File, id: number) => void;
  onEdit: (p: Peca) => void;
  onDelete: (id: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div style={{ background: '#0f1322', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 8, background: '#08091a',
          border: '1px solid rgba(255,255,255,.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {peca.imagem_url ? (
            <img src={peca.imagem_url} alt={peca.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 28, fontWeight: 700, color: '#00d4ff', fontFamily: 'Rajdhani' }}>
              {peca.nome?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            {peca.linha && <Badge color="#00d4ff">{peca.linha}</Badge>}
            {peca.tipo_ataque && <Badge color="#FF2D55">{peca.tipo_ataque}</Badge>}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {peca.nome}
          </div>
          {tabDef.hasStats && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {STAT_KEYS.map(k => (
                <StatBar key={k} label={k.toUpperCase()} val={Number(peca[k] ?? 0)} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, peca.id); e.target.value = ''; }} />
        <button onClick={() => fileRef.current?.click()} title="Upload imagem"
          style={btnSmall('#00d4ff')}><Camera size={13} /></button>
        <button onClick={() => onEdit(peca)} title="Editar"
          style={btnSmall('#39FF14')}><Pencil size={13} /></button>
        <button onClick={() => onDelete(peca.id)} title="Deletar"
          style={btnSmall('#FF2D55')}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: any; color: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: 0.5 }}>
      {children}
    </span>
  );
}

function StatBar({ label, val }: { label: string; val: number }) {
  const pct = Math.min(100, Math.max(0, val));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
      <span style={{ color: '#9ca3af', width: 38 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: '#08091a', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #00d4ff, #39FF14)' }} />
      </div>
      <span style={{ color: '#fff', width: 22, textAlign: 'right' }}>{val}</span>
    </div>
  );
}

function btnSmall(color: string): React.CSSProperties {
  return {
    flex: 1, padding: 7, background: `${color}11`, border: `1px solid ${color}33`,
    borderRadius: 5, color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function PecaModal({ editing, setEditing, tabDef, onClose, onSave }: {
  editing: Peca; setEditing: (p: Peca) => void; tabDef: TabDef;
  onClose: () => void; onSave: (file?: File | null, remover?: boolean) => void;
}) {
  const upd = (k: string, v: any) => setEditing({ ...editing, [k]: v });
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(editing.imagem_url || null);
  const [removerImagem, setRemoverImagem] = useState(false);

  function handleImagemChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo 2MB.'); return; }
    setImagemFile(file);
    setRemoverImagem(false);
    const reader = new FileReader();
    reader.onload = ev => setImagemPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removerImg() {
    setImagemFile(null);
    setImagemPreview(null);
    setRemoverImagem(true);
  }
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#0f1322', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: '#fff' }}>
            {editing.id ? 'Editar peça' : 'Nova peça'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <Field label="Nome">
          <input value={editing.nome} onChange={e => upd('nome', e.target.value)} style={inputStyle} />
        </Field>

        {/* Upload de imagem */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Imagem da peça
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 10, flexShrink: 0,
              background: imagemPreview ? `url(${imagemPreview}) center/contain no-repeat #08091a` : '#08091a',
              border: imagemPreview ? '1px solid rgba(0,212,255,.3)' : '2px dashed rgba(255,255,255,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!imagemPreview && <Camera size={22} style={{ opacity: .35, color: '#fff' }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{
                padding: '7px 12px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.3)',
                color: '#00d4ff', fontSize: 12, fontWeight: 700,
                fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1,
              }}>
                {imagemPreview ? 'Trocar imagem' : 'Selecionar imagem'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagemChange} />
              </label>
              {imagemPreview && (
                <button type="button" onClick={removerImg}
                  style={{ padding: '5px 10px', borderRadius: 5, background: 'rgba(255,45,85,.08)', border: '1px solid rgba(255,45,85,.2)', color: '#FF2D55', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Remover
                </button>
              )}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>PNG ou JPEG · máx 2MB</span>
            </div>
          </div>
        </div>

        {tabDef.hasLinha && (
          <Field label="Linha">
            <select value={editing.linha || 'BX'} onChange={e => upd('linha', e.target.value)} style={inputStyle}>
              <option value="BX">BX</option><option value="UX">UX</option><option value="CX">CX</option>
            </select>
          </Field>
        )}

        {tabDef.hasTipo && (
          <Field label="Tipo de ataque">
            <select value={editing.tipo_ataque || ''} onChange={e => upd('tipo_ataque', e.target.value)} style={inputStyle}>
              <option value="">—</option>
              <option value="Attack">Attack</option>
              <option value="Defense">Defense</option>
              <option value="Stamina">Stamina</option>
              <option value="Balance">Balance</option>
            </select>
          </Field>
        )}

        {tabDef.hasSpin && (
          <Field label="Spin">
            <select value={editing.spin || 'Right'} onChange={e => upd('spin', e.target.value)} style={inputStyle}>
              <option value="Right">Right</option><option value="Left">Left</option>
            </select>
          </Field>
        )}

        {tabDef.hasPeso && (
          <Field label="Peso (g)">
            <input type="number" step="0.1" value={editing.peso_g ?? ''} onChange={e => upd('peso_g', e.target.value)} style={inputStyle} />
          </Field>
        )}

        {tabDef.hasStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
            {STAT_KEYS.map(k => (
              <Field key={k} label={k.toUpperCase()}>
                <input type="number" min={0} max={100} value={editing[k] ?? 0}
                  onChange={e => upd(k, e.target.value)} style={inputStyle} />
              </Field>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={() => onSave(imagemFile, removerImagem)} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #00d4ff, #0099cc)', border: 'none', borderRadius: 6, color: '#000', cursor: 'pointer', fontWeight: 700 }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: '#08091a',
  border: '1px solid rgba(255,255,255,.1)', borderRadius: 5, color: '#fff', fontSize: 13,
};
