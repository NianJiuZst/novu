import { ReactNode, useCallback, useState } from 'react';
import { HelpSidebarContext } from './context';

type HelpSidebarProviderProps = {
  children: ReactNode;
};

export function HelpSidebarProvider({ children }: HelpSidebarProviderProps) {
  const [state, setState] = useState({
    isOpen: false,
    searchQuery: '',
    selectedSuggestion: null as string | null,
    viewHistory: [] as string[],
  });

  const openHelpSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeHelpSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, searchQuery: '', selectedSuggestion: null }));
  }, []);

  const toggleHelpSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setSelectedSuggestion = useCallback((suggestion: string | null) => {
    setState((prev) => ({ ...prev, selectedSuggestion: suggestion }));
  }, []);

  const addToViewHistory = useCallback((view: string) => {
    setState((prev) => ({
      ...prev,
      viewHistory: [...prev.viewHistory.filter((v) => v !== view), view].slice(-5), // Keep last 5 views
    }));
  }, []);

  const value = {
    state,
    openHelpSidebar,
    closeHelpSidebar,
    toggleHelpSidebar,
    setSearchQuery,
    setSelectedSuggestion,
    addToViewHistory,
  };

  return <HelpSidebarContext.Provider value={value}>{children}</HelpSidebarContext.Provider>;
}
