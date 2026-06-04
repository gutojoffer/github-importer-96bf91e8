import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Marca se o usuário pediu logout explicitamente. Evita que um evento
  // transitório (ex.: SIGNED_OUT vindo de outra aba sem refresh válido)
  // derrube a sessão atual sem confirmação.
  const explicitSignOut = useRef(false);

  useEffect(() => {
    let mounted = true;

    // 1) Listener primeiro, para capturar TOKEN_REFRESHED / SIGNED_IN / etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      // Ignora SIGNED_OUT que não veio do usuário (ex.: outra aba ou refresh transiente)
      if (event === 'SIGNED_OUT' && !explicitSignOut.current) {
        // Re-tenta recuperar a sessão do storage antes de aceitar o logout
        supabase.auth.getSession().then(({ data }) => {
          if (!mounted) return;
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
          } else {
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        });
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    // 2) Hidratar imediatamente a partir do storage local
    supabase.auth.getSession()
      .then(({ data: { session: existing } }) => {
        if (!mounted) return;
        if (existing) {
          setSession(existing);
          setUser(existing.user);
        }
      })
      .catch((err) => console.warn('[Auth] getSession falhou:', err?.message))
      .finally(() => { if (mounted) setLoading(false); });

    // 3) Sincronizar entre abas via evento de storage
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.includes('-auth-token')) return;
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      });
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const signOut = async () => {
    explicitSignOut.current = true;
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      // Libera a flag depois de um tick para deixar o evento SIGNED_OUT passar
      setTimeout(() => { explicitSignOut.current = false; }, 500);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
