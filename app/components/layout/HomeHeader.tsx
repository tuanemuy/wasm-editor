import { SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { FilterBadges } from "@/components/note/FilterBadges";
import { SortPopover } from "@/components/note/SortPopover";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearch } from "@/context/search";
import { useTags } from "@/hooks/useTags";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";

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
    <header {...props} className={cn("pt-3", className)}>
      <div className="flex items-center gap-2 py-2 px-4 bg-background border rounded-full shadow-md">
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
