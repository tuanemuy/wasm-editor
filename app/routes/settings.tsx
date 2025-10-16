import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/layout/SettingsHeader";
import { AutoSaveSettingsCard } from "@/components/settings/AutoSaveSettingsCard";
import { SettingsActions } from "@/components/settings/SettingsActions";
import { SortSettingsCard } from "@/components/settings/SortSettingsCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import type { Route } from "./+types/settings";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Settings - WASM Editor" },
    { name: "description", content: "Configure your application settings" },
  ];
}

export default function SettingsPage() {
  const {
    settings,
    loading,
    saving,
    resetting,
    updateSettings,
    resetSettings,
  } = useSettings();

  // Form state
  const [defaultOrder, setDefaultOrder] = useState<string>("desc");
  const [defaultOrderBy, setDefaultOrderBy] = useState<string>("created");
  const [autoSaveInterval, setAutoSaveInterval] = useState<string>("2000");

  // Sync form state with settings
  useEffect(() => {
    if (settings) {
      setDefaultOrder(settings.defaultOrder);
      setDefaultOrderBy(settings.defaultOrderBy);
      setAutoSaveInterval(settings.autoSaveInterval.toString());
    }
  }, [settings]);

  // Save settings
  const handleSave = async () => {
    const interval = Number.parseInt(autoSaveInterval, 10);
    if (Number.isNaN(interval) || interval < 1000) {
      toast.error("Auto-save interval must be at least 1000ms");
      return;
    }

    await updateSettings({
      defaultOrder,
      defaultOrderBy,
      autoSaveInterval: interval,
    });
  };

  // Reset settings
  const handleReset = async () => {
    await resetSettings();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <SettingsHeader />
        <main className="max-w-4xl mx-auto p-4 space-y-6 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </main>
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
      <SettingsHeader />

      <main className="max-w-4xl mx-auto p-4 space-y-6 py-8">
        <SortSettingsCard
          defaultOrderBy={defaultOrderBy}
          defaultOrder={defaultOrder}
          onOrderByChange={setDefaultOrderBy}
          onOrderChange={setDefaultOrder}
        />

        <AutoSaveSettingsCard
          autoSaveInterval={autoSaveInterval}
          onChange={setAutoSaveInterval}
        />

        <SettingsActions
          hasChanges={!!hasChanges}
          saving={saving}
          resetting={resetting}
          onSave={handleSave}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}
