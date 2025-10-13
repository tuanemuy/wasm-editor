import type { Settings } from "../entity";
import type {
  EditorSettings,
  GeneralSettings,
  ImageSettings,
  RevisionSettings,
} from "../valueObject";

export interface SettingsRepository {
  /**
   * Get settings
   * @throws {SystemError}
   */
  get(): Promise<Settings>;

  /**
   * Save settings
   * @throws {SystemError}
   */
  save(settings: Settings): Promise<Settings>;

  /**
   * Reset settings to default values
   * @throws {SystemError}
   */
  reset(): Promise<Settings>;

  /**
   * Update only general settings
   * @throws {SystemError}
   */
  updateGeneral(general: GeneralSettings): Promise<Settings>;

  /**
   * Update only editor settings
   * @throws {SystemError}
   */
  updateEditor(editor: EditorSettings): Promise<Settings>;

  /**
   * Update only revision settings
   * @throws {SystemError}
   */
  updateRevision(revision: RevisionSettings): Promise<Settings>;

  /**
   * Update only image settings
   * @throws {SystemError}
   */
  updateImage(image: ImageSettings): Promise<Settings>;
}
