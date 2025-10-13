# デッドコード削除

日時: 2025-10-12 00:07

## 背景

コードレビュー対応後、仕様に含まれていない余分なメソッドやデッドコードを確認し、削除しました。

## 削除内容

### TursoDatabaseManager（app/core/adapters/tursoDatabaseWasm/databaseManager.ts）

**削除したメソッド**:
1. `getDatabaseInstance()` - インターフェースに定義されていない
2. `serializeDatabase()` - インターフェースに定義されていない
3. `exportToFile()` - インターフェースに定義されていない
4. `importFromFile()` - インターフェースに定義されていない

**理由**:
- DatabaseManagerインターフェース（app/core/domain/database/ports/databaseManager.ts）で定義されているメソッドは以下の5つのみ：
  - `create()`
  - `open()`
  - `close()`
  - `getConnection()`
  - `isOpen()`
- これらのメソッドは実装時に追加されたものだが、インターフェース定義にも仕様書にも含まれていない
- 他の場所で使用されていないことを確認済み

**その他の変更**:
- `open()`メソッドのコメントから`importFromFile`への言及を削除

### AssetFileSystemManager（app/core/adapters/fileSystemAccess/assetStorageManager.ts）

**削除したメソッド**:
1. `setDirectoryHandle()` - インターフェースに定義されていない

**理由**:
- AssetStorageManagerインターフェース（app/core/domain/asset/ports/assetStorageManager.ts）で定義されているメソッドは以下の4つのみ：
  - `save()`
  - `read()`
  - `delete()`
  - `getUrl()`
- `setDirectoryHandle()`メソッドは実装時に追加されたが、実際には使用されていない
- 他の場所で呼び出されていないことを確認済み

**修正（追加変更）**:
- コンストラクタで`directoryHandle`を受け取るように変更
- `private readonly directoryHandle: FileSystemDirectoryHandle`として定義
- これにより、依存性注入パターンに従い、SPA層への依存を回避
- nullチェックのエラーメッセージも不要になり削除

## デッドコード確認結果

### アプリケーション層

**確認項目**:
- spec/usecases.tsvと実装ファイルを照合
- すべてのユースケースが実装されていることを確認
- 余分な実装がないことを確認

**結果**: ✅ 問題なし

### アダプター層

**確認項目**:
- 各ポートインターフェースと実装クラスを照合
- インターフェースに定義されていないメソッドを確認

**結果**:
- TursoDatabaseManager: 4つの余分なメソッドを削除
- AssetFileSystemManager: 1つの余分なメソッドを削除
- ExportFileSystemManager: ✅ 問題なし
- DatabaseFileSystemManager: ✅ 問題なし
- その他のリポジトリ実装: ✅ 問題なし

## コード品質チェック

### 型チェック

```bash
pnpm typecheck
```

結果: ✅ 成功

### リンター

```bash
pnpm lint:fix
```

結果: ✅ 成功（修正なし）

### フォーマッター

```bash
pnpm format
```

結果: ✅ 成功（修正なし）

## まとめ

- 仕様に含まれていない5つのメソッドを削除
- すべてのインターフェースと実装が一致していることを確認
- 型チェック、リンター、フォーマッターすべて成功
- コードベースから不要なコードを除去し、保守性を向上

## 今後の課題

- ~~AssetFileSystemManagerの`directoryHandle`の適切な初期化方法を検討~~ → **完了**: コンストラクタで受け取るように変更
- SPA層の実装時に、File System Access APIの適切な使用方法を設計
- Context作成時にAssetFileSystemManagerのインスタンスを生成する際、適切なdirectoryHandleを渡す
