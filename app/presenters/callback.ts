/**
 * Callback Types and Utilities
 *
 * Provides shared callback types and utilities for presenters
 */

import { toast } from "sonner";

/**
 * Standard callbacks for presenter operations
 */
export type Callbacks = {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

/**
 * Create default callbacks with toast notifications
 */
export function defaultCallbacks(): Callbacks {
  return {
    onSuccess: (message: string) => toast.success(message),
    onError: (message: string) => toast.error(message),
  };
}
