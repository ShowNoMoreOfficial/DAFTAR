"use client";

/**
 * GI Suggestion Slot — placeholder component.
 * In Phase 0, these render nothing. As the GI matures,
 * the GI engine will populate these slots with contextual suggestions.
 */
interface GISlotProps {
  name: string;
  entityId?: string;
  entityType?: string;
}

export function GISlot({ name: _name, entityId: _entityId, entityType: _entityType }: GISlotProps) {
  // Phase 0: GI slots are empty placeholders
  // Future: GI engine reads slot name + entity context + user role
  // and decides what (if anything) to render
  return null;
}
