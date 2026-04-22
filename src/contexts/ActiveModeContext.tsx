import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type ActiveMode = 'organizador' | 'blader';

interface ActiveModeCtx {
  mode: ActiveMode | null;
  setMode: (m: ActiveMode) => void;
  clearMode: () => void;
  perfis: {
    temOrganizador: boolean;
    temBlader: boolean;
    dadosOrganizador: {
      nomeLiga: string | null;
      logo: string | null;
      cidade: string | null;
    } | null;
    dadosBlader: {
      nome: string | null;
      avatar: string | null;
      cidade: string | null;
      beyblade: string | null;
      corPerfil: string | null;
    } | null;
    loading: boolean;
  };
  refreshProfiles: () => Promise<void>;
}

const emptyPerfis = {
  temOrganizador: false,
  temBlader: false,
  dadosOrganizador: null,
  dadosBlader: null,
  loading: true,
} satisfies ActiveModeCtx['perfis'];

const Ctx = createContext<ActiveModeCtx>({
  mode: null,
  setMode: () => {},
  clearMode: () => {},
  perfis: emptyPerfis,
  refreshProfiles: async () => {},
});

export const useActiveMode = () => useContext(Ctx);

const storageKey = (uid: string) => `bladex.activeMode.${uid}`;

export function ActiveModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ActiveMode | null>(null);
  const [perfis, setPerfis] = useState<ActiveModeCtx['perfis']>(emptyPerfis);

  const hydrateProfiles = useCallback(async (uid: string, preferredMode?: ActiveMode | null) => {
    setPerfis((current) => ({ ...current, loading: true }));

    const { data } = await supabase
      .from('profiles')
      .select('tipo_conta, nome_liga, logo_url, cidade, tem_perfil_organizador, tem_perfil_blader, nome_blader, avatar_blader_url, cidade_blader, beyblade_favorita, cor_perfil')
      .eq('id', uid)
      .maybeSingle();

    const profile = data as {
      tipo_conta?: string | null;
      nome_liga?: string | null;
      logo_url?: string | null;
      cidade?: string | null;
      tem_perfil_organizador?: boolean | null;
      tem_perfil_blader?: boolean | null;
      nome_blader?: string | null;
      avatar_blader_url?: string | null;
      cidade_blader?: string | null;
      beyblade_favorita?: string | null;
      cor_perfil?: string | null;
    } | null;

    const temOrganizador = !!(profile?.nome_liga || profile?.tem_perfil_organizador || profile?.tipo_conta === 'organizador');
    const temBlader = !!(profile?.tem_perfil_blader && profile?.nome_blader);

    setPerfis({
      temOrganizador,
      temBlader,
      dadosOrganizador: temOrganizador ? {
        nomeLiga: profile?.nome_liga ?? null,
        logo: profile?.logo_url ?? null,
        cidade: profile?.cidade ?? null,
      } : null,
      dadosBlader: temBlader ? {
        nome: profile?.nome_blader ?? null,
        avatar: profile?.avatar_blader_url ?? null,
        cidade: profile?.cidade_blader ?? null,
        beyblade: profile?.beyblade_favorita ?? null,
        corPerfil: profile?.cor_perfil ?? null,
      } : null,
      loading: false,
    });

    const stored = preferredMode ?? (localStorage.getItem(storageKey(uid)) as ActiveMode | null);
    const resolvedMode = stored === 'blader' && temBlader
      ? 'blader'
      : stored === 'organizador' && temOrganizador
        ? 'organizador'
        : temOrganizador
          ? 'organizador'
          : temBlader
            ? 'blader'
            : null;

    setModeState(resolvedMode);

    if (resolvedMode) {
      localStorage.setItem(storageKey(uid), resolvedMode);
    } else {
      localStorage.removeItem(storageKey(uid));
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setModeState(null);
      setPerfis({ ...emptyPerfis, loading: false });
      return;
    }

    void hydrateProfiles(user.id);
  }, [user, hydrateProfiles]);

  const setMode = useCallback((m: ActiveMode) => {
    if (!user) return;
    localStorage.setItem(storageKey(user.id), m);
    setModeState(m);
  }, [user]);

  const clearMode = useCallback(() => {
    if (!user) return;
    localStorage.removeItem(storageKey(user.id));
    setModeState(null);
  }, [user]);

  const refreshProfiles = useCallback(async () => {
    if (!user) {
      setPerfis({ ...emptyPerfis, loading: false });
      return;
    }

    await hydrateProfiles(user.id, mode);
  }, [user, mode, hydrateProfiles]);

  return <Ctx.Provider value={{ mode, setMode, clearMode, perfis, refreshProfiles }}>{children}</Ctx.Provider>;
}
