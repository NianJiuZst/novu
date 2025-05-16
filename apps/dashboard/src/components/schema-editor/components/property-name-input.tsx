import { useCallback, useEffect, useState } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { RiErrorWarningLine } from 'react-icons/ri';

import { InputPure, InputRoot, InputWrapper } from '@/components/primitives/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import { Code2 } from '../../icons/code-2';

type PropertyNameInputProps = {
  propertyKey: string;
  pathPrefix: string;
  onRenamePropertyKey: (oldKey: string, newKey: string) => void | Error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: (path: string) => any; // Simplified from useFormContext
  control: Control<FieldValues>; // Simplified from useFormContext
  isDisabled?: boolean;
};

export function PropertyNameInput({
  propertyKey,
  pathPrefix,
  onRenamePropertyKey,
  getValues,
  isDisabled = false,
}: PropertyNameInputProps) {
  const [localName, setLocalName] = useState(propertyKey);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const schemaFragment = getValues(pathPrefix);

    if (uuidPattern.test(propertyKey) && (!schemaFragment || (!schemaFragment.title && !schemaFragment.description))) {
      setLocalName('');
    } else {
      setLocalName(propertyKey);
    }
  }, [propertyKey, getValues, pathPrefix]);

  const handleNameChange = useCallback(
    async (newName: string) => {
      setNameError(null);
      const trimmedNewName = newName.trim();

      if (trimmedNewName === propertyKey) {
        setLocalName(propertyKey);

        return;
      }

      if (!trimmedNewName) {
        setNameError('Property name cannot be empty.');

        return;
      }

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedNewName)) {
        setNameError('Name must start with a letter or underscore, and contain only letters, numbers, or underscores.');

        return;
      }

      try {
        onRenamePropertyKey(propertyKey, trimmedNewName);
      } catch (e: any) {
        setNameError(e.message || 'Failed to rename property.');
      }
    },
    [propertyKey, onRenamePropertyKey]
  );

  return (
    <div className="flex-1 flex-col">
      <div className="relative">
        <TooltipProvider delayDuration={0}>
          <InputRoot hasError={!!nameError} size="2xs" className="font-mono">
            <InputWrapper>
              <Code2 className="h-4 w-4 shrink-0 text-gray-500" />
              <InputPure
                value={localName}
                onChange={(e) => {
                  setLocalName(e.target.value);
                  if (nameError && nameError === 'Property name cannot be empty.') setNameError(null);
                }}
                onBlur={() => handleNameChange(localName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNameChange(localName);
                  }

                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setLocalName(propertyKey);
                    setNameError(null);
                  }
                }}
                placeholder="Property name"
                className="text-xs"
                disabled={isDisabled}
              />
              {nameError && (
                <Tooltip open>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-default items-center justify-center">
                      <RiErrorWarningLine className="text-destructive h-4 w-4 shrink-0" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={5}>
                    <p>{nameError}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </InputWrapper>
          </InputRoot>
        </TooltipProvider>
      </div>
    </div>
  );
}
