import { ArrowDownAZ, ArrowDownWideNarrow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  getSortFields,
  type SortField,
  type SortOrder,
} from "@/lib/sort-utils";

export interface SortPopoverProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export function SortPopover({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange,
}: SortPopoverProps) {
  const fields = getSortFields();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Sort options">
          {sortOrder === "asc" ? (
            <ArrowDownAZ className="h-4 w-4" />
          ) : (
            <ArrowDownWideNarrow className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h4 className="font-medium text-sm">Sort by</h4>
            <RadioGroup
              value={sortField}
              onValueChange={(value) => onSortFieldChange(value as SortField)}
            >
              {fields.map((field) => (
                <div key={field.value} className="flex items-center gap-2">
                  <RadioGroupItem value={field.value} id={field.value} />
                  <Label htmlFor={field.value} className="cursor-pointer">
                    {field.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <h4 className="font-medium text-sm">Order</h4>
            <RadioGroup
              value={sortOrder}
              onValueChange={(value) => onSortOrderChange(value as SortOrder)}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="asc" id="asc" />
                <Label htmlFor="asc" className="cursor-pointer">
                  Ascending
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="desc" id="desc" />
                <Label htmlFor="desc" className="cursor-pointer">
                  Descending
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
