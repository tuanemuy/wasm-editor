/**
 * Tag Cleanup Scheduler
 *
 * Manages delayed and debounced execution of tag cleanup operations.
 * Prevents performance issues from excessive cleanup calls by:
 * - Debouncing multiple rapid cleanup requests
 * - Executing cleanup in the background after a delay
 */

import type { Context } from "@/core/application/context";

export class TagCleanupScheduler {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Schedule a tag cleanup operation
   *
   * @param cleanupFn - The cleanup function to execute
   * @param delayMs - Delay in milliseconds before executing cleanup (default: 1000ms)
   *
   * @description
   * If a cleanup is already scheduled, it will be cancelled and rescheduled.
   * This debounces multiple rapid cleanup requests into a single operation.
   */
  scheduleCleanup(cleanupFn: () => Promise<void>, delayMs: number = 1000): void {
    // Cancel any existing scheduled cleanup
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    // Schedule new cleanup
    this.timeoutId = setTimeout(() => {
      cleanupFn().catch((error) => {
        // Silently ignore cleanup errors to not affect user experience
        // TODO: Add proper logging when logging infrastructure is implemented
        console.error("Background tag cleanup failed:", error);
      });
      this.timeoutId = null;
    }, delayMs);
  }

  /**
   * Cancel any pending cleanup operation
   *
   * @description
   * Should be called when the component/context is unmounted
   * to prevent cleanup from executing with stale context.
   */
  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Check if a cleanup operation is currently scheduled
   */
  isPending(): boolean {
    return this.timeoutId !== null;
  }
}
