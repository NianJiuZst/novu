import { ReactNode, useState, useCallback, useMemo, useEffect, useId, useRef } from 'react';
import { RiAlertLine, RiDeleteBin2Line, RiQuestionLine, RiSearchLine } from 'react-icons/ri';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/popover';
import { LiquidVariable } from '@/utils/parseStepVariables';
import type { IsAllowedVariable } from '@/utils/parseStepVariables';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/primitives/command';
import { FormControl, FormItem, FormMessagePure } from '@/components/primitives/form/form';
import { Input } from '@/components/primitives/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/primitives/tooltip';
import { useTelemetry } from '@/hooks/use-telemetry';
import { TelemetryEvent } from '@/utils/telemetry';
import { FilterItem } from './components/filter-item';
import { ReorderFiltersGroup } from './components/reorder-filters-group';
import { useFilterManager } from './hooks/use-filter-manager';
import { useSuggestedFilters } from './hooks/use-suggested-filters';
import { useVariableParser } from './hooks/use-variable-parser';
import type { Filters, FilterWithParam } from './types';
import { formatLiquidVariable } from './utils';
import { useDebounce } from '@/hooks/use-debounce';
import { EscapeKeyManagerPriority } from '@/context/escape-key-manager/priority';
import { useEscapeKeyManager } from '@/context/escape-key-manager/hooks';
import { Button } from '../primitives/button';
import { usePayloadSchema } from '@/context/payload-schema';

const calculateAliasFor = (name: string, parsedAliasRoot: string): string => {
  const variableRest = name.split('.').slice(1).join('.');
  const normalizedVariableRest = variableRest.startsWith('.') ? variableRest.substring(1) : variableRest;
  let aliasFor =
    parsedAliasRoot && normalizedVariableRest ? `${parsedAliasRoot}.${normalizedVariableRest}` : parsedAliasRoot;

  if (name.trim() === '') {
    aliasFor = '';
  }

  return aliasFor;
};

interface ValidationResult {
  isValid: boolean;
  isNewPending: boolean;
  message: string;
  isWarning: boolean;
}

type EditVariablePopoverProps = {
  variables: LiquidVariable[];
  children: ReactNode;
  open: boolean;
  variable?: LiquidVariable;
  onOpenChange: (open: boolean, newValue: string) => void;
  onUpdate: (newValue: string) => void;
  isAllowedVariable: IsAllowedVariable;
  isVariableInSchema: (variable: LiquidVariable) => boolean;
  onDeleteClick: () => void;
};

export const EditVariablePopover = ({
  variables,
  children,
  open,
  onOpenChange,
  variable,
  onUpdate,
  isAllowedVariable: isAllowedByHook,
  isVariableInSchema,
  onDeleteClick,
}: EditVariablePopoverProps) => {
  const { parsedName, parsedAliasForRoot, parsedDefaultValue, parsedFilters } = useVariableParser(
    variable?.name || '',
    variable?.aliasFor || ''
  );
  const id = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(parsedName);
  const [variableError, setVariableError] = useState<string>('');
  const [isWarningOnly, setIsWarningOnly] = useState<boolean>(false);

  const payloadSchemaContext = usePayloadSchema();

  const [defaultVal, setDefaultVal] = useState(parsedDefaultValue);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [filters, setFilters] = useState<FilterWithParam[]>(parsedFilters || []);
  const track = useTelemetry();

  const validateVariable = useCallback(
    (variableToCheck: LiquidVariable): ValidationResult => {
      const varNameWithoutFilters = variableToCheck.name.split('|')[0].trim();

      if (!varNameWithoutFilters) {
        return { isValid: false, isNewPending: false, message: 'Variable name cannot be empty.', isWarning: false };
      }

      if (isVariableInSchema(variableToCheck)) {
        return { isValid: true, isNewPending: false, message: '', isWarning: false };
      }

      if (isAllowedByHook(variableToCheck)) {
        if (payloadSchemaContext.isPendingVariable(varNameWithoutFilters)) {
          return {
            isValid: true,
            isNewPending: false,
            message: 'This variable is pending addition to the schema.',
            isWarning: true,
          };
        }
        return {
          isValid: true,
          isNewPending: true,
          message: 'This variable is not in the schema and will be added as a pending variable.',
          isWarning: true,
        };
      }
      return {
        isValid: false,
        isNewPending: false,
        message: 'Not a valid variable name or structure.',
        isWarning: false,
      };
    },
    [isVariableInSchema, isAllowedByHook, payloadSchemaContext.isPendingVariable]
  );

  const validateAndSetState = useCallback(
    (varToCheck: LiquidVariable): ValidationResult => {
      const result = validateVariable(varToCheck);
      setVariableError(result.message);
      setIsWarningOnly(result.isWarning);
      if (!result.isValid && !result.isWarning) {
        nameInputRef.current?.focus();
      }
      return result;
    },
    [validateVariable]
  );

  const validateVariableDebounced = useDebounce(validateAndSetState, 300);

  useEffect(() => {
    setName(parsedName);
    setDefaultVal(parsedDefaultValue);
    setFilters(parsedFilters || []);
    const initialVar = { name: parsedName, aliasFor: parsedAliasForRoot };
    if (parsedName) {
      const validationRes = validateVariable(initialVar);
      setVariableError(validationRes.message);
      setIsWarningOnly(validationRes.isWarning);
    } else {
      setVariableError('');
      setIsWarningOnly(false);
    }
  }, [parsedName, parsedDefaultValue, parsedFilters, parsedAliasForRoot, validateVariable]);

  const handlePopoverOpen = useCallback(() => {
    track(TelemetryEvent.VARIABLE_POPOVER_OPENED);
    const currentVarToValidate = { name, aliasFor: calculateAliasFor(name, parsedAliasForRoot) };
    if (name) {
      const validationRes = validateVariable(currentVarToValidate);
      setVariableError(validationRes.message);
      setIsWarningOnly(validationRes.isWarning);
    } else {
      setVariableError('');
      setIsWarningOnly(false);
    }
  }, [track, name, parsedAliasForRoot, validateVariable]);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
      const aliasFor = calculateAliasFor(newName, parsedAliasForRoot);
      validateVariableDebounced({ name: newName, aliasFor });
    },
    [setName, validateVariableDebounced, parsedAliasForRoot]
  );

  const handleDefaultValueChange = useCallback(
    (newDefaultVal: string) => {
      setDefaultVal(newDefaultVal);
    },
    [setDefaultVal]
  );

  const { handleReorder, handleFilterToggle, handleParamChange, getFilteredFilters } = useFilterManager({
    initialFilters: filters,
    onUpdate: setFilters,
  });

  const suggestedFilters = useSuggestedFilters(name, filters);
  const filteredFilters = useMemo(() => getFilteredFilters(searchQuery), [getFilteredFilters, searchQuery]);

  const handleApplyLogic = useCallback(
    (closePopover: boolean) => {
      const aliasFor = calculateAliasFor(name, parsedAliasForRoot);
      const currentVarToValidate = { name, aliasFor };
      const validationResult = validateAndSetState(currentVarToValidate);

      if (!validationResult.isValid && !validationResult.isWarning) {
        if (closePopover) {
          // If triggered by Popover's onOpenChange(false), we might not be able to prevent closing easily.
          // But we must not call onUpdate.
          // The original onOpenChange will be called by Popover regardless.
          // We ensure onUpdate is not called.
        } else {
          // Triggered by form submit, can prevent further action.
        }
        return false; // Signify failure to apply
      }

      // If valid OR only a warning, proceed to update
      if (validationResult.isNewPending) {
        payloadSchemaContext.addPendingVariable(name.split('|')[0]);
      }

      const newValue = formatLiquidVariable(name, defaultVal, filters);
      track(TelemetryEvent.VARIABLE_POPOVER_APPLIED, {
        variableName: name,
        hasDefaultValue: !!defaultVal,
        filtersCount: filters.length,
        filters: filters.map((filter) => filter.value),
      });
      onUpdate(newValue);
      return true; // Signify success
    },
    [name, parsedAliasForRoot, validateAndSetState, payloadSchemaContext, defaultVal, filters, track, onUpdate]
  );

  const handleOpenChangeCallback = useCallback(
    (newOpenState: boolean) => {
      let newValue = formatLiquidVariable(name, defaultVal, filters); // Current value before potential apply
      if (!newOpenState) {
        // Closing
        const appliedSuccessfully = handleApplyLogic(true);
        if (!appliedSuccessfully) {
          // If apply failed due to hard error, we don't want to call the external onOpenChange with false.
          // However, the Popover might close itself. The crucial part is that onUpdate was not called.
          // To be safe, and if the popover MUST stay open, we'd call onOpenChange(true, ...)
          // For now, assume the popover might close, but data isn't updated.
          // Let external onOpenChange still be called to reflect popover state.
          onOpenChange(newOpenState, newValue); // newValue here is PRE-apply attempt for consistency if apply fails.
          return;
        }
        // if applied successfully, newValue for onOpenChange should be the updated one.
        newValue = formatLiquidVariable(name, defaultVal, filters);
      }
      onOpenChange(newOpenState, newValue);
    },
    [name, defaultVal, filters, handleApplyLogic, onOpenChange]
  );

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const appliedSuccessfully = handleApplyLogic(false);
      if (appliedSuccessfully) {
        onOpenChange(false, formatLiquidVariable(name, defaultVal, filters)); // Close popover on successful form submit + apply
      }
    },
    [handleApplyLogic, onOpenChange, name, defaultVal, filters]
  );

  const handleClosePopover = useCallback(() => {
    // This is for EscapeKeyManager - it should behave like clicking away
    handleOpenChangeCallback(false);
  }, [handleOpenChangeCallback]);

  useEscapeKeyManager(id, handleClosePopover, EscapeKeyManagerPriority.POPOVER, open);

  return (
    <Popover open={open} onOpenChange={handleOpenChangeCallback}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="min-w-[275px] max-w-[275px] p-0" align="start" onOpenAutoFocus={handlePopoverOpen}>
        <form
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onSubmit={handleFormSubmit}
        >
          <div className="bg-bg-weak border-b border-b-neutral-100">
            <div className="flex flex-row items-center justify-between space-y-0 px-1.5 py-1">
              <div className="flex w-full items-center justify-between gap-1">
                <span className="text-subheading-2xs text-text-soft">CONFIGURE VARIABLE</span>
                <Button variant="secondary" mode="ghost" className="h-5 p-1" onClick={onDeleteClick}>
                  <RiDeleteBin2Line className="size-3.5 text-neutral-400" />
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-2 p-2">
            <div className="flex flex-col gap-1">
              <FormItem>
                <FormControl>
                  <div className="grid gap-1">
                    <label className="text-text-sub text-label-xs">Variable</label>
                    <Input
                      ref={nameInputRef}
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      autoFocus
                      size="xs"
                      placeholder="Variable name (e.g. payload.name)"
                      className={
                        variableError && !isWarningOnly
                          ? 'border-destructive'
                          : isWarningOnly
                            ? 'border-yellow-500'
                            : ''
                      }
                    />
                    <FormMessagePure
                      hasError={!!variableError && !isWarningOnly}
                      icon={isWarningOnly ? RiAlertLine : undefined}
                      className={isWarningOnly ? 'text-yellow-700' : ''}
                    >
                      {variableError}
                    </FormMessagePure>
                  </div>
                </FormControl>
              </FormItem>

              <FormItem>
                <FormControl>
                  <Input
                    value={defaultVal}
                    onChange={(e) => handleDefaultValueChange(e.target.value)}
                    placeholder="Default fallback value"
                    size="xs"
                  />
                </FormControl>
              </FormItem>
            </div>

            <div className="flex flex-col gap-1">
              <FormItem>
                <FormControl>
                  <div className="">
                    <label className="text-text-sub text-label-xs mb-1 flex items-center gap-1">
                      LiquidJS Filters
                      <Tooltip>
                        <TooltipTrigger className="relative cursor-pointer">
                          <RiQuestionLine className="text-text-soft size-4" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-label-xs">
                            LiquidJS filters modify the variable output in sequence, with each filter using the previous
                            one's result. Reorder them by dragging and dropping.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </label>

                    <Popover open={isCommandOpen} onOpenChange={setIsCommandOpen}>
                      <PopoverTrigger asChild>
                        <button className="text-text-soft bg-background flex h-[30px] w-full items-center justify-between rounded-md border px-2 text-xs">
                          <span>Add a filter</span>
                          <RiSearchLine className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="min-w-[calc(275px-1rem)] max-w-[calc(275px-1rem)] p-0" align="start">
                        <Command>
                          <div className="p-1">
                            <CommandInput
                              value={searchQuery}
                              onValueChange={setSearchQuery}
                              placeholder="Search..."
                              className="h-7"
                              inputWrapperClassName="h-7 text-2xs"
                            />
                          </div>

                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No filters found</CommandEmpty>
                            {suggestedFilters.length > 0 && !searchQuery && (
                              <>
                                <CommandGroup heading="Suggested">
                                  {suggestedFilters[0].filters.map((filterItem: Filters) => (
                                    <CommandItem
                                      key={filterItem.value}
                                      onSelect={() => {
                                        handleFilterToggle(filterItem.value);
                                        setSearchQuery('');
                                        setIsCommandOpen(false);
                                      }}
                                    >
                                      <FilterItem filter={filterItem} />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                {suggestedFilters.length > 0 && <CommandSeparator />}
                              </>
                            )}
                            {filteredFilters.length > 0 && (
                              <CommandGroup>
                                {filteredFilters.map((filter) => (
                                  <CommandItem
                                    key={filter.value}
                                    onSelect={() => {
                                      handleFilterToggle(filter.value);
                                      setSearchQuery('');
                                      setIsCommandOpen(false);
                                    }}
                                  >
                                    <FilterItem filter={filter} />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </FormControl>
              </FormItem>

              <ReorderFiltersGroup
                variables={variables}
                variableName={name}
                filters={filters}
                onReorder={handleReorder}
                onRemove={handleFilterToggle}
                onParamChange={handleParamChange}
              />
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
