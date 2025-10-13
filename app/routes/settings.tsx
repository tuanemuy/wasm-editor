import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getSettings } from "@/core/application/settings/getSettings";
import { resetSettings } from "@/core/application/settings/resetSettings";
import { updateSettings } from "@/core/application/settings/updateSettings";
import type { Settings } from "@/core/domain/settings/entity";
import { useAppContext } from "@/lib/context";
import type { Route } from "./+types/settings";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Settings - WASM Editor" },
    { name: "description", content: "Configure your application settings" },
  ];
}

export default function SettingsPage() {
  const context = useAppContext();

  // State
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form state
  const [defaultOrder, setDefaultOrder] = useState<string>("desc");
  const [defaultOrderBy, setDefaultOrderBy] = useState<string>("created");
  const [autoSaveInterval, setAutoSaveInterval] = useState<string>("2000");

  // Load settings
  useEffect(() => {
    getSettings(context)
      .then((loadedSettings) => {
        setSettings(loadedSettings);
        setDefaultOrder(loadedSettings.defaultOrder);
        setDefaultOrderBy(loadedSettings.defaultOrderBy);
        setAutoSaveInterval(loadedSettings.autoSaveInterval.toString());
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings");
      });
  }, [context]);

  // Save settings
  const handleSave = async () => {
    if (saving) return;

    const interval = Number.parseInt(autoSaveInterval, 10);
    if (Number.isNaN(interval) || interval < 1000) {
      toast.error("Auto-save interval must be at least 1000ms");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSettings(context, {
        defaultOrder,
        defaultOrderBy,
        autoSaveInterval: interval,
      });
      setSettings(updated);
      toast.success("Settings saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset settings
  const handleReset = async () => {
    if (resetting) return;

    setResetting(true);
    try {
      const reset = await resetSettings(context);
      setSettings(reset);
      setDefaultOrder(reset.defaultOrder);
      setDefaultOrderBy(reset.defaultOrderBy);
      setAutoSaveInterval(reset.autoSaveInterval.toString());
      toast.success("Settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const hasChanges =
    settings &&
    (defaultOrder !== settings.defaultOrder ||
      defaultOrderBy !== settings.defaultOrderBy ||
      autoSaveInterval !== settings.autoSaveInterval.toString());

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="border-b bg-background p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6 py-8">
        {/* Default Sort Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Default Sort</CardTitle>
            <CardDescription>
              Configure the default sort order for the notes list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultOrderBy">Sort by</Label>
              <Select value={defaultOrderBy} onValueChange={setDefaultOrderBy}>
                <SelectTrigger id="defaultOrderBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created date</SelectItem>
                  <SelectItem value="updated">Updated date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultOrder">Order</Label>
              <Select value={defaultOrder} onValueChange={setDefaultOrder}>
                <SelectTrigger id="defaultOrder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    Descending (newest first)
                  </SelectItem>
                  <SelectItem value="asc">Ascending (oldest first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Auto-save Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Auto-save</CardTitle>
            <CardDescription>
              Configure how often notes are automatically saved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="autoSaveInterval">
                Auto-save interval (milliseconds)
              </Label>
              <Input
                id="autoSaveInterval"
                type="number"
                min="1000"
                step="1000"
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Minimum: 1000ms (1 second). Lower values save more frequently.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting || saving}
          >
            {resetting ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Reset to defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Save changes
          </Button>
        </div>
      </main>
    </div>
  );
}
