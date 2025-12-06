import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { useSearch } from "@/context/search";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { TagItem } from "./TagItem";

export type Props = React.ComponentProps<typeof Sidebar> & {
  tags: TagWithUsage[];
};

export function TagSidebar({ tags, ...props }: Props) {
  const { tagIds, toggleTag } = useSearch();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tags.map((tag) => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  isSelected={tagIds.includes(tag.id)}
                  onClick={toggleTag}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
