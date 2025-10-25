import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useSearch } from "@/context/search";
import { useTags } from "@/hooks/useTags";
import { TagList } from "./TagList";

export function TagSidebar() {
  const { tagIds, toggleTag } = useSearch();
  const { tags } = useTags();
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
              selectedTagIds={tagIds}
              onTagClick={toggleTag}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
