import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SortSettingsCardProps {
  defaultOrderBy: string;
  defaultOrder: string;
  onOrderByChange: (value: string) => void;
  onOrderChange: (value: string) => void;
}

export function SortSettingsCard({
  defaultOrderBy,
  defaultOrder,
  onOrderByChange,
  onOrderChange,
}: SortSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Sort</CardTitle>
        <CardDescription>
          Configure the default sort order for the notes list
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel htmlFor="defaultOrderBy">Sort by</FieldLabel>
          <Select value={defaultOrderBy} onValueChange={onOrderByChange}>
            <SelectTrigger id="defaultOrderBy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created date</SelectItem>
              <SelectItem value="updated">Updated date</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="defaultOrder">Order</FieldLabel>
          <Select value={defaultOrder} onValueChange={onOrderChange}>
            <SelectTrigger id="defaultOrder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending (newest first)</SelectItem>
              <SelectItem value="asc">Ascending (oldest first)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}
