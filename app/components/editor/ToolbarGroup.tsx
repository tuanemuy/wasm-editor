import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

type ToolbarGroupProps = {
  children: ReactNode;
  showSeparator?: boolean;
};

/**
 * A reusable component for grouping toolbar buttons
 */
export function ToolbarGroup({
  children,
  showSeparator = true,
}: ToolbarGroupProps) {
  return (
    <>
      {children}
      {showSeparator && (
        <Separator orientation="vertical" className="mx-1 h-6" />
      )}
    </>
  );
}
