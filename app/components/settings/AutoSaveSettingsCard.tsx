import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface AutoSaveSettingsCardProps {
  autoSaveInterval: string;
  onChange: (value: string) => void;
}

export function AutoSaveSettingsCard({
  autoSaveInterval,
  onChange,
}: AutoSaveSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-save</CardTitle>
        <CardDescription>
          Configure how often notes are automatically saved
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="autoSaveInterval">
            Auto-save interval (milliseconds)
          </FieldLabel>
          <Input
            id="autoSaveInterval"
            type="number"
            min="1000"
            step="1000"
            value={autoSaveInterval}
            onChange={(e) => onChange(e.target.value)}
          />
          <FieldDescription>
            Minimum: 1000ms (1 second). Lower values save more frequently.
          </FieldDescription>
        </Field>
      </CardContent>
    </Card>
  );
}
