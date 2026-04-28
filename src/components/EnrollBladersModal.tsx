import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Search, X, Users, UserPlus, Check } from 'lucide-react';

interface BladerRow {
  key: string;            // unique key (prefix + id)
  blader_id: string | null;
  blader_temp_id: string | null;
  nome: string;
  avatar: string | null;
  cidade: string | null;
  beyblade: string | null;
  nivel: string | null;
  isTemp: boolean;
}

interface Props {
  tournamentId: string;
  tournamentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled?: () => void;
}

export default function EnrollBladersModal({ tournamentId, tournamentName, open, onOpenChange, onEnrolled }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'cadastrados' | 'rapido'>('cadastrados');

  // List + selection
  const [loading, setLoading] = useState(false);
  const [bladers, setBladers] = useState<BladerRow[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  // Quick add
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [beyblade, setBeyblade] = useState('');
  const [savingQuick, setSavingQuick] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('cadastrados');
    setSearch('');
    setSelected(new Set());
    setNome(''); setApelido(''); setEmail(''); setBeyblade('');
    loadData();
  }, [open, tournamentId]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [profilesRes, tempRes, inscritosRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, nome_blader, avatar_blader_url, cidade_blader, beyblade_favorita, nivel')
        .eq('tem_perfil_blader', true)
        .not('nome_blader', 'is', null)
        .order('nome_blader', { ascending: true })
        .limit(500),
      supabase
        .from('bladers_temp')
        .select('id, nome, apelido, avatar_url, cidade, beyblade_favorita, vinculado_a')
        .eq('organizador_id', user.id)
        .order('nome', { ascending: true })
        .limit(500),
      supabase
        .from('inscricoes')
        .select('blader_id, blader_temp_id')
        .eq('torneio_id', tournamentId)
        .eq('status', 'confirmado'),
    ]);

    const fromProfiles: BladerRow[] = (profilesRes.data ?? []).map((b: any) => ({
      key: `p:${b.id}`,
      blader_id: b.id,
      blader_temp_id: null,
      nome: b.nome_blader,
      avatar: b.avatar_blader_url,
      cidade: b.cidade_blader,
      beyblade: b.beyblade_favorita,
      nivel: b.nivel,
      isTemp: false,
    }));

    const fromTemp: BladerRow[] = (tempRes.data ?? [])
      .filter((b: any) => !b.vinculado_a)
      .map((b: any) => ({
        key: `t:${b.id}`,
        blader_id: null,
        blader_temp_id: b.id,
        nome: b.nome || b.apelido || 'Sem nome',
        avatar: b.avatar_url,
        cidade: b.cidade,
        beyblade: b.beyblade_favorita,
        nivel: null,
        isTemp: true,
      }));

    const merged = [...fromProfiles, ...fromTemp].sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '')
    );

    const enrolled = new Set<string>();
    (inscritosRes.data ?? []).forEach((r: any) => {
      if (r.blader_id) enrolled.add(`p:${r.blader_id}`);
      if (r.blader_temp_id) enrolled.add(`t:${r.blader_temp_id}`);
    });

    setBladers(merged);
    setEnrolledIds(enrolled);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bladers.filter(b => {
      if (enrolledIds.has(b.key)) return false;
      if (!term) return true;
      return (b.nome || '').toLowerCase().includes(term)
        || (b.cidade || '').toLowerCase().includes(term);
    });
  }, [bladers, enrolledIds, search]);

  function toggleOne(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(b => b.key)));
  }

  async function handleEnrollSelected() {
    if (selected.size === 0) return;
    setEnrolling(true);
    const byKey = new Map(bladers.map(b => [b.key, b]));
    const rows = Array.from(selected)
      .map(k => byKey.get(k))
      .filter((b): b is BladerRow => !!b)
      .map(b => ({
        torneio_id: tournamentId,
        blader_id: b.blader_id,
        blader_temp_id: b.blader_temp_id,
        status: 'confirmado',
      }));
    const { error } = await supabase.from('inscricoes').insert(rows);
    setEnrolling(false);
    if (error) { toast.error('Erro ao inscrever bladers'); return; }
    toast.success(`${rows.length} blader${rows.length > 1 ? 's' : ''} inscrito${rows.length > 1 ? 's' : ''}!`);
    setSelected(new Set());
    await loadData();
    onEnrolled?.();
  }

  async function handleQuickAdd() {
    if (!user) return;
    if (!nome.trim()) { toast.error('Nome obrigatório'); return; }
    setSavingQuick(true);
    const { data: bt, error: e1 } = await supabase
      .from('bladers_temp')
      .insert({
        organizador_id: user.id,
        nome: nome.trim(),
        apelido: apelido.trim().replace(/^@/, '') || null,
        email: email.trim().toLowerCase() || null,
        beyblade_favorita: beyblade.trim() || null,
      })
      .select()
      .single();
    if (e1 || !bt) { setSavingQuick(false); toast.error('Erro ao cadastrar'); return; }

    const { error: e2 } = await supabase
      .from('inscricoes')
      .insert({ torneio_id: tournamentId, blader_temp_id: bt.id, blader_id: null, status: 'confirmado' });
    setSavingQuick(false);
    if (e2) { toast.error('Cadastrado, mas falhou a inscrição'); return; }

    toast.success(`${nome.trim()} cadastrado e inscrito!`);
    setNome(''); setApelido(''); setEmail(''); setBeyblade('');
    setTab('cadastrados');
    onEnrolled?.();
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden border-0 max-w-[560px] w-full max-h-[85vh] flex flex-col [&>button:last-child]:hidden"
        style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20 }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#1e3a8a,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserPlus size={16} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Inscrever bladers</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', lineHeight: 1.2, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tournamentName}</div>
          </div>
          <button onClick={() => onOpenChange(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} className="mx-auto" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          {([
            { key: 'cadastrados', label: 'Bladers cadastrados' },
            { key: 'rapido', label: '+ Cadastro rápido' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: 12, background: 'transparent', border: 'none',
                borderBottom: tab === t.key ? '2px solid #2563EB' : '2px solid transparent',
                color: tab === t.key ? '#60A5FA' : 'rgba(255,255,255,.35)',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {tab === 'cadastrados' ? (
            <div style={{ padding: '14px 20px' }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={14} style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)' }} />
                <input
                  placeholder="Buscar blader pelo nome ou cidade..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 34px', background: '#111827', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                />
              </div>

              {loading ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 12 }}>Carregando bladers...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 12 }}>
                  {bladers.length === 0 ? 'Nenhum blader cadastrado no sistema.' : 'Nenhum blader disponível para inscrever.'}
                </div>
              ) : (
                <>
                  <button
                    onClick={toggleAll}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', marginBottom: 8 }}
                  >
                    <CheckBox checked={allSelected} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: 1, fontWeight: 700 }}>
                      SELECIONAR TODOS ({filtered.length})
                    </span>
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filtered.map(b => {
                      const isSel = selected.has(b.key);
                      return (
                        <button
                          key={b.key}
                          onClick={() => toggleOne(b.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9,
                            background: isSel ? 'rgba(37,99,235,.12)' : 'rgba(255,255,255,.03)',
                            border: `1px solid ${isSel ? 'rgba(37,99,235,.35)' : 'rgba(255,255,255,.06)'}`,
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <CheckBox checked={isSel} />
                          {b.avatar ? (
                            <img src={b.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: b.isTemp ? 'linear-gradient(135deg,#92400e,#f59e0b)' : 'linear-gradient(135deg,#1e3a8a,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {(b.nome || 'B').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nome}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
                              {b.cidade || ''}{b.nivel ? ` · ${b.nivel}` : ''}{b.beyblade ? ` · ${b.beyblade}` : ''}
                            </div>
                          </div>
                          {b.isTemp && (
                            <div style={{
                              padding: '2px 7px', borderRadius: 6,
                              background: 'rgba(245,158,11,.1)',
                              border: '1px solid rgba(245,158,11,.2)',
                              color: '#FCD34D', fontSize: 9,
                              fontWeight: 700, letterSpacing: 1,
                              flexShrink: 0,
                            }}>
                              CADASTRO RÁPIDO
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { v: nome, set: setNome, ph: 'Nome completo *' },
                { v: apelido, set: setApelido, ph: 'Apelido / Handle' },
                { v: email, set: setEmail, ph: 'Email (para vincular conta depois)', type: 'email' },
                { v: beyblade, set: setBeyblade, ph: 'Beyblade favorita' },
              ].map((f, i) => (
                <input
                  key={i}
                  placeholder={f.ph}
                  type={(f as any).type || 'text'}
                  value={f.v}
                  onChange={e => f.set(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', background: '#111827', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                />
              ))}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', lineHeight: 1.4 }}>
                💡 Se informar o email, quando essa pessoa criar conta no BLADEX o sistema oferecerá vinculação automática.
              </div>
              <button
                onClick={handleQuickAdd}
                disabled={savingQuick || !nome.trim()}
                style={{
                  marginTop: 4, padding: '12px 18px', background: !nome.trim() ? 'rgba(37,99,235,.3)' : '#2563EB',
                  border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Rajdhani, sans-serif',
                  fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: savingQuick ? 'wait' : 'pointer',
                }}
              >
                {savingQuick ? 'Salvando...' : 'Cadastrar e inscrever'}
              </button>
            </div>
          )}
        </div>

        {/* Footer (only on cadastrados tab) */}
        {tab === 'cadastrados' && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={13} /> {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleEnrollSelected}
              disabled={selected.size === 0 || enrolling}
              style={{
                padding: '11px 18px', background: selected.size === 0 ? 'rgba(37,99,235,.25)' : '#2563EB',
                border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Rajdhani, sans-serif',
                fontSize: 13, fontWeight: 700, letterSpacing: 1,
                cursor: selected.size === 0 ? 'not-allowed' : (enrolling ? 'wait' : 'pointer'),
              }}
            >
              {enrolling ? 'Inscrevendo...' : 'Inscrever selecionados'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
      background: checked ? '#2563EB' : 'transparent',
      border: `1.5px solid ${checked ? '#2563EB' : 'rgba(255,255,255,.2)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .15s',
    }}>
      {checked && <Check size={12} color="#fff" strokeWidth={3} />}
    </div>
  );
}
