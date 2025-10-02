// Constants for hybrid pagination approach
export const PAGINATION_THRESHOLDS = {
  ORDERS: 50,        // Switch to server-side pagination after 50 orders
  REMINDERS: 50,     // Switch to server-side pagination after 50 reminders
  CLIENTS: 100,      // Always client-side (no pagination needed)
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
