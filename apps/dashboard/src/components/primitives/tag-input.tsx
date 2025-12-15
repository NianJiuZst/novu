import { Command as CommandPrimitive } from 'cmdk';
import { forwardRef, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState<string[]>(Array.isArray(value) ? value : []);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (Array.isArray(value)) {
      setTags(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const validSuggestions = useMemo(() => {
    const safeSuggestions = Array.isArray(suggestions) ? suggestions.filter(Boolean) : [];
    const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    return safeSuggestions.filter((suggestion) => !safeTags.includes(suggestion));
  }, [tags, suggestions]);

  const filteredSuggestions = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return validSuggestions;
    const searchLower = trimmed.toLowerCase();
    return validSuggestions.filter((s) => s.toLowerCase().includes(searchLower));
  }, [inputValue, validSuggestions]);

  const isNewTag = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return false;
    const trimmedLower = trimmed.toLowerCase();
    const existsInSuggestions = suggestions.some((s) => s?.toLowerCase() === trimmedLower);
    const existsInTags = tags.some((t) => t?.toLowerCase() === trimmedLower);
    return !existsInSuggestions && !existsInTags;
  }, [inputValue, suggestions, tags]);

  const shouldShowPopover = useMemo(() => {
    if (!isOpen) return false;
    const trimmed = inputValue.trim();
    if (!trimmed) return validSuggestions.length > 0;
    return filteredSuggestions.length > 0 || isNewTag;
  }, [isOpen, inputValue, validSuggestions.length, filteredSuggestions.length, isNewTag]);

  const addTag = useCallback(
    (tag: string) => {
      if (!tag) return;

      const newTag = tag.trim();
      if (!newTag || tags.includes(newTag)) return;

      const newTags = [...tags, newTag];
      if (onAddTag) {
        onAddTag(newTag);
      } else {
        onChange(newTags);
      }

      setInputValue('');
      setIsOpen(false);

      setTimeout(() => {
        inputRef.current?.blur();
      }, 0);
    },
    [tags, onChange, onAddTag]
  );

  const removeTag = useCallback(
    (tag: string) => {
      if (!tag) return;
      const newTags = tags.filter((t) => t !== tag);
      onChange(newTags);
      setInputValue('');
    },
    [tags, onChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) return;

      if (!isOpen && inputValue.trim()) {
        setIsOpen(true);
      }

      if (event.key === 'Enter' && input.value.trim() !== '') {
        const trimmed = input.value.trim();
        if (trimmed) {
          event.preventDefault();
          event.stopPropagation();
          addTag(trimmed);
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        input.blur();
        return;
      }
    },
    [isOpen, inputValue, addTag]
  );

  const handleValueChange = useCallback((value: string) => {
    setInputValue(value);
    if (value.trim()) {
      setIsOpen(true);
    }
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      blurTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        onBlur?.(e);
      }, 150);
    },
    [onBlur]
  );

  const handleSelectOption = useCallback(
    (tag: string) => {
      addTag(tag);
      setTimeout(() => {
        inputRef.current?.blur();
      }, 0);
    },
    [addTag]
  );

  const handlePointerDownOutside = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (target?.closest && !target.closest('[cmdk-input-wrapper]')) {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="w-full overflow-visible">
      <Popover open={shouldShowPopover}>
        <CommandPrimitive onKeyDown={handleKeyDown} loop shouldFilter={false} className="overflow-visible">
          <PopoverAnchor asChild>
            <div className="flex flex-col gap-2 pb-0.5 overflow-visible">
              <div className="p-1 -m-1 mb-0">
                <CommandInput
                  ref={(node) => {
                    inputRef.current = node as HTMLInputElement;
                    if (typeof ref === 'function') {
                      ref(node);
                    }
                  }}
                  autoComplete="off"
                  value={inputValue}
                  className={cn('flex-grow', className)}
                  placeholder="Type a tag and press Enter"
                  onValueChange={handleValueChange}
                  onFocus={() => setIsOpen(true)}
                  onBlur={handleBlur}
                  {...rest}
                />
              </div>
              {!hideTags && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Tag
                      key={`${tag}-${index}`}
                      variant="stroke"
                      className="max-w-[12rem] shrink-0"
                      onDismiss={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();
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
            onOpenAutoFocus={(e) => e.preventDefault()}
            align="start"
            sideOffset={0}
            onPointerDownOutside={handlePointerDownOutside}
          >
            <CommandList className="max-h-[inherit] overflow-auto">
              <CommandGroup className="!p-0">
                {isNewTag && inputValue.trim() && (
                  <CommandItem
                    value={inputValue.trim()}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onSelect={() => handleSelectOption(inputValue)}
                  >
                    <span className="text-foreground-400 text-xs font-medium">Create: </span>
                    <span className="truncate font-mono text-xs">{inputValue.trim()}</span>
                  </CommandItem>
                )}

                {isNewTag && filteredSuggestions.length > 0 && <div className="bg-muted h-px" />}

                {filteredSuggestions.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={`${tag}-suggestion`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onSelect={() => handleSelectOption(tag)}
                  >
                    <span className="truncate">{tag}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </PopoverContent>
        </CommandPrimitive>
      </Popover>
    </div>
  );
});

TagInput.displayName = 'TagInput';

export { TagInput };
