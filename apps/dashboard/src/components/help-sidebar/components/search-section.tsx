import { InkeepEmbeddedSearchAndChat, InkeepEmbeddedSearchAndChatProps } from '@inkeep/cxkit-react';
import { useEffect, useRef } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { useHelpSidebar } from '../hooks/use-help-sidebar';

export function SearchSection() {
  const { state, setSearchQuery } = useHelpSidebar();
  const searchFunctionsRef = useRef<any>(null);

  const hasInkeep = !!import.meta.env.VITE_INKEEP_API_KEY;

  useEffect(() => {
    if (state.searchQuery && searchFunctionsRef.current) {
      searchFunctionsRef.current.updateSearchQuery(state.searchQuery);
    }
  }, [state.searchQuery]);

  if (!hasInkeep) {
    // Fallback search UI when Inkeep is not available
    return (
      <div className="p-4 border-b">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Type away... we're all ears."
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm placeholder:text-neutral-500 focus:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
          />
        </div>
        {state.searchQuery && (
          <div className="mt-3 text-sm text-neutral-500">Search functionality requires Inkeep configuration.</div>
        )}
      </div>
    );
  }

  const inkeepConfig: InkeepEmbeddedSearchAndChatProps = {
    defaultView: 'search',
    baseSettings: {
      apiKey: import.meta.env.VITE_INKEEP_API_KEY,
      organizationDisplayName: 'Novu',
      primaryBrandColor: '#DD2476',
      theme: {
        styles: [
          {
            key: 'help-sidebar-theme',
            type: 'style',
            value: `
              .ikp-embedded-search-and-chat {
                border: none;
                box-shadow: none;
              }
              .ikp-search-bar-input {
                border-radius: 8px;
                border: 1px solid rgb(229 231 235);
                background-color: rgb(249 250 251);
                padding: 12px 16px 12px 40px;
                font-size: 14px;
              }
              .ikp-search-bar-input::placeholder {
                color: rgb(107 114 128);
              }
              .ikp-search-bar-input:focus {
                border-color: rgb(209 213 219);
                outline: none;
                box-shadow: 0 0 0 1px rgb(209 213 219);
              }
              .ikp-search-results {
                max-height: 300px;
                overflow-y: auto;
              }
            `,
          },
        ],
      },
    },
    searchSettings: {
      searchFunctionsRef,
      placeholder: "Type away... we're all ears.",
      shouldAutoFocusInput: false,
    },
    shouldAutoFocusInput: false,
  };

  return (
    <div className="pb-2">
      <InkeepEmbeddedSearchAndChat {...inkeepConfig} />
    </div>
  );
}
