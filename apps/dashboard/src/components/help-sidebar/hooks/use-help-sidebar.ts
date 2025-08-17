import { useContext } from 'react';
import { HelpSidebarContext } from '../context';

export function useHelpSidebar() {
  const context = useContext(HelpSidebarContext);

  if (!context) {
    throw new Error('useHelpSidebar must be used within a HelpSidebarProvider');
  }

  return context;
}
