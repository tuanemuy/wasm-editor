import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { TagList } from "./TagList";

export interface TagSidebarProps {
  tags: TagWithUsage[];
  selectedTagIds: string[];
  onTagClick: (tagId: string) => void;
}

export function TagSidebar({
  tags,
  selectedTagIds,
  onTagClick,
}: TagSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <h2 className="text-lg font-semibold px-2">Tags</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <TagList
              tags={tags}
              selectedTagIds={selectedTagIds}
              onTagClick={onTagClick}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
