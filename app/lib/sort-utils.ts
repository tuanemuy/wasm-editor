/**
 * Utility functions for sorting operations
 */

export type SortField = "created_at" | "updated_at";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  orderBy: SortField;
  order: SortOrder;
}

/**
 * Build a human-readable label for a sort field
 */
export function buildSortFieldLabel(field: SortField): string {
  switch (field) {
    case "created_at":
      return "Created date";
    case "updated_at":
      return "Updated date";
    default:
      return field;
  }
}

/**
 * Get all available sort fields with labels
 */
export function getSortFields(): Array<{
  value: SortField;
  label: string;
}> {
  return [
    { value: "created_at", label: buildSortFieldLabel("created_at") },
    { value: "updated_at", label: buildSortFieldLabel("updated_at") },
  ];
}

/**
 * Validate if a string is a valid sort field
 */
export function isValidSortField(value: string): value is SortField {
  return ["created_at", "updated_at"].includes(value);
}

/**
 * Validate if a string is a valid sort order
 */
export function isValidSortOrder(value: string): value is SortOrder {
  return ["asc", "desc"].includes(value);
}
