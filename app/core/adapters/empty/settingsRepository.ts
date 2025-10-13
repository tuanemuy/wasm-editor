/**
 * Empty Settings Repository
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */
import type { Settings } from "@/core/domain/settings/entity";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";

export class EmptySettingsRepository implements SettingsRepository {
  async get(): Promise<Settings> {
    throw new Error("Not implemented");
  }

  async save(_settings: Settings): Promise<void> {
    // Stub implementation
  }

  async exists(): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
