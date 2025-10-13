import { err, ok, type Result } from "neverthrow";
import {
  createDefaultSettings,
  type Settings,
} from "@/core/domain/settings/entity";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import { RepositoryError } from "@/core/error/adapter";

/**
 * Mock settings repository for testing
 */
export class MockSettingsRepository implements SettingsRepository {
  private settings: Settings | null = null;
  private shouldFail = false;

  constructor(initialSettings?: Settings) {
    this.settings = initialSettings ?? null;
  }

  /**
   * Set whether operations should fail
   */
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  /**
   * Get settings (returns default settings if none exist)
   */
  async get(): Promise<Result<Settings, RepositoryError>> {
    if (this.shouldFail) {
      return err(new RepositoryError("Mock repository error"));
    }

    if (this.settings === null) {
      this.settings = createDefaultSettings();
    }

    return ok(this.settings);
  }

  /**
   * Update settings
   */
  async update(settings: Settings): Promise<Result<Settings, RepositoryError>> {
    if (this.shouldFail) {
      return err(new RepositoryError("Mock repository error"));
    }

    this.settings = settings;
    return ok(settings);
  }

  /**
   * Reset the repository state
   */
  reset(): void {
    this.settings = null;
    this.shouldFail = false;
  }
}
