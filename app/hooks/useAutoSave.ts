import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus } from "@/types";

export interface UseAutoSaveOptions {
  interval?: number;
  onSave: (content: string) => Promise<void>;
}

export interface UseAutoSaveResult {
  saveStatus: SaveStatus;
  saveNow: () => Promise<void>;
  markUnsaved: () => void;
}

/**
 * Hook for managing auto-save functionality
 * Automatically saves content after a specified interval
 */
export function useAutoSave(
  content: string,
  options: UseAutoSaveOptions,
): UseAutoSaveResult {
  const { interval = 2000, onSave } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);
  const initialContentRef = useRef(content);
  const isSavingRef = useRef(false);

  // Update content ref
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Save function
  const saveNow = useCallback(async () => {
    if (isSavingRef.current) return;
    if (contentRef.current === initialContentRef.current) return;

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      await onSave(contentRef.current);
      initialContentRef.current = contentRef.current;
      setSaveStatus("saved");
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("unsaved");
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  // Mark as unsaved and schedule auto-save
  const markUnsaved = useCallback(() => {
    if (contentRef.current === initialContentRef.current) return;

    setSaveStatus("unsaved");

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveNow();
    }, interval);
  }, [interval, saveNow]);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (content !== initialContentRef.current) {
      markUnsaved();
    }
  }, [content, markUnsaved]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately on unmount if there are unsaved changes
      if (contentRef.current !== initialContentRef.current) {
        // Call onSave directly without waiting for the promise
        // This is a cleanup effect, so we can't use async/await
        onSave(contentRef.current).catch((error) => {
          console.error("Failed to save on unmount:", error);
        });
      }
    };
  }, [onSave]);

  return {
    saveStatus,
    saveNow,
    markUnsaved,
  };
}
