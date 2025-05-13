import { useState } from 'react';
import { RiSettings3Line, RiDeleteBinLine, RiAddLine, RiBracesLine } from 'react-icons/ri';
import { Input } from '@/components/primitives/input';
import { Button } from '@/components/primitives/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import type { SchemaProperty, SchemaValueType } from './types';
import { SCHEMA_TYPE_OPTIONS } from './constants';
import { cn } from '@/utils/ui';
import { SchemaPropertySettingsDrawer } from './schema-property-settings-drawer';

interface SchemaPropertyRowProps {
  property: SchemaProperty;
  onUpdateProperty: (id: string, updates: Partial<SchemaProperty>) => void;
  onDeleteProperty: (id: string) => void;
  onAddEnumChoice: (propertyId: string) => void;
  onUpdateEnumChoice: (propertyId: string, choiceIndex: number, value: string) => void;
  onDeleteEnumChoice: (propertyId: string, choiceIndex: number) => void;
  onAddNestedProperty: (parentId: string) => void;
  onAddArrayItemProperty: (arrayPropertyId: string) => void;
  indentationLevel?: number;
}

export function SchemaPropertyRow(props: SchemaPropertyRowProps) {
  const {
    property,
    onUpdateProperty,
    onDeleteProperty,
    onAddEnumChoice,
    onUpdateEnumChoice,
    onDeleteEnumChoice,
    onAddNestedProperty,
    onAddArrayItemProperty,
    indentationLevel = 0,
  } = props;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNameChange = (newName: string) => {
    onUpdateProperty(property.id, { name: newName });
  };

  const handleTypeChange = (newType: SchemaValueType) => {
    const updates: Partial<SchemaProperty> = { type: newType };

    if (newType !== 'enum') {
      updates.enumValues = [];
    } else {
      if (!property.enumValues || property.enumValues.length === 0) {
        updates.enumValues = [''];
      }
    }

    if (newType !== 'array') {
      updates.arrayItemType = 'string';
      updates.arrayItemSchema = [];
    } else {
      updates.arrayItemType = property.arrayItemType || 'string';

      if (updates.arrayItemType === 'object' && (!property.arrayItemSchema || property.arrayItemSchema.length === 0)) {
        updates.arrayItemSchema = property.arrayItemSchema || [];
      }
    }

    if (newType !== 'object') {
      updates.children = [];
    } else {
      if (!property.children || property.children.length === 0) {
        updates.children = property.children || [];
      }
    }

    onUpdateProperty(property.id, updates);
  };

  const handleArrayItemTypeChange = (newType: SchemaValueType) => {
    const updates: Partial<SchemaProperty> = { arrayItemType: newType };

    if (newType !== 'object') {
      updates.arrayItemSchema = [];
    } else {
      updates.arrayItemSchema =
        property.arrayItemSchema && property.arrayItemSchema.length > 0 ? property.arrayItemSchema : [];
    }

    onUpdateProperty(property.id, updates);
  };

  const handleSaveSettings = (updatedSettings: Partial<SchemaProperty>) => {
    onUpdateProperty(property.id, updatedSettings);
  };

  return (
    <>
      <div className={cn('flex flex-col', indentationLevel > 0 && `ml-${indentationLevel * 6}`)}>
        <div className="flex items-center space-x-2 py-1">
          <RiBracesLine className="h-5 w-5 shrink-0 text-gray-400" />
          <Input
            value={property.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Property name"
            className="h-8 text-sm"
          />
          <Select value={property.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="h-8 w-[120px] text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {SCHEMA_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            mode="ghost"
            size="xs"
            leadingIcon={RiSettings3Line}
            className="h-8 w-8"
            onClick={() => setIsSettingsOpen(true)}
          />
          <Button
            variant="error"
            mode="ghost"
            size="xs"
            leadingIcon={RiDeleteBinLine}
            className="h-8 w-8"
            onClick={() => onDeleteProperty(property.id)}
          />
        </div>

        {property.type === 'enum' && (
          <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
            {(property.enumValues ?? []).map((value, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={value}
                  onChange={(e) => onUpdateEnumChoice(property.id, index, e.target.value)}
                  placeholder={`item${index + 1}`}
                  className="h-8 text-sm"
                />
                <Input disabled value="string" className="h-8 w-[100px] bg-gray-50 text-sm text-gray-400" />
                <Button
                  variant="error"
                  mode="ghost"
                  size="xs"
                  leadingIcon={RiDeleteBinLine}
                  className="h-8 w-8"
                  onClick={() => onDeleteEnumChoice(property.id, index)}
                />
              </div>
            ))}
            <Button
              variant="secondary"
              mode="outline"
              size="sm"
              className="mt-1 h-8 w-fit self-start text-xs"
              leadingIcon={RiAddLine}
              onClick={() => onAddEnumChoice(property.id)}
            >
              Add choice
            </Button>
          </div>
        )}

        {property.type === 'array' && (
          <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">items</span>
              <Select value={property.arrayItemType ?? 'string'} onValueChange={handleArrayItemTypeChange}>
                <SelectTrigger className="h-8 w-[120px] text-sm">
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMA_TYPE_OPTIONS.filter((opt) => opt.value !== 'enum').map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {property.arrayItemType === 'object' && (
              <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
                {(property.arrayItemSchema ?? []).map((itemProperty) => (
                  <SchemaPropertyRow
                    key={itemProperty.id}
                    property={itemProperty}
                    onUpdateProperty={onUpdateProperty}
                    onDeleteProperty={onDeleteProperty}
                    onAddEnumChoice={onAddEnumChoice}
                    onUpdateEnumChoice={onUpdateEnumChoice}
                    onDeleteEnumChoice={onDeleteEnumChoice}
                    onAddNestedProperty={onAddNestedProperty}
                    onAddArrayItemProperty={onAddArrayItemProperty}
                    indentationLevel={indentationLevel + 1}
                  />
                ))}
                <Button
                  variant="secondary"
                  mode="outline"
                  size="sm"
                  className="mt-1 h-8 w-fit self-start text-xs"
                  leadingIcon={RiAddLine}
                  onClick={() => onAddArrayItemProperty(property.id)}
                >
                  Add property to item
                </Button>
              </div>
            )}
          </div>
        )}

        {property.type === 'object' && (
          <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
            {(property.children ?? []).map((childProperty) => (
              <SchemaPropertyRow
                key={childProperty.id}
                property={childProperty}
                onUpdateProperty={onUpdateProperty}
                onDeleteProperty={onDeleteProperty}
                onAddEnumChoice={onAddEnumChoice}
                onUpdateEnumChoice={onUpdateEnumChoice}
                onDeleteEnumChoice={onDeleteEnumChoice}
                onAddNestedProperty={onAddNestedProperty}
                onAddArrayItemProperty={onAddArrayItemProperty}
                indentationLevel={indentationLevel + 1}
              />
            ))}
            <Button
              variant="secondary"
              mode="outline"
              size="sm"
              className="mt-1 h-8 w-fit self-start text-xs"
              leadingIcon={RiAddLine}
              onClick={() => onAddNestedProperty(property.id)}
            >
              Add nested property
            </Button>
          </div>
        )}
      </div>
      <SchemaPropertySettingsDrawer
        property={property}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onSave={handleSaveSettings}
      />
    </>
  );
}
