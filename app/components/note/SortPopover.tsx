import { ArrowDown01, ArrowDown10 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useSearch } from "@/context/search";
import {
  getSortFields,
  type SortField,
  type SortOrder,
} from "@/lib/sort-utils";

export type SortPopoverProps = React.ComponentProps<typeof Popover>;

export function SortPopover(props: SortPopoverProps) {
  const fields = getSortFields();

  const { sortField, sortOrder, changeSortField, changeSortOrder } =
    useSearch();

  return (
    <Popover {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Sort options"
          className="bg-transparent"
        >
          {sortOrder === "asc" ? <ArrowDown01 /> : <ArrowDown10 />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h4 className="font-medium text-sm">Sort by</h4>
            <RadioGroup
              value={sortField}
              onValueChange={(value) => changeSortField(value as SortField)}
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
              onValueChange={(value) => changeSortOrder(value as SortOrder)}
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
