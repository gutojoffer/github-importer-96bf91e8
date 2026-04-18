import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type ActiveMode = 'organizador' | 'blader';

interface ActiveModeCtx {
  mode: ActiveMode | null;
  setMode: (m: ActiveMode) => void;
  clearMode: () => void;
}

const Ctx = createContext<ActiveModeCtx>({
  mode: null,
  setMode: () => {},
  clearMode: () => {},
});

export const useActiveMode = () => useContext(Ctx);

const storageKey = (uid: string) => `bladex.activeMode.${uid}`;

export function ActiveModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ActiveMode | null>(null);

  useEffect(() => {
    if (!user) { setModeState(null); return; }
    const stored = localStorage.getItem(storageKey(user.id)) as ActiveMode | null;
    setModeState(stored);
  }, [user]);

  const setMode = (m: ActiveMode) => {
    if (!user) return;
    localStorage.setItem(storageKey(user.id), m);
    setModeState(m);
  };

  const clearMode = () => {
    if (!user) return;
    localStorage.removeItem(storageKey(user.id));
    setModeState(null);
  };

  return <Ctx.Provider value={{ mode, setMode, clearMode }}>{children}</Ctx.Provider>;
}
