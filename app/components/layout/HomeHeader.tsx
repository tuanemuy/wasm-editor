import { CheckSquareIcon, SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterBadges } from "@/components/note/FilterBadges";
import { SortPopover } from "@/components/note/SortPopover";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearch } from "@/context/search";
import { useTags } from "@/hooks/useTags";

export interface HomeHeaderProps {
  isSelectMode?: boolean;
  onToggleSelectMode?: () => void;
}

export function HomeHeader({
  isSelectMode = false,
  onToggleSelectMode,
}: HomeHeaderProps) {
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
    <header className="border-b p-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex-1 flex items-center gap-2">
          <SearchBar value={query} onChange={changeQuery} />
          <SortPopover
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={changeSortField}
            onSortOrderChange={changeSortOrder}
          />
        </div>
        {onToggleSelectMode && (
          <Button
            variant={isSelectMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectMode}
            title="一括選択モード"
          >
            <CheckSquareIcon className="h-4 w-4 mr-2" />
            選択
          </Button>
        )}
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
