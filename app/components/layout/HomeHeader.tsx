import { SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterBadges } from "@/components/note/FilterBadges";
import { SortPopover } from "@/components/note/SortPopover";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearch } from "@/context/search";
import { useTags } from "@/hooks/useTags";
import { cn } from "@/lib/utils";

export type HomeHeaderProps = React.ComponentProps<"header">;

export function HomeHeader({ className, ...props }: HomeHeaderProps) {
  const {
    query,
    changeQuery,
    sortField,
    sortOrder,
    changeSortField,
    changeSortOrder,
    tagIds,
    clearAllFilters,
  } = useSearch();
  const { tags } = useTags();
  return (
    <header {...props} className={cn("p-3 bg-background border-b", className)}>
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div className="flex-1 flex items-center gap-2">
          <SearchBar value={query} onChange={changeQuery} className="flex-1" />
          <SortPopover
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={changeSortField}
            onSortOrderChange={changeSortOrder}
          />
        </div>
        <Link to="/settings" viewTransition>
          <Button variant="ghost" size="icon">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <FilterBadges
        searchQuery={query}
        tagFilters={tagIds}
        tags={tags}
        onClear={clearAllFilters}
      />
    </header>
  );
}
