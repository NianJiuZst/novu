import { createContext } from 'react';

type HelpSidebarState = {
  isOpen: boolean;
  searchQuery: string;
  selectedSuggestion: string | null;
  viewHistory: string[];
};

type HelpSidebarContextType = {
  state: HelpSidebarState;
  openHelpSidebar: () => void;
  closeHelpSidebar: () => void;
  toggleHelpSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedSuggestion: (suggestion: string | null) => void;
  addToViewHistory: (view: string) => void;
};

export const HelpSidebarContext = createContext<HelpSidebarContextType | null>(null);
