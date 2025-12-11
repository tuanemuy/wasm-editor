import { Hash } from "lucide-react";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { cn } from "@/lib/utils";

export interface TagItemProps {
  tag: TagWithUsage;
  isSelected: boolean;
  onClick: (tagId: string) => void;
}

export function TagItem({ tag, isSelected, onClick }: TagItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        onClick={() => onClick(tag.id)}
        className={cn(
          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent",
        )}
      >
        <Hash />
        {tag.name}
        <SidebarMenuBadge
          className={cn(isSelected ? "text-primary-foreground" : "")}
        >
          {tag.usageCount}
        </SidebarMenuBadge>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
