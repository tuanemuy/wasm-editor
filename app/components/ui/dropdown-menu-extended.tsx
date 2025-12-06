/**
 * Extended DropdownMenu components for special use cases
 * These components extend shadcn/ui's DropdownMenu with additional functionality
 */

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DropdownMenuContent without Portal
 * Use this inside floating menus (like TipTap's BubbleMenu) where Portal would cause positioning issues
 *
 * @example
 * ```tsx
 * <BubbleMenu>
 *   <DropdownMenu>
 *     <DropdownMenuTrigger>Open</DropdownMenuTrigger>
 *     <DropdownMenuContentWithoutPortal>
 *       <DropdownMenuItem>Item 1</DropdownMenuItem>
 *     </DropdownMenuContentWithoutPortal>
 *   </DropdownMenu>
 * </BubbleMenu>
 * ```
 */
export function DropdownMenuContentWithoutPortal({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className,
      )}
      {...props}
    />
  );
}
