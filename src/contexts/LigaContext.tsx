import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LigaData {
  nomeLiga: string;
  logoUrl: string | null;
  descricao: string;
  cidade: string;
  endereco: string;
}

interface LigaContextType extends LigaData {
  loading: boolean;
  refresh: () => void;
  updateLiga: (data: Partial<LigaData>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  removeLogo: () => Promise<void>;
}

const LigaContext = createContext<LigaContextType>({
  nomeLiga: '',
  logoUrl: null,
  descricao: '',
  cidade: '',
  endereco: '',
  loading: true,
  refresh: () => {},
  updateLiga: async () => {},
  uploadLogo: async () => '',
  removeLogo: async () => {},
});

export const useLiga = () => useContext(LigaContext);

export function LigaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<LigaData>({
    nomeLiga: '', logoUrl: null, descricao: '', cidade: '', endereco: '',
  });
  const [loading, setLoading] = useState(true);

  const loadFromUser = useCallback(() => {
    if (!user) {
      setData({ nomeLiga: '', logoUrl: null, descricao: '', cidade: '', endereco: '' });
      setLoading(false);
      return;
    }
    const meta = user.user_metadata || {};
    setData({
      nomeLiga: meta.nome_liga || user.email?.split('@')[0] || '',
      logoUrl: meta.logo_url || null,
      descricao: meta.descricao || '',
      cidade: meta.cidade || '',
      endereco: meta.endereco || '',
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { loadFromUser(); }, [loadFromUser]);

  const refresh = useCallback(async () => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      const meta = freshUser.user_metadata || {};
      setData({
        nomeLiga: meta.nome_liga || freshUser.email?.split('@')[0] || '',
        logoUrl: meta.logo_url || null,
        descricao: meta.descricao || '',
        cidade: meta.cidade || '',
        endereco: meta.endereco || '',
      });
    }
  }, []);

  const updateLiga = useCallback(async (patch: Partial<LigaData>) => {
    const metaPatch: Record<string, any> = {};
    if (patch.nomeLiga !== undefined) metaPatch.nome_liga = patch.nomeLiga;
    if (patch.logoUrl !== undefined) metaPatch.logo_url = patch.logoUrl;
    if (patch.descricao !== undefined) metaPatch.descricao = patch.descricao;
    if (patch.cidade !== undefined) metaPatch.cidade = patch.cidade;
    if (patch.endereco !== undefined) metaPatch.endereco = patch.endereco;

    const { error } = await supabase.auth.updateUser({ data: metaPatch });
    if (error) throw error;
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() || 'png';
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos-ligas')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('logos-ligas').getPublicUrl(path);
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();

    await updateLiga({ logoUrl: publicUrl });
    return publicUrl;
  }, [user, updateLiga]);

  const removeLogo = useCallback(async () => {
    if (!user) return;
    // Try to delete the file (ignore errors if it doesn't exist)
    await supabase.storage.from('logos-ligas').remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.webp`]);
    await updateLiga({ logoUrl: null });
  }, [user, updateLiga]);

  return (
    <LigaContext.Provider value={{ ...data, loading, refresh, updateLiga, uploadLogo, removeLogo }}>
      {children}
    </LigaContext.Provider>
  );
}
