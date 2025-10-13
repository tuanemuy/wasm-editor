# Database ドメイン更新

## 日時
2025-10-11 21:45

## 変更内容

### 1. DatabaseManager ポートの更新
- `exportToFile` メソッドを削除
- `importFromFile` メソッドを削除
- 理由: データのインポート/エクスポートはDatabaseドメインの責務ではなく、他のドメイン（Asset、Export等）の責務とするため

### 2. FileSystemManager ポートの更新
- `saveFileWithDialog` メソッドの戻り値を `string` から `FilePath` に変更
- `FilePath` 型を `app/core/domain/database/valueObject.ts` に追加

### 3. アプリケーション層の更新
- `app/core/application/database/importDatabase.ts` を削除
- `app/core/application/database/exportDatabase.ts` を削除
- 理由: 仕様書にこれらのユースケースが記載されていないため

## 影響範囲
- `app/core/domain/database/ports/databaseManager.ts`
- `app/core/domain/database/ports/fileSystemManager.ts`
- `app/core/domain/database/valueObject.ts`
- `app/core/application/database/` 配下のユースケース

## テスト実行結果
- 型チェック: 成功
- リンター: 成功（修正箇所なし）

## 備考
- DatabaseドメインはDB接続の管理のみを担当し、データのインポート/エクスポートは別ドメインの責務として分離
- `spec/domains/Database.md` の仕様に合わせて実装を修正
