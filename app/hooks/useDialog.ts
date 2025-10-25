import { useCallback, useState } from "react";
import type { DialogState } from "@/types";

/**
 * Hook for managing dialog open/close state
 */
export function useDialog(initialOpen = false): DialogState {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
