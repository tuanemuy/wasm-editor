# Settings ドメイン

## 概要

**ドメイン名**: Settings

アプリケーション全体の設定を管理するドメイン。
ユーザーの好みやアプリケーションの動作を制御するための各種設定を提供する。

## エンティティ

### Settings

アプリケーション設定を表すエンティティ。

**属性**:
- `general: GeneralSettings` - 一般設定
- `editor: EditorSettings` - エディター設定
- `revision: RevisionSettings` - リビジョン設定
- `image: ImageSettings` - 画像設定
- `updatedAt: Timestamp` - 最終更新日時

**不変条件**:
- すべての設定項目は有効な値を持たなければならない

**ビジネスルール**:
- 設定は常に1つのインスタンスのみ存在する（シングルトン）
- 設定変更は即座に反映される

## 値オブジェクト

### GeneralSettings

一般設定を表す値オブジェクト。

**属性**:
- `defaultSortOrder: SortOrder` - デフォルトのメモソート順
- `autoSaveInterval: number` - 自動保存間隔（ミリ秒、デフォルト: 2000 = 2秒）
- `itemsPerPage: number` - 1ページあたりの表示件数（デフォルト: 20）

**バリデーション**:
- autoSaveIntervalは1000以上10000以下（1〜10秒）
- itemsPerPageは10以上100以下

### EditorSettings

エディター設定を表す値オブジェクト。

**属性**:
- `fontSize: FontSize` - フォントサイズ
- `theme: Theme` - テーマ（ライト/ダーク）
- `fontFamily: FontFamily` - フォントファミリー
- `lineHeight: number` - 行高（デフォルト: 1.6）
- `showLineNumbers: boolean` - 行番号表示（デフォルト: false）

**バリデーション**:
- lineHeightは1.0以上3.0以下

### RevisionSettings

リビジョン設定を表す値オブジェクト。

**属性**:
- `autoRevisionInterval: number` - 自動リビジョン保存間隔（分、デフォルト: 10）
- `maxRevisionsPerNote: number` - メモあたりの最大リビジョン数（デフォルト: 50）
- `enableAutoRevision: boolean` - 自動リビジョン保存を有効化（デフォルト: true）

**バリデーション**:
- autoRevisionIntervalは1以上60以下（1分〜1時間）
- maxRevisionsPerNoteは10以上100以下

### ImageSettings

画像設定を表す値オブジェクト。

**属性**:
- `maxImageSize: number` - 最大画像サイズ（バイト、デフォルト: 10MB）
- `imageQuality: number` - 画像品質（0.0〜1.0、デフォルト: 0.85）
- `autoOptimize: boolean` - 自動最適化を有効化（デフォルト: true）

**バリデーション**:
- maxImageSizeは1MB以上50MB以下
- imageQualityは0.0以上1.0以下

### SortOrder

メモのソート順。

**型**: `enum`
- `CREATED_ASC` - 作成日昇順
- `CREATED_DESC` - 作成日降順
- `UPDATED_ASC` - 更新日昇順
- `UPDATED_DESC` - 更新日降順

### FontSize

フォントサイズ。

**型**: `enum`
- `SMALL` - 小（14px）
- `MEDIUM` - 中（16px）
- `LARGE` - 大（18px）
- `EXTRA_LARGE` - 特大（20px）

### Theme

テーマ。

**型**: `enum`
- `LIGHT` - ライトテーマ
- `DARK` - ダークテーマ
- `AUTO` - システム設定に従う

### FontFamily

フォントファミリー。

**型**: `enum`
- `SYSTEM` - システムフォント
- `SERIF` - セリフ体
- `SANS_SERIF` - サンセリフ体
- `MONOSPACE` - 等幅フォント

### Timestamp

日時を表す値オブジェクト。

**型**: `Date`

## ポート

### SettingsRepository

設定の永続化を担当するリポジトリインターフェース。

**メソッド**:

```typescript
interface SettingsRepository {
  // 設定を取得
  // @throws {SystemError}
  get(): Promise<Settings>

  // 設定を保存
  // @throws {SystemError}
  save(settings: Settings): Promise<Settings>

  // 設定をリセット（デフォルト値に戻す）
  // @throws {SystemError}
  reset(): Promise<Settings>

  // 特定の設定カテゴリのみを更新
  // @throws {SystemError}
  updateGeneral(general: GeneralSettings): Promise<Settings>
  // @throws {SystemError}
  updateEditor(editor: EditorSettings): Promise<Settings>
  // @throws {SystemError}
  updateRevision(revision: RevisionSettings): Promise<Settings>
  // @throws {SystemError}
  updateImage(image: ImageSettings): Promise<Settings>
}
```

## ユースケース

### getSettings

現在の設定を取得する。

**入力**:
- なし

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. SettingsRepository.getで設定を取得
2. 設定が存在しない場合はデフォルト設定を作成
3. 設定を返す

**例外**:
- `SystemError`: DB取得エラーを投げる

### updateSettings

設定を更新する。

**入力**:
- `settings: Partial<Settings>` - 更新する設定項目

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. 入力をバリデート
2. SettingsRepository.getで現在の設定を取得
3. 指定された項目を更新
4. SettingsRepository.saveで保存
5. updatedAtを現在時刻に更新
6. 更新した設定を返す

**例外**:
- `ValidationError`: バリデーションエラーを投げる
- `SystemError`: DB保存エラーを投げる

### updateGeneralSettings

一般設定のみを更新する。

**入力**:
- `general: Partial<GeneralSettings>` - 更新する一般設定項目

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. 入力をバリデート
2. SettingsRepository.getで現在の設定を取得
3. 一般設定を更新
4. SettingsRepository.updateGeneralで保存
5. 更新した設定を返す

**例外**:
- `ValidationError`: バリデーションエラーを投げる
- `SystemError`: DB保存エラーを投げる

### updateEditorSettings

エディター設定のみを更新する。

**入力**:
- `editor: Partial<EditorSettings>` - 更新するエディター設定項目

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. 入力をバリデート
2. SettingsRepository.getで現在の設定を取得
3. エディター設定を更新
4. SettingsRepository.updateEditorで保存
5. 更新した設定を返す

**例外**:
- `ValidationError`: バリデーションエラーを投げる
- `SystemError`: DB保存エラーを投げる

### updateRevisionSettings

リビジョン設定のみを更新する。

**入力**:
- `revision: Partial<RevisionSettings>` - 更新するリビジョン設定項目

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. 入力をバリデート
2. SettingsRepository.getで現在の設定を取得
3. リビジョン設定を更新
4. SettingsRepository.updateRevisionで保存
5. 更新した設定を返す

**例外**:
- `ValidationError`: バリデーションエラーを投げる
- `SystemError`: DB保存エラーを投げる

### updateImageSettings

画像設定のみを更新する。

**入力**:
- `image: Partial<ImageSettings>` - 更新する画像設定項目

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. 入力をバリデート
2. SettingsRepository.getで現在の設定を取得
3. 画像設定を更新
4. SettingsRepository.updateImageで保存
5. 更新した設定を返す

**例外**:
- `ValidationError`: バリデーションエラーを投げる
- `SystemError`: DB保存エラーを投げる

### resetSettings

設定をデフォルト値にリセットする。

**入力**:
- なし

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. SettingsRepository.resetで設定をリセット
2. デフォルト設定を返す

**例外**:
- `SystemError`: DB保存エラーを投げる

### exportSettings

設定をJSONファイルとしてエクスポートする。

**入力**:
- なし

**出力**:
- `Promise<string>` - JSON文字列

**処理フロー**:
1. SettingsRepository.getで現在の設定を取得
2. 設定をJSON文字列にシリアライズ
3. JSON文字列を返す

**例外**:
- `SystemError`: シリアライズエラーを投げる

### importSettings

JSONファイルから設定をインポートする。

**入力**:
- `json: string` - JSON文字列

**出力**:
- `Promise<Settings>`

**処理フロー**:
1. JSON文字列をパース
2. 設定をバリデート
3. SettingsRepository.saveで保存
4. インポートした設定を返す

**例外**:
- `ValidationError`: バリデーションエラー、パースエラーを投げる
- `SystemError`: DB保存エラーを投げる

## 他ドメインとの関係

### Note ドメイン

- デフォルトソート順の設定を参照
- 自動保存間隔の設定を参照
- 1ページあたりの表示件数の設定を参照

### Revision ドメイン

- 自動リビジョン保存間隔の設定を参照
- 最大リビジョン数の設定を参照
- 自動リビジョン保存の有効/無効の設定を参照

### Image ドメイン

- 最大画像サイズの設定を参照
- 画像品質の設定を参照
- 自動最適化の有効/無効の設定を参照

### すべてのドメイン

- エディター設定（フォント、テーマ等）は全体に影響

## ビジネスルールの補足

### デフォルト設定

初回起動時または設定リセット時に適用されるデフォルト設定：

**一般設定**:
- デフォルトソート順: 更新日降順（UPDATED_DESC）
- 自動保存間隔: 2秒（2000ms）
- 1ページあたりの表示件数: 20件

**エディター設定**:
- フォントサイズ: 中（MEDIUM = 16px）
- テーマ: システム設定に従う（AUTO）
- フォントファミリー: システムフォント（SYSTEM）
- 行高: 1.6
- 行番号表示: 無効

**リビジョン設定**:
- 自動リビジョン保存間隔: 10分
- 最大リビジョン数: 50件
- 自動リビジョン保存: 有効

**画像設定**:
- 最大画像サイズ: 10MB
- 画像品質: 0.85（85%）
- 自動最適化: 有効

### 設定の保存場所

- データベース内の `settings` テーブルに保存
- 常に1レコードのみ存在（シングルトン）
- キャッシュして頻繁なDB アクセスを避ける

### 設定変更の反映

- 設定変更は即座に反映される
- 一部の設定（テーマ等）はページリロードなしで適用
- エディター設定はリアルタイムで反映

### バリデーション

- すべての設定値は範囲内でなければならない
- 不正な値が入力された場合はValidationErrorを返す
- インポート時は特に厳密にバリデート

### エクスポート/インポート

- 設定をJSON形式でエクスポート可能
- エクスポートしたファイルから設定を復元可能
- 設定の共有やバックアップに使用

### パフォーマンス考慮

- 設定はアプリケーション起動時に一度読み込み
- メモリ上にキャッシュ
- 変更時のみDBに保存
- Reactコンテキストで全体に提供

### テーマの適用

- `AUTO` の場合はシステムの設定を検知（`prefers-color-scheme`）
- `LIGHT` または `DARK` の場合は指定されたテーマを適用
- テーマ変更は即座にCSSクラスを切り替え

### アクセシビリティ

- フォントサイズは視認性を考慮
- テーマは適切なコントラスト比を確保
- 行高は読みやすさを優先
