# Asset ドメイン テストコードレビュー

**レビュー日時**: 2025-10-12 09:14
**対象ドメイン**: Asset
**レビュー範囲**: テストコードの設計準拠性と品質

---

## 概要

Asset ドメインの全ユースケースに対するテストコードをレビューしました。
仕様書（`spec/domains/Asset.md`）とテストケース定義（`spec/testcases/asset/*.tsv`）に対する実装の整合性を確認しました。

---

## レビュー対象テストファイル

1. `app/core/application/asset/uploadImage.test.ts` - 15 テストケース
2. `app/core/application/asset/getAsset.test.ts` - 5 テストケース
3. `app/core/application/asset/getAssetsByNoteId.test.ts` - 5 テストケース
4. `app/core/application/asset/deleteAsset.test.ts` - 7 テストケース
5. `app/core/application/asset/getImageUrl.test.ts` - 6 テストケース

**合計**: 38 テストケース

---

## 1. uploadImage.test.ts

### 仕様との整合性

| テストケース（仕様） | 実装状況 | 備考 |
|---|---|---|
| 有効な画像ファイル（PNG）をアップロードできる | ✅ 実装済 | |
| 有効な画像ファイル（JPEG）をアップロードできる | ✅ 実装済 | |
| 有効な画像ファイル（GIF）をアップロードできる | ✅ 実装済 | |
| 有効な画像ファイル（WebP）をアップロードできる | ✅ 実装済 | |
| 有効な画像ファイル（SVG）をアップロードできる | ✅ 実装済 | |
| アップロード時にUUID v7のIDが自動生成される | ✅ 実装済 | |
| アップロード時にファイル名が自動生成される | ✅ 実装済 | pathの検証で代替 |
| アップロード時にcreatedAtが自動設定される | ✅ 実装済 | |
| ファイルがローカルファイルシステムに保存される | ✅ 実装済 | |
| アセットがDBに保存される | ✅ 実装済 | |
| 10MB以下の画像をアップロードできる | ✅ 実装済 | |
| 10MBを超える画像でValidationErrorが返される | ✅ 実装済 | ApplicationErrorでラップ |
| 画像以外のファイルでValidationErrorが返される | ✅ 実装済 | ApplicationErrorでラップ |
| ファイルシステムへの保存に失敗 | ✅ 実装済 | ExternalServiceError → ApplicationError |
| DB保存に失敗 | ✅ 実装済 | RepositoryError → ApplicationError |

**カバレッジ**: 15/15 (100%)

### 品質評価

**良い点**:
- 全ての画像形式（PNG, JPEG, GIF, WebP, SVG）を個別にテスト
- ファイルサイズの境界値テスト（10MB）が適切に実装されている
- エラーハンドリングが網羅的にテストされている
- テストデータのセットアップが適切（beforeEachでテストノートを作成）

**改善の余地**:
1. UUID v7 の形式検証が不十分（line 94-96）
   - 現在: 文字列の存在と長さのみチェック
   - 推奨: UUID v7 の形式（ハイフン位置、バージョンビットなど）を厳密にバリデーション
2. ファイルシステムへの保存確認が間接的（line 121-126）
   - 現在: 成功したかどうかのみ確認
   - 推奨: モックのメソッド呼び出しを検証（例: `expect(mockAssetStorageManager.save).toHaveBeenCalled()`）

---

## 2. getAsset.test.ts

### 仕様との整合性

| テストケース（仕様） | 実装状況 | 備考 |
|---|---|---|
| 有効なIDでアセットを取得できる | ✅ 実装済 | |
| 取得したアセットに正しいプロパティが含まれる | ✅ 実装済 | |
| 存在しないIDでnullが返される | ✅ 実装済 | |
| 無効なID形式でバリデーションエラーが返される | ⚠️ モック制約 | コメントで説明あり |
| DB取得に失敗 | ✅ 実装済 | RepositoryError → ApplicationError |

**カバレッジ**: 4/5 (80%) - 1件はモックの制約により実質的にスキップ

### 品質評価

**良い点**:
- プロパティの存在確認が網羅的（line 50-56）
- nullケースの処理が適切にテストされている
- モックの制約について適切にコメントで説明（line 71-72）

**改善の余地**:
1. バリデーションテストの制約（line 70-79）
   - コメントで制約を明記しているのは良いが、統合テストで補完する必要がある
   - モックを使わない実装レベルのテストを追加検討

---

## 3. getAssetsByNoteId.test.ts

### 仕様との整合性

| テストケース（仕様） | 実装状況 | 備考 |
|---|---|---|
| 有効なノートIDでアセット一覧を取得できる | ✅ 実装済 | |
| 複数のアセットが正しく取得される | ✅ 実装済 | |
| アセットが存在しないノートの場合、空配列が返される | ✅ 実装済 | |
| 無効なノートID形式でバリデーションエラーが返される | ⚠️ モック制約 | コメントで説明あり |
| DB取得に失敗 | ✅ 実装済 | RepositoryError → ApplicationError |

**カバレッジ**: 4/5 (80%) - 1件はモックの制約により実質的にスキップ

### 品質評価

**良い点**:
- 複数アセットの取得を適切にテスト（line 56-64）
- 空配列のケースを明示的にテスト（line 67-74）
- 各アセットのnoteIdが正しいことを確認

**改善の余地**:
1. バリデーションテストの制約（line 77-85）
   - getAsset.test.ts と同様の制約

---

## 4. deleteAsset.test.ts

### 仕様との整合性

| テストケース（仕様） | 実装状況 | 備考 |
|---|---|---|
| 有効なIDでアセットを削除できる | ✅ 実装済 | |
| 削除後、アセットが取得できないことを確認できる | ✅ 実装済 | |
| 削除時にファイルシステムからもファイルが削除される | ✅ 実装済 | |
| 存在しないIDでApplicationErrorが返される | ✅ 実装済 | |
| 無効なID形式でバリデーションエラーが返される | ⚠️ モック制約 | コメントで説明あり |
| ファイルシステムからの削除に失敗 | ✅ 実装済 | ExternalServiceError → ApplicationError |
| DB削除に失敗 | ✅ 実装済 | RepositoryError → ApplicationError |

**カバレッジ**: 6/7 (85.7%) - 1件はモックの制約により実質的にスキップ

### 品質評価

**良い点**:
- 削除後の状態確認が適切（line 50-58）
- ストレージとDBの両方の削除失敗をテスト
- beforeEachでストレージにもファイルを保存（line 33-35）

**改善の余地**:
1. ファイルシステム削除の確認が間接的（line 60-64）
   - uploadImage.test.ts と同様の課題
2. バリデーションテストの制約（line 77-84）
   - 他のテストと同様の制約

---

## 5. getImageUrl.test.ts

### 仕様との整合性

| テストケース（仕様） | 実装状況 | 備考 |
|---|---|---|
| 有効なIDで画像のURLを取得できる | ✅ 実装済 | |
| 取得したURLで画像を表示できる | ✅ 実装済 | data: URLの確認 |
| 存在しないIDでApplicationErrorが返される | ✅ 実装済 | |
| 無効なID形式でバリデーションエラーが返される | ⚠️ モック制約 | コメントで説明あり |
| URLの取得に失敗 | ✅ 実装済 | ExternalServiceError → ApplicationError |
| DB取得に失敗 | ✅ 実装済 | RepositoryError → ApplicationError |

**カバレッジ**: 5/6 (83.3%) - 1件はモックの制約により実質的にスキップ

### 品質評価

**良い点**:
- URLの形式確認が適切（data: URLの確認）
- 表示可能性のテストを含む（line 54-62）
- エラーケースが網羅的

**改善の余地**:
1. バリデーションテストの制約（line 75-82）
   - 他のテストと同様の制約

---

## 全体評価

### 設計準拠性: ⭐⭐⭐⭐⭐ (5/5)

**評価理由**:
- 全てのテストが仕様書（`spec/domains/Asset.md`）に基づいている
- テストケース定義（`spec/testcases/asset/*.tsv`）との対応が明確
- 実装の詳細に依存せず、インターフェース（仕様）に基づいてテストしている
- テストは「何をすべきか」を表現しており、「どう実装されているか」に依存していない

**具体例**:
- uploadImage のテストは、ファイルのアップロード機能の要件（サイズ制限、形式チェック）を検証
- モックを使用することで、実装の詳細から独立したテストを実現
- 各テストケース名が仕様の要件を明確に表現（例: "should upload valid PNG image file"）

### テスト品質: ⭐⭐⭐⭐☆ (4/5)

**良い点**:
1. **網羅性**: 正常系・異常系・境界値を全てカバー（計38テストケース）
2. **独立性**: beforeEach で適切にセットアップ、各テストは独立
3. **可読性**: テスト名が明確で、意図が理解しやすい
4. **保守性**: モックを使用し、外部依存を適切に管理
5. **エラーハンドリング**: 全てのエラーケースをテスト
6. **ドキュメント性**: コメントでモックの制約を適切に説明

**改善点**:
1. ~~UUID v7 の形式バリデーションが不十分~~ → **再評価により不要と判断**（実装の詳細に依存すべきではない）
2. モックメソッドの呼び出し確認が不足
3. バリデーションエラーのテストがモックの制約で実質スキップされている
   - 統合テストまたは実装レベルのテストで補完が必要

---

## 推奨事項

### 1. 短期的な改善（優先度: 中）

#### 1.1 UUID v7 形式の厳密な検証（優先度: 低〜不要）

**再評価**: この改善提案は**不要**と判断します。

**理由**:
1. **テストの責任範囲**: アプリケーション層のテストは、ユースケースのフローが正しく動作することを検証するもの。UUID v7の形式の正確性を保証するのは、UUID生成を担当する関数やライブラリの責任。
2. **実装の詳細への依存を避ける**: 「UUID v7形式の文字列が生成される」という実装の詳細に過度に依存すべきではない。重要なのは「一意なIDが生成され、そのIDでアセットを識別できる」こと。
3. **適切なテストレベル**: UUID v7形式の検証が必要なら、ドメイン層のテスト（Entity生成時のID生成ロジック）やユーティリティのテスト（`generateId()`のような関数の単体テスト）で行うべき。

**現状のテストコード（維持推奨）**:
```typescript
expect(result.value.id).toBeDefined();
expect(typeof result.value.id).toBe("string");
expect(result.value.id.length).toBeGreaterThan(0);
```

**もしUUID形式を検証する場合（ドメイン層で）**:
```typescript
// app/core/domain/asset/generateId.test.ts (例)
describe("generateId", () => {
  it("should generate UUID v7 format", () => {
    const id = generateId();
    const uuidV7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidV7Regex);
  });
});
```

#### 1.2 モックメソッドの呼び出し確認

**現在**:
```typescript
it("should save file to local file system", async () => {
  const file = new File(["test"], "test.png", { type: "image/png" });
  const result = await uploadImage(context, { noteId: testNoteId, file });
  expect(result.isOk()).toBe(true);
});
```

**推奨**:
```typescript
it("should save file to local file system", async () => {
  const file = new File(["test"], "test.png", { type: "image/png" });
  const saveSpy = vi.spyOn(mockAssetStorageManager, 'save');

  const result = await uploadImage(context, { noteId: testNoteId, file });

  expect(result.isOk()).toBe(true);
  expect(saveSpy).toHaveBeenCalledOnce();
  expect(saveSpy).toHaveBeenCalledWith(file, expect.stringContaining('assets/images/'));
});
```

### 2. 中期的な改善（優先度: 低）

#### 2.1 統合テストの追加

バリデーションエラーのテストがモックの制約で実質スキップされているため、実際のアダプター実装を使った統合テストの追加を検討してください。

**提案**:
- `app/core/application/asset/integration/*.test.ts` として統合テストを作成
- 実際の DrizzleSqliteAssetRepository を使用
- 実際のバリデーション動作を確認

#### 2.2 エラータイプの明示とエラー分類の改善

現在、全てのエラーが ApplicationError でラップされています。テストでは元のエラータイプ（ValidationError、ExternalServiceError、RepositoryError）を明示的に確認できると、より詳細なエラーハンドリングの検証が可能になります。

**エラー分類の改善提案**:

##### 提案1: エラーカテゴリ（推奨）

ApplicationError にカテゴリを持たせる方式：

```typescript
type ErrorCategory =
  | "validation"     // バリデーションエラー
  | "not_found"      // リソースが見つからない
  | "conflict"       // リソースの競合
  | "external"       // 外部サービスエラー
  | "repository"     // データベースエラー
  | "internal";      // 内部エラー

class ApplicationError extends AnyError {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly cause?: Error
  ) {
    super(message);
  }
}
```

**メリット**:
- HTTPに依存しない（ドメインロジックの純粋性を保つ）
- UIレイヤーで柔軟にマッピングできる（同じエラーでもコンテキストで異なるHTTPステータスに変換可能）
- テストでエラータイプを識別しやすい
- ログやモニタリングでエラー分類しやすい

**UIレイヤーでのマッピング例**:
```typescript
function mapErrorToHttpStatus(error: ApplicationError): number {
  switch (error.category) {
    case "validation": return 400;
    case "not_found": return 404;
    case "conflict": return 409;
    case "external": return 502;
    case "repository": return 503;
    case "internal": return 500;
  }
}
```

##### 提案2: HTTPステータスコード

ApplicationError に直接HTTPステータスコードを持たせる方式：

```typescript
class ApplicationError extends AnyError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly cause?: Error
  ) {
    super(message);
  }
}
```

**デメリット**:
- HTTPはトランスポート層の関心事であり、アプリケーション層に持ち込むべきではない
- 同じアプリケーションエラーが異なるコンテキストで異なるHTTPステータスコードになる可能性がある
- ドメインロジックがHTTPに依存してしまう（ブラウザ以外での実行を想定する場合は特に問題）

##### 提案3: ドメイン固有エラーコード

独自のエラーコードを定義する方式：

```typescript
class ApplicationError extends AnyError {
  constructor(
    message: string,
    public readonly code: string, // "ASSET_001", "NOTE_002" など
    public readonly cause?: Error
  ) {
    super(message);
  }
}
```

**メリット**:
- ドメインごとにエラーを明確に識別できる
- APIドキュメントでエラーコードを明示できる

**デメリット**:
- エラーコードの管理コストが高い
- コード体系の設計が必要

##### 推奨アプローチ

**提案1（エラーカテゴリ）を推奨**します。理由：
- クリーンアーキテクチャの原則に従い、HTTPへの依存を避けられる
- シンプルで保守しやすい
- テストでエラータイプを容易に識別できる
- UIレイヤーでの柔軟なエラーハンドリングが可能

**実装例**:
```typescript
// app/core/application/asset/uploadImage.ts
export async function uploadImage(
  context: ApplicationContext,
  params: UploadImageParams
): Promise<Result<Asset, ApplicationError>> {
  // バリデーション
  const validationResult = validateImageFile(params.file);
  if (validationResult.isErr()) {
    return err(new ApplicationError(
      validationResult.error.message,
      "validation",
      validationResult.error
    ));
  }

  // 外部サービスエラー
  const saveResult = await context.assetStorageManager.save(params.file, path);
  if (saveResult.isErr()) {
    return err(new ApplicationError(
      "Failed to save asset file",
      "external",
      saveResult.error
    ));
  }

  // ...
}
```

**テストでの使用例**:
```typescript
it("should return validation error for invalid file", async () => {
  const file = new File(["test"], "test.txt", { type: "text/plain" });
  const result = await uploadImage(context, { noteId: testNoteId, file });

  expect(result.isErr()).toBe(true);
  expect(result.error.category).toBe("validation");
});
```

**注**: これはアプリケーション層の設計に関わるため、設計変更が必要な場合があります。ただし、エラー分類の改善はテスト品質の向上だけでなく、UIでのエラーハンドリングやユーザー体験の向上にも寄与します。

---

## 結論

Asset ドメインのテストコードは、**仕様に忠実で高品質**です。

**主要な強み**:
- 仕様書とテストケース定義との完全な整合性
- 実装の詳細に依存しない、仕様ベースのテスト
- 網羅的なカバレッジ（正常系・異常系・境界値）
- 適切なモックの使用による外部依存の管理

**注意すべき制約**:
- バリデーションエラーのテストがモックの制約で制限されている
- 統合テストで補完する必要がある

**総合評価**: **4.5/5.0**

テストは設計に従っており、仕様を表現しています。実装に合わせたテストではなく、要件を検証するテストになっています。
