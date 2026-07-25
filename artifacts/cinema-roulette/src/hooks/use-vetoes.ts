import { useState, useCallback } from 'react';

// Vetoes are stored in sessionStorage so they clear when the tab/browser is closed.
const VETO_KEY = 'cinema-roulette-vetoes';

function loadVetoes(): string[] {
  try {
    const raw = sessionStorage.getItem(VETO_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveVetoes(vetoes: string[]): void {
  try {
    sessionStorage.setItem(VETO_KEY, JSON.stringify(vetoes));
  } catch {
    // sessionStorage may be unavailable in some contexts
  }
}

export function useVetoes() {
  const [vetoes, setVetoes] = useState<string[]>(() => loadVetoes());

  const addVeto = useCallback((id: string) => {
    setVetoes(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveVetoes(next);
      return next;
    });
  }, []);

  const removeVeto = useCallback((id: string) => {
    setVetoes(prev => {
      const next = prev.filter(v => v !== id);
      saveVetoes(next);
      return next;
    });
  }, []);

  const toggleVeto = useCallback((id: string) => {
    setVetoes(prev => {
      const next = prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id];
      saveVetoes(next);
      return next;
    });
  }, []);

  const clearVetoes = useCallback((ids?: string[]) => {
    setVetoes(prev => {
      const next = ids ? prev.filter(v => !ids.includes(v)) : [];
      saveVetoes(next);
      return next;
    });
  }, []);

  const isVetoed = useCallback((id: string) => vetoes.includes(id), [vetoes]);

  return { vetoes, addVeto, removeVeto, toggleVeto, clearVetoes, isVetoed };
}
