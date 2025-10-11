# Settings ドメイン

## 概要

Settingsドメインは、アプリケーション設定の管理を担当します。
デフォルトソート順、エディター設定、自動保存間隔、リビジョン保存間隔などの設定を管理します。

## 責務

- デフォルトソート順の管理
- エディター設定の管理（フォントサイズ、テーマ）
- 自動保存間隔の管理
- リビジョン保存間隔の管理
- 設定の永続化

## エンティティ

### Settings

アプリケーション設定を表すエンティティ。

```typescript
type Settings = Readonly<{
  defaultSortBy: SortBy;
  autoSaveInterval: AutoSaveInterval;
  revisionInterval: RevisionInterval;
  editorFontSize: EditorFontSize;
  editorTheme: EditorTheme;
  updatedAt: Date;
}>;
```

**プロパティ**:
- `defaultSortBy`: デフォルトのソート順（メモ一覧のデフォルト表示順）
- `autoSaveInterval`: 自動保存間隔（ミリ秒）
- `revisionInterval`: リビジョン保存間隔（ミリ秒）
- `editorFontSize`: エディターのフォントサイズ（ピクセル）
- `editorTheme`: エディターのテーマ（ライト/ダーク）
- `updatedAt`: 設定の更新日時

**ファクトリ関数**:
- `createDefaultSettings(): Settings`
  - デフォルト設定を作成

- `reconstructSettings(data: RawSettingsData): Result<Settings, ValidationError>`
  - DBから取得した生データから設定エンティティを再構築

**ドメインメソッド**:
- `updateSettings(settings: Settings, updates: Partial<SettingsUpdates>): Result<Settings, ValidationError>`
  - 設定を部分更新し、updatedAt を現在時刻に設定

---

## 値オブジェクト

### SortBy

ノートのソート順（Noteドメインと同じ）。

```typescript
const sortBySchema = z.enum([
  "created_asc",
  "created_desc",
  "updated_asc",
  "updated_desc",
]);

type SortBy = z.infer<typeof sortBySchema>;
```

**デフォルト値**: `"updated_desc"`（更新日の新しい順）

---

### AutoSaveInterval

自動保存間隔（ミリ秒）。

```typescript
const autoSaveIntervalSchema = z.number().min(1000).max(60000);
type AutoSaveInterval = z.infer<typeof autoSaveIntervalSchema>;
```

**制約**:
- 最小: 1秒（1000ミリ秒）
- 最大: 60秒（60000ミリ秒）

**デフォルト値**: 2000（2秒）

---

### RevisionInterval

リビジョン保存間隔（ミリ秒）。

```typescript
const revisionIntervalSchema = z.number().min(60000).max(3600000);
type RevisionInterval = z.infer<typeof revisionIntervalSchema>;
```

**制約**:
- 最小: 1分（60000ミリ秒）
- 最大: 60分（3600000ミリ秒）

**デフォルト値**: 600000（10分）

---

### EditorFontSize

エディターのフォントサイズ（ピクセル）。

```typescript
const editorFontSizeSchema = z.number().min(10).max(32);
type EditorFontSize = z.infer<typeof editorFontSizeSchema>;
```

**制約**:
- 最小: 10px
- 最大: 32px

**デフォルト値**: 16（16px）

---

### EditorTheme

エディターのテーマ。

```typescript
const editorThemeSchema = z.enum(["light", "dark"]);
type EditorTheme = z.infer<typeof editorThemeSchema>;
```

**デフォルト値**: `"light"`

---

## ポート（インターフェース）

### SettingsRepository

設定の永続化を担当するリポジトリインターフェース。

```typescript
interface SettingsRepository {
  get(): Promise<Result<Settings, RepositoryError>>;

  update(settings: Settings): Promise<Result<Settings, RepositoryError>>;
}
```

**メソッド**:
- `get`: 設定を取得（設定が存在しない場合はデフォルト設定を返す）
- `update`: 設定を更新

---

## ユースケース

### getSettings

アプリケーション設定を取得します。

```typescript
async function getSettings(
  context: Context
): Promise<Result<Settings, ApplicationError>>
```

**処理フロー**:
1. リポジトリから設定を取得
2. 設定が存在しない場合はデフォルト設定を返す
3. 設定を返す

**エラー**:
- RepositoryError: DB取得失敗

---

### updateSettings

アプリケーション設定を更新します。

```typescript
type UpdateSettingsInput = Partial<{
  defaultSortBy: SortBy;
  autoSaveInterval: AutoSaveInterval;
  revisionInterval: RevisionInterval;
  editorFontSize: EditorFontSize;
  editorTheme: EditorTheme;
}>;

async function updateSettings(
  context: Context,
  input: UpdateSettingsInput
): Promise<Result<Settings, ApplicationError>>
```

**処理フロー**:
1. リポジトリから現在の設定を取得
2. 設定が存在しない場合はデフォルト設定を作成
3. 指定されたフィールドのみ更新（updatedAt も更新）
4. 更新された設定をリポジトリに保存
5. 保存された設定を返す

**エラー**:
- ValidationError: バリデーション失敗
- RepositoryError: DB取得/保存失敗

---

## データベーススキーマ

### settings テーブル

```typescript
const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1), // シングルトン（常に1行のみ）
  defaultSortBy: text("default_sort_by").notNull().default("updated_desc"),
  autoSaveInterval: integer("auto_save_interval").notNull().default(2000),
  revisionInterval: integer("revision_interval").notNull().default(600000),
  editorFontSize: integer("editor_font_size").notNull().default(16),
  editorTheme: text("editor_theme").notNull().default("light"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
```

**注意**:
- `id` は常に 1 で固定（シングルトンパターン）
- アプリケーション全体で1つの設定のみ存在

---

## 実装のポイント

### シングルトンパターン

- 設定テーブルは1行のみを保持
- `id` は常に 1 で固定
- `get` メソッドでは `id = 1` のレコードを取得
- `update` メソッドでは `id = 1` のレコードを更新

### デフォルト設定

設定が存在しない場合（初回起動時）は、以下のデフォルト設定を使用：
- `defaultSortBy`: `"updated_desc"`（更新日の新しい順）
- `autoSaveInterval`: 2000（2秒）
- `revisionInterval`: 600000（10分）
- `editorFontSize`: 16（16px）
- `editorTheme`: `"light"`

### 設定の適用

設定はアプリケーション全体で使用されます：
- **Note一覧**: `defaultSortBy` を使用してノートをソート
- **エディター**: `autoSaveInterval` を使用して自動保存のタイミングを制御
- **リビジョン**: `revisionInterval` を使用してリビジョン保存のタイミングを制御
- **エディターUI**: `editorFontSize` と `editorTheme` を使用してスタイリング

### 設定の変更通知

設定が変更された場合、アプリケーション全体に通知する必要があります。
- React の Context や状態管理ライブラリ（Zustand、Jotai など）を使用
- 設定が更新されたら、Context を更新して UI を再レンダリング

---

## 関連するドメイン

- **Note**: デフォルトソート順を使用
- **Revision**: リビジョン保存間隔を使用
- **すべてのドメイン**: 設定を参照して動作を制御
