import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TipoConta = 'organizador' | 'blader';

export interface BladerProfile {
  tipoConta: TipoConta;
  nome: string | null;
  cidade: string | null;
  beybladeFavorita: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isComplete: boolean;
}

/**
 * Lê o perfil do usuário logado e retorna seu tipo + se está completo.
 * Para Bladers, "completo" exige nome e cidade.
 */
export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<BladerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setProfile(null); setLoading(false); return; }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tipo_conta, nome_liga, cidade, beyblade_favorita, avatar_url, bio')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!data) {
        setProfile({
          tipoConta: 'organizador',
          nome: null, cidade: null, beybladeFavorita: null, avatarUrl: null, bio: null,
          isComplete: false,
        });
      } else {
        const tipoConta = (data.tipo_conta as TipoConta) || 'organizador';
        const nome = data.nome_liga;
        const cidade = data.cidade;
        const isComplete = tipoConta === 'organizador'
          ? !!nome
          : !!(nome && cidade);
        setProfile({
          tipoConta,
          nome,
          cidade,
          beybladeFavorita: data.beyblade_favorita,
          avatarUrl: data.avatar_url,
          bio: data.bio,
          isComplete,
        });
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { profile, loading: authLoading || loading };
}
