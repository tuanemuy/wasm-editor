# Settings ドメイン

## 概要

**ドメイン名:** Settings (設定)

Settingsドメインは、アプリケーション全体の設定を管理する汎用ドメインです。
ユーザーの好みに応じた動作をサポートし、設定の永続化とインポート/エクスポートを提供します。

## エンティティ

### Settings (設定)

アプリケーション全体の設定を表現するエンティティ。

**属性:**
- `defaultOrder: SortOrder` - デフォルトのソート順（昇順/降順）
- `defaultOrderBy: OrderBy` - デフォルトのソート対象（作成日時/更新日時）
- `autoSaveInterval: AutoSaveInterval` - 自動保存間隔

**ビジネスルール:**
1. 自動保存間隔は500ms以上10000ms以下である
2. ソート順とソート対象は定義された値のみを取る

**エンティティ操作:**
- `createDefaultSettings(): Settings` - デフォルト設定を作成
- `updateSettings(settings: Settings, updates: Partial<Pick<Settings, 'defaultOrder' | 'defaultOrderBy' | 'autoSaveInterval'>>): Settings` - 設定を更新
- `reset(): Settings` - 設定をリセット

```typescript
export type Settings = {
  defaultOrder: SortOrder;
  defaultOrderBy: OrderBy;
  autoSaveInterval: AutoSaveInterval;
};
```

## 値オブジェクト

**注記:** `SortOrder` と `OrderBy` は Note ドメインで定義されており、Settings ドメインではそれらを参照します。

### SortOrder (ソート順)

> Note ドメインで定義: `app/core/domain/note/valueObject.ts`

メモ一覧のデフォルトソート順（昇順/降順）を表す値オブジェクト。

**取りうる値:**
- `asc` - 昇順 (古い順)
- `desc` - 降順 (新しい順、デフォルト)

```typescript
// Note ドメインから import
import type { SortOrder } from "@/core/domain/note/valueObject";
```

### OrderBy (ソート対象)

> Note ドメインで定義: `app/core/domain/note/valueObject.ts`

メモ一覧のデフォルトソート対象を表す値オブジェクト。

**取りうる値:**
- `created_at` - 作成日時 (デフォルト)
- `updated_at` - 更新日時

```typescript
// Note ドメインから import
import type { OrderBy } from "@/core/domain/note/valueObject";
```

### AutoSaveInterval (自動保存間隔)

エディターの自動保存間隔を表す値オブジェクト (ミリ秒)。

**バリデーションルール:**
1. 最小値: 500ミリ秒
2. 最大値: 10000ミリ秒 (10秒)
3. デフォルト値: 2000ミリ秒 (2秒)

```typescript
export type AutoSaveInterval = number & { readonly brand: "AutoSaveInterval" };

export function createAutoSaveInterval(interval: number): AutoSaveInterval;
export function getDefaultAutoSaveInterval(): AutoSaveInterval; // 2000
```

## エラーコード

Settingsドメインで発生するエラーコードを定義します。

```typescript
export const SettingsErrorCode = {
  // ソート順関連
  InvalidSortOrder: "SETTINGS_INVALID_SORT_ORDER",
  InvalidOrderBy: "SETTINGS_INVALID_ORDER_BY",

  // 自動保存間隔関連
  AutoSaveIntervalTooShort: "SETTINGS_AUTO_SAVE_INTERVAL_TOO_SHORT",
  AutoSaveIntervalTooLong: "SETTINGS_AUTO_SAVE_INTERVAL_TOO_LONG",
} as const;
```

## ポート (インターフェース)

### SettingsRepository (設定リポジトリ)

設定の永続化を担当するポート。

**責務:**
- 設定の保存と取得
- システム全体で単一の設定インスタンスを保証

**実装上の制約:**
- システム全体で1つの設定インスタンスのみが永続化される
- この制約はリポジトリの実装層（ローカルストレージ）で保証される

```typescript
export interface SettingsRepository {
  /**
   * 設定を取得
   * システム全体で単一の設定を取得する
   * 設定が存在しない場合はデフォルト設定を返す
   */
  get(): Promise<Settings>;

  /**
   * 設定を保存
   * システム全体で単一の設定を更新する
   */
  save(settings: Settings): Promise<void>;

  /**
   * 設定が存在するかチェック
   */
  exists(): Promise<boolean>;
}
```

## ユースケース

Settingsドメインで提供されるユースケース一覧。

### 1. getSettings (設定取得)

現在の設定を取得します。

**入力:**
- なし

**出力:**
- `Settings` - 現在の設定

**ビジネスルール:**
- 設定が存在しない場合はデフォルト設定を返す
- 設定は常に取得可能

**エラー:**
- `SystemError` - 取得に失敗

**実装パス:** `app/core/application/settings/getSettings.ts`

---

### 2. updateSettings (設定更新)

設定を更新します。

**入力:**
- `defaultOrder?: SortOrder` - デフォルトのソート順（昇順/降順） (オプション)
- `defaultOrderBy?: OrderBy` - デフォルトのソート対象（作成日時/更新日時） (オプション)
- `autoSaveInterval?: AutoSaveInterval` - 自動保存間隔 (オプション)

**出力:**
- `Settings` - 更新された設定

**ビジネスルール:**
- 指定されたフィールドのみを更新 (部分更新)
- 指定されていないフィールドは現在の値を保持

**エラー:**
- `BusinessRuleError(InvalidSortOrder)` - 無効なソート順
- `BusinessRuleError(InvalidOrderBy)` - 無効なソート対象
- `BusinessRuleError(AutoSaveIntervalTooShort)` - 自動保存間隔が短すぎる
- `BusinessRuleError(AutoSaveIntervalTooLong)` - 自動保存間隔が長すぎる
- `SystemError` - 保存に失敗

**実装パス:** `app/core/application/settings/updateSettings.ts`

---

### 3. resetSettings (設定リセット)

設定をデフォルト値にリセットします。

**入力:**
- なし

**出力:**
- `Settings` - リセットされた設定

**ビジネスルール:**
- すべての設定をデフォルト値に戻す

**エラー:**
- `SystemError` - 保存に失敗

**実装パス:** `app/core/application/settings/resetSettings.ts`

## データモデル

### ローカルストレージ実装

設定は localStorage に JSON 形式で保存されます。

**ストレージキー:** `app_settings`

**データ形式:**
```typescript
{
  defaultOrder: string;          // "asc" | "desc"
  defaultOrderBy: string;        // "created_at" | "updated_at"
  autoSaveInterval: number;      // ミリ秒 (500-10000)
}
```

**実装の制約:**
- 固定キー（`app_settings`）を使用することで、システム全体で単一の設定を保証
- アダプタ層でJSON形式との相互変換を実装

## デフォルト値

```typescript
// app/core/domain/settings/entity.ts
export const DEFAULT_SETTINGS: Settings = {
  defaultOrder: "desc",
  defaultOrderBy: "created_at",
  autoSaveInterval: 2000,
};

/**
 * デフォルト設定を作成
 * 注: これは単一インスタンスではなく、デフォルト値を持つ新しいインスタンス
 */
export function createDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}
```

## テスト要件

各ユースケースに対して、以下のテストケースを作成します：

1. **正常系テスト**
   - 正しい入力で期待される出力が得られること
   - デフォルト設定が正しく作成されること

2. **異常系テスト**
   - バリデーションエラーが適切に発生すること
   - 不正なJSON形式でインポートエラーが発生すること

3. **境界値テスト**
   - 自動保存間隔の最小値/最大値が正しく処理されること

4. **統合テスト**
   - 設定の更新が正しく保存されること
   - リセットが正しく動作すること

テストケースの詳細は `spec/testcases/settings/` に格納されます。

## UI表示例

### 設定ページ

```
設定
├── デフォルトソート順: [降順 ▼]
├── デフォルトソート対象: [作成日時 ▼]
└── 自動保存間隔: [2000] ミリ秒
```
