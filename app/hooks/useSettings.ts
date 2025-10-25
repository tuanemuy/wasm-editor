import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDIContainer } from "@/context/di";
import { getSettings } from "@/core/application/settings/getSettings";
import { resetSettings as resetSettingsService } from "@/core/application/settings/resetSettings";
import { updateSettings as updateSettingsService } from "@/core/application/settings/updateSettings";
import type { Settings } from "@/core/domain/settings/entity";

export interface UseSettingsResult {
  settings: Settings | null;
  loading: boolean;
  saving: boolean;
  resetting: boolean;
  error: Error | null;
  updateSettings: (
    updates: Partial<{
      defaultOrder: string;
      defaultOrderBy: string;
      autoSaveInterval: number;
    }>,
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
}

/**
 * 設定の読み込み・保存・リセットを管理するフック
 */
export function useSettings(): UseSettingsResult {
  const context = useDIContainer();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load settings on mount
  useEffect(() => {
    getSettings(context)
      .then((loadedSettings) => {
        setSettings(loadedSettings);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setError(err as Error);
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, [context]);

  // Update settings
  const updateSettings = useCallback(
    async (
      updates: Partial<{
        defaultOrder: string;
        defaultOrderBy: string;
        autoSaveInterval: number;
      }>,
    ): Promise<void> => {
      if (saving) return;

      setSaving(true);
      try {
        const updated = await updateSettingsService(context, updates);
        setSettings(updated);
        toast.success("Settings saved");
      } catch (err) {
        console.error("Failed to save settings:", err);
        toast.error("Failed to save settings");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [context, saving],
  );

  // Reset settings
  const resetSettings = useCallback(async (): Promise<void> => {
    if (resetting) return;

    setResetting(true);
    try {
      const reset = await resetSettingsService(context);
      setSettings(reset);
      toast.success("Settings reset to defaults");
    } catch (err) {
      console.error("Failed to reset settings:", err);
      toast.error("Failed to reset settings");
      throw err;
    } finally {
      setResetting(false);
    }
  }, [context, resetting]);

  return {
    settings,
    loading,
    saving,
    resetting,
    error,
    updateSettings,
    resetSettings,
  };
}
