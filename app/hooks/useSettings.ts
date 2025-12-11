import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Container } from "@/core/application/container";
import { getSettings } from "@/core/application/settings/getSettings";
import { resetSettings } from "@/core/application/settings/resetSettings";
import { updateSettings } from "@/core/application/settings/updateSettings";
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
export function useSettings(container: Container): UseSettingsResult {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load settings on mount
  useEffect(() => {
    getSettings(container)
      .then((loadedSettings) => {
        setSettings(loadedSettings);
        setLoading(false);
      })
      .catch((err) => {
        setError(err as Error);
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, [container]);

  // Update settings
  const _updateSettings = useCallback(
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
        const updated = await updateSettings(container, updates);
        setSettings(updated);
        toast.success("Settings saved");
      } catch (err) {
        toast.error("Failed to save settings");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [container, saving],
  );

  // Reset settings
  const _resetSettings = useCallback(async (): Promise<void> => {
    if (resetting) return;

    setResetting(true);
    try {
      const reset = await resetSettings(container);
      setSettings(reset);
      toast.success("Settings reset to defaults");
    } catch (err) {
      toast.error("Failed to reset settings");
      throw err;
    } finally {
      setResetting(false);
    }
  }, [container, resetting]);

  return {
    settings,
    loading,
    saving,
    resetting,
    error,
    updateSettings: _updateSettings,
    resetSettings: _resetSettings,
  };
}
