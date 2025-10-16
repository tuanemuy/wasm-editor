import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface SettingsActionsProps {
  hasChanges: boolean;
  saving: boolean;
  resetting: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SettingsActions({
  hasChanges,
  saving,
  resetting,
  onSave,
  onReset,
}: SettingsActionsProps) {
  return (
    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        onClick={onReset}
        disabled={resetting || saving}
      >
        {resetting ? <Spinner className="h-4 w-4 mr-2" /> : null}
        Reset to defaults
      </Button>
      <Button onClick={onSave} disabled={!hasChanges || saving}>
        {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
        Save changes
      </Button>
    </div>
  );
}
