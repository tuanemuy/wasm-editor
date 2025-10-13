import { BusinessRuleError } from "@/core/domain/error";
import { SettingsErrorCode } from "./errorCode";

// SortOrder
export const SortOrder = {
  CREATED_ASC: "CREATED_ASC",
  CREATED_DESC: "CREATED_DESC",
  UPDATED_ASC: "UPDATED_ASC",
  UPDATED_DESC: "UPDATED_DESC",
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export function createSortOrder(order: string): SortOrder {
  if (!Object.values(SortOrder).includes(order as SortOrder)) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidSortOrder,
      "Invalid sort order",
    );
  }
  return order as SortOrder;
}

// FontSize
export const FontSize = {
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
  EXTRA_LARGE: "EXTRA_LARGE",
} as const;
export type FontSize = (typeof FontSize)[keyof typeof FontSize];

export function createFontSize(size: string): FontSize {
  if (!Object.values(FontSize).includes(size as FontSize)) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidFontSize,
      "Invalid font size",
    );
  }
  return size as FontSize;
}

export function getFontSizeInPixels(size: FontSize): number {
  switch (size) {
    case FontSize.SMALL:
      return 14;
    case FontSize.MEDIUM:
      return 16;
    case FontSize.LARGE:
      return 18;
    case FontSize.EXTRA_LARGE:
      return 20;
  }
}

// Theme
export const Theme = {
  LIGHT: "LIGHT",
  DARK: "DARK",
  AUTO: "AUTO",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export function createTheme(theme: string): Theme {
  if (!Object.values(Theme).includes(theme as Theme)) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidTheme,
      "Invalid theme",
    );
  }
  return theme as Theme;
}

// FontFamily
export const FontFamily = {
  SYSTEM: "SYSTEM",
  SERIF: "SERIF",
  SANS_SERIF: "SANS_SERIF",
  MONOSPACE: "MONOSPACE",
} as const;
export type FontFamily = (typeof FontFamily)[keyof typeof FontFamily];

export function createFontFamily(family: string): FontFamily {
  if (!Object.values(FontFamily).includes(family as FontFamily)) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidFontFamily,
      "Invalid font family",
    );
  }
  return family as FontFamily;
}

// Timestamp
export type Timestamp = Date & { readonly brand: "Timestamp" };

export function createTimestamp(date: Date): Timestamp {
  return date as Timestamp;
}

export function nowTimestamp(): Timestamp {
  return new Date() as Timestamp;
}

// GeneralSettings
export type GeneralSettings = {
  defaultSortOrder: SortOrder;
  autoSaveInterval: number; // milliseconds
  itemsPerPage: number;
};

export function createGeneralSettings(
  params: Partial<GeneralSettings>,
): GeneralSettings {
  const defaultSortOrder = params.defaultSortOrder || SortOrder.UPDATED_DESC;
  const autoSaveInterval = params.autoSaveInterval || 2000;
  const itemsPerPage = params.itemsPerPage || 20;

  if (autoSaveInterval < 1000 || autoSaveInterval > 10000) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidAutoSaveInterval,
      "Auto save interval must be between 1000 and 10000 milliseconds",
    );
  }

  if (itemsPerPage < 10 || itemsPerPage > 100) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidItemsPerPage,
      "Items per page must be between 10 and 100",
    );
  }

  return {
    defaultSortOrder,
    autoSaveInterval,
    itemsPerPage,
  };
}

// EditorSettings
export type EditorSettings = {
  fontSize: FontSize;
  theme: Theme;
  fontFamily: FontFamily;
  lineHeight: number;
  showLineNumbers: boolean;
};

export function createEditorSettings(
  params: Partial<EditorSettings>,
): EditorSettings {
  const fontSize = params.fontSize || FontSize.MEDIUM;
  const theme = params.theme || Theme.AUTO;
  const fontFamily = params.fontFamily || FontFamily.SYSTEM;
  const lineHeight = params.lineHeight || 1.6;
  const showLineNumbers = params.showLineNumbers || false;

  if (lineHeight < 1.0 || lineHeight > 3.0) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidLineHeight,
      "Line height must be between 1.0 and 3.0",
    );
  }

  return {
    fontSize,
    theme,
    fontFamily,
    lineHeight,
    showLineNumbers,
  };
}

// RevisionSettings
export type RevisionSettings = {
  autoRevisionInterval: number; // minutes
  maxRevisionsPerNote: number;
  enableAutoRevision: boolean;
};

export function createRevisionSettings(
  params: Partial<RevisionSettings>,
): RevisionSettings {
  const autoRevisionInterval = params.autoRevisionInterval || 10;
  const maxRevisionsPerNote = params.maxRevisionsPerNote || 50;
  const enableAutoRevision = params.enableAutoRevision ?? true;

  if (autoRevisionInterval < 1 || autoRevisionInterval > 60) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidAutoRevisionInterval,
      "Auto revision interval must be between 1 and 60 minutes",
    );
  }

  if (maxRevisionsPerNote < 10 || maxRevisionsPerNote > 100) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidMaxRevisionsPerNote,
      "Max revisions per note must be between 10 and 100",
    );
  }

  return {
    autoRevisionInterval,
    maxRevisionsPerNote,
    enableAutoRevision,
  };
}

// ImageSettings
export type ImageSettings = {
  maxImageSize: number; // bytes
  imageQuality: number; // 0.0 - 1.0
  autoOptimize: boolean;
};

export function createImageSettings(
  params: Partial<ImageSettings>,
): ImageSettings {
  const maxImageSize = params.maxImageSize || 10 * 1024 * 1024; // 10MB
  const imageQuality = params.imageQuality || 0.85;
  const autoOptimize = params.autoOptimize ?? true;

  const minImageSize = 1024 * 1024; // 1MB
  const maxAllowedImageSize = 50 * 1024 * 1024; // 50MB

  if (maxImageSize < minImageSize || maxImageSize > maxAllowedImageSize) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidImageSize,
      "Max image size must be between 1MB and 50MB",
    );
  }

  if (imageQuality < 0.0 || imageQuality > 1.0) {
    throw new BusinessRuleError(
      SettingsErrorCode.InvalidImageQuality,
      "Image quality must be between 0.0 and 1.0",
    );
  }

  return {
    maxImageSize,
    imageQuality,
    autoOptimize,
  };
}
