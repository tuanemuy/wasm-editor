import { useState } from "react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/layout/SettingsHeader";
import { AutoSaveSettingsCard } from "@/components/settings/AutoSaveSettingsCard";
import { SettingsActions } from "@/components/settings/SettingsActions";
import { SortSettingsCard } from "@/components/settings/SortSettingsCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useContainer } from "@/context/di";
import { useSettings } from "@/hooks/useSettings";
import type { Route } from "./+types/settings";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Settings - WASM Editor" },
    { name: "description", content: "Configure your application settings" },
  ];
}

interface SettingsFormProps {
  settings: {
    defaultOrder: string;
    defaultOrderBy: string;
    autoSaveInterval: number;
  };
  saving: boolean;
  resetting: boolean;
  updateSettings: (settings: {
    defaultOrder?: string;
    defaultOrderBy?: string;
    autoSaveInterval?: number;
  }) => Promise<void>;
  resetSettings: () => Promise<void>;
}

/**
 * Settings form component
 * Uses key prop from parent to reset form state when settings are loaded
 */
function SettingsForm({
  settings,
  saving,
  resetting,
  updateSettings,
  resetSettings,
}: SettingsFormProps) {
  // Form state initialized with settings (no useEffect needed)
  const [defaultOrder, setDefaultOrder] = useState<string>(
    settings.defaultOrder,
  );
  const [defaultOrderBy, setDefaultOrderBy] = useState<string>(
    settings.defaultOrderBy,
  );
  const [autoSaveInterval, setAutoSaveInterval] = useState<string>(
    settings.autoSaveInterval.toString(),
  );

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

  const hasChanges =
    defaultOrder !== settings.defaultOrder ||
    defaultOrderBy !== settings.defaultOrderBy ||
    autoSaveInterval !== settings.autoSaveInterval.toString();

  return (
    <>
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
        hasChanges={hasChanges}
        saving={saving}
        resetting={resetting}
        onSave={handleSave}
        onReset={handleReset}
      />
    </>
  );
}

export default function SettingsPage() {
  const container = useContainer();
  const {
    settings,
    loading,
    saving,
    resetting,
    updateSettings,
    resetSettings,
  } = useSettings(container);

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-muted/40">
        <SettingsHeader />
        <main className="max-w-4xl mx-auto p-4 py-8 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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

  return (
    <div className="min-h-screen bg-muted/40">
      <SettingsHeader />

      <main className="max-w-4xl mx-auto p-4 py-8 flex flex-col gap-6">
        {/* Use key prop to remount SettingsForm when settings change */}
        <SettingsForm
          key={`settings-${settings.defaultOrder}-${settings.defaultOrderBy}-${settings.autoSaveInterval}`}
          settings={settings}
          saving={saving}
          resetting={resetting}
          updateSettings={updateSettings}
          resetSettings={resetSettings}
        />
      </main>
    </div>
  );
}
