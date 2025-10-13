import {
  createEditorSettings,
  createGeneralSettings,
  createImageSettings,
  createRevisionSettings,
  type EditorSettings,
  FontFamily,
  FontSize,
  type GeneralSettings,
  type ImageSettings,
  nowTimestamp,
  type RevisionSettings,
  SortOrder,
  Theme,
  type Timestamp,
} from "./valueObject";

export type Settings = Readonly<{
  general: GeneralSettings;
  editor: EditorSettings;
  revision: RevisionSettings;
  image: ImageSettings;
  updatedAt: Timestamp;
}>;

export function createDefaultSettings(): Settings {
  return {
    general: createGeneralSettings({
      defaultSortOrder: SortOrder.UPDATED_DESC,
      autoSaveInterval: 2000,
      itemsPerPage: 20,
    }),
    editor: createEditorSettings({
      fontSize: FontSize.MEDIUM,
      theme: Theme.AUTO,
      fontFamily: FontFamily.SYSTEM,
      lineHeight: 1.6,
      showLineNumbers: false,
    }),
    revision: createRevisionSettings({
      autoRevisionInterval: 10,
      maxRevisionsPerNote: 50,
      enableAutoRevision: true,
    }),
    image: createImageSettings({
      maxImageSize: 10 * 1024 * 1024, // 10MB
      imageQuality: 0.85,
      autoOptimize: true,
    }),
    updatedAt: nowTimestamp(),
  };
}

export function updateSettings(
  settings: Settings,
  params: Partial<Settings>,
): Settings {
  return {
    general: params.general
      ? createGeneralSettings(params.general)
      : settings.general,
    editor: params.editor
      ? createEditorSettings(params.editor)
      : settings.editor,
    revision: params.revision
      ? createRevisionSettings(params.revision)
      : settings.revision,
    image: params.image ? createImageSettings(params.image) : settings.image,
    updatedAt: nowTimestamp(),
  };
}

export function updateGeneralSettings(
  settings: Settings,
  general: Partial<GeneralSettings>,
): Settings {
  return {
    ...settings,
    general: createGeneralSettings({
      ...settings.general,
      ...general,
    }),
    updatedAt: nowTimestamp(),
  };
}

export function updateEditorSettings(
  settings: Settings,
  editor: Partial<EditorSettings>,
): Settings {
  return {
    ...settings,
    editor: createEditorSettings({
      ...settings.editor,
      ...editor,
    }),
    updatedAt: nowTimestamp(),
  };
}

export function updateRevisionSettings(
  settings: Settings,
  revision: Partial<RevisionSettings>,
): Settings {
  return {
    ...settings,
    revision: createRevisionSettings({
      ...settings.revision,
      ...revision,
    }),
    updatedAt: nowTimestamp(),
  };
}

export function updateImageSettings(
  settings: Settings,
  image: Partial<ImageSettings>,
): Settings {
  return {
    ...settings,
    image: createImageSettings({
      ...settings.image,
      ...image,
    }),
    updatedAt: nowTimestamp(),
  };
}
