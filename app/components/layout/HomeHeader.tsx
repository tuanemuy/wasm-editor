import { CheckSquareIcon, SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterBadges } from "@/components/note/FilterBadges";
import { SortSelect } from "@/components/note/SortSelect";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import type { SortField, SortOrder } from "@/lib/sort-utils";

export interface HomeHeaderProps {
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  tagFilters: string[];
  tags: TagWithUsage[];
  isSelectMode?: boolean;
  onSearchChange: (query: string) => void;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onClearFilters: () => void;
  onToggleSelectMode?: () => void;
}

export function HomeHeader({
  searchQuery,
  sortField,
  sortOrder,
  tagFilters,
  tags,
  isSelectMode = false,
  onSearchChange,
  onSortFieldChange,
  onSortOrderChange,
  onClearFilters,
  onToggleSelectMode,
}: HomeHeaderProps) {
  return (
    <header className="border-b p-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold">Notes</h1>
        <div className="flex-1 flex items-center gap-2">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
          <SortSelect
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={onSortFieldChange}
            onSortOrderChange={onSortOrderChange}
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
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <FilterBadges
        searchQuery={searchQuery}
        tagFilters={tagFilters}
        tags={tags}
        onClear={onClearFilters}
      />
    </header>
  );
}
