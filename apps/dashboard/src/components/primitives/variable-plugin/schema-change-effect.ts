import { StateEffect, StateField } from '@codemirror/state';

/**
 * State effect to signal that the schema has changed and decorations should be recalculated.
 * This is used to force the variable plugin to update when the payload schema changes.
 */
export const schemaChangeEffect = StateEffect.define<void>();

/**
 * State field to track schema change effects.
 * This doesn't store any state, but its presence ensures the effect triggers view updates.
 */
export const schemaChangeField = StateField.define<number>({
  create: () => 0,
  update: (value, tr) => {
    for (const effect of tr.effects) {
      if (effect.is(schemaChangeEffect)) {
        return value + 1;
      }
    }
    return value;
  },
});
