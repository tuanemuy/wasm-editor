import { useEffect } from "react";

interface UseClickOutsideOptions {
  ref: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  onClickOutside: () => void;
}

export const useClickOutside = ({
  ref,
  enabled,
  onClickOutside,
}: UseClickOutsideOptions) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    if (enabled) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [enabled, onClickOutside, ref]);
};
