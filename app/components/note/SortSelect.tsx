import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSortFields,
  type SortField,
  type SortOrder,
} from "@/lib/sort-utils";

export interface SortSelectProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export function SortSelect({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange,
}: SortSelectProps) {
  const fields = getSortFields();

  const handleOrderToggle = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    onSortOrderChange(newOrder);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={sortField} onValueChange={onSortFieldChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="secondary"
        size="icon"
        onClick={handleOrderToggle}
        aria-label={
          sortOrder === "asc" ? "Ascending order" : "Descending order"
        }
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="size-4" />
        ) : (
          <ArrowDown className="size-4" />
        )}
      </Button>
    </div>
  );
}
