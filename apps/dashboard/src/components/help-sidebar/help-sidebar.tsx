import { RiCloseLine } from 'react-icons/ri';
import { CompactButton } from '@/components/primitives/button-compact';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/primitives/sheet';
import { VisuallyHidden } from '@/components/primitives/visually-hidden';
import { FooterActions } from './components/footer-actions';
import { GettingStarted } from './components/getting-started';
import { SearchSection } from './components/search-section';
import { SuggestionsSection } from './components/suggestions-section';
import { useHelpSidebar } from './hooks/use-help-sidebar';

export function HelpSidebar() {
  const { state, closeHelpSidebar } = useHelpSidebar();

  return (
    <Sheet open={state.isOpen} onOpenChange={(open) => !open && closeHelpSidebar()}>
      <SheetContent side="right" className="w-[420px] !max-w-none p-0 h-[calc(100vh)] flex flex-col">
        <VisuallyHidden>
          <SheetTitle>Help & Support</SheetTitle>
          <SheetDescription>Get help and find resources for using Novu</SheetDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold text-neutral-900">Need a hand?</h2>
          <CompactButton
            variant="ghost"
            size="sm"
            onClick={closeHelpSidebar}
            className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
          >
            <RiCloseLine className="h-4 w-4" />
          </CompactButton>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <SearchSection />
          <SuggestionsSection />
          <GettingStarted />
        </div>

        {/* Footer */}
        <div className="border-t bg-neutral-50">
          <FooterActions />
        </div>
      </SheetContent>
    </Sheet>
  );
}
