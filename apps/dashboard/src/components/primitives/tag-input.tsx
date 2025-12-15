import { Command } from 'cmdk';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/primitives/command';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/primitives/popover';
import { cn } from '@/utils/ui';
import { Tag } from './tag';

type TagInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
  size?: 'sm' | 'md' | 'xs';
  hideTags?: boolean;
  onAddTag?: (tag: string) => void;
};

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const { className, suggestions = [], value = [], onChange, onBlur, hideTags = false, onAddTag, ...rest } = props;
  const [tags, setTags] = useState<string[]>(value || []);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const validSuggestions = useMemo(
    () => (suggestions || []).filter((suggestion) => !(tags || []).includes(suggestion)),
    [tags, suggestions]
  );

  const filteredSuggestions = useMemo(() => {
    const trimmed = (inputValue || '').trim();
    if (!trimmed) {
      return validSuggestions;
    }
    const searchLower = trimmed.toLowerCase();
    return validSuggestions.filter((s) => s?.toLowerCase().includes(searchLower));
  }, [inputValue, validSuggestions]);

  const isNewTag = useMemo(() => {
    const trimmed = (inputValue || '').trim();
    if (!trimmed) return false;

    return (
      !suggestions.some((s) => s?.toLowerCase() === trimmed.toLowerCase()) &&
      !(tags || []).some((t) => t?.toLowerCase() === trimmed.toLowerCase())
    );
  }, [inputValue, suggestions, tags]);

  const shouldShowPopover = useMemo(() => {
    if (!isOpen) return false;
    const trimmed = (inputValue || '').trim();
    if (!trimmed) return validSuggestions.length > 0;
    return filteredSuggestions.length > 0 || isNewTag;
  }, [isOpen, inputValue, validSuggestions.length, filteredSuggestions.length, isNewTag]);

  useEffect(() => {
    setTags(value || []);
  }, [value]);

  const addTag = (tag: string) => {
    const newTag = (tag || '').trim();

    if (newTag === '') {
      return;
    }

    const newTags = [...(tags || []), newTag];

    if (new Set(newTags).size !== newTags.length) {
      return;
    }

    if (onAddTag) {
      onAddTag(newTag);
    } else {
      onChange(newTags);
    }

    setInputValue('');
    setIsOpen(false);
  };

  const removeTag = (tag: string) => {
    const newTags = [...(tags || [])];
    const index = newTags.indexOf(tag);

    if (index !== -1) {
      newTags.splice(index, 1);
    }

    onChange(newTags);
    setInputValue('');
  };

  return (
    <div className="w-full overflow-visible">
      <Popover open={shouldShowPopover}>
        <Command loop shouldFilter={false} className="overflow-visible">
          <PopoverAnchor asChild>
            <div className="flex flex-col gap-2 pb-0.5 overflow-visible">
              <div className="p-1 -m-1 mb-0">
                <CommandInput
                  ref={ref}
                  autoComplete="off"
                  value={inputValue || ''}
                  className={cn('flex-grow', className)}
                  placeholder="Type a tag and press Enter"
                  onValueChange={(value) => {
                    setInputValue(value || '');
                    if (value) {
                      setIsOpen(true);
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  onClick={() => setIsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsOpen(false);
                    }
                  }}
                  onBlur={(e) => {
                    setTimeout(() => {
                      setIsOpen(false);
                      onBlur?.(e);
                    }, 150);
                  }}
                  {...rest}
                />
              </div>
              {!hideTags && (
                <div className="flex flex-wrap gap-2">
                  {(tags || []).map((tag, index) => (
                    <Tag
                      key={index}
                      variant="stroke"
                      className="max-w-[12rem] shrink-0"
                      onDismiss={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        removeTag(tag);
                      }}
                      dismissTestId={`tags-badge-remove-${tag}`}
                    >
                      <span
                        className="block max-w-full truncate"
                        style={{ wordBreak: 'break-all' }}
                        data-testid="tags-badge-value"
                        title={tag}
                      >
                        {tag}
                      </span>
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="bg-background text-foreground-600 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 relative z-50 max-h-96 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border shadow-md p-1"
            portal={false}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
            }}
            align="start"
            sideOffset={1}
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest('[cmdk-input-wrapper]')) {
                setIsOpen(false);
              }
            }}
          >
            <CommandList className="max-h-[inherit] overflow-auto">
              <CommandGroup className="!p-0">
                {isNewTag && (
                  <CommandItem
                    value={inputValue.trim()}
                    onSelect={() => {
                      addTag(inputValue);
                    }}
                  >
                    <span className="text-foreground-400 text-xs font-medium">Create: </span>
                    <span className="truncate font-mono text-xs">{inputValue.trim()}</span>
                  </CommandItem>
                )}

                {isNewTag && filteredSuggestions.length > 0 && <div className="bg-muted  h-px" />}

                {filteredSuggestions.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={`${tag}-suggestion`}
                    onSelect={() => {
                      addTag(tag);
                    }}
                  >
                    <span className="truncate">{tag}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  );
});

TagInput.displayName = 'TagInput';

export { TagInput };
