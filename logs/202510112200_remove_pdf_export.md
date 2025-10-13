# PDFエクスポート機能の削除

## 日時
2025-10-11 22:00

## 変更内容

### 1. 仕様ファイルの更新

#### spec/domains/Export.md
- 概要からPDFエクスポートの言及を削除
- 責務からPDFエクスポートを削除
- `ExportFormat` 値オブジェクトを削除
- `PdfExporter` ポートインターフェースを削除
- `exportNoteAsPDF` ユースケースを削除
- `exportNotesAsPDF` ユースケースを削除
- 実装のポイントからPDFエクスポートのセクションを削除

#### spec/domains/index.md
- Exportドメインの責務からPDFエクスポートを削除
- 主要なビジネスロジックからPDFファイル変換を削除
- 関連する機能要件を FR-EXPORT-001〜003 に更新

#### spec/pages.md
- ホーム画面のエクスポート（一括）から `exportMemosAsPDF` を削除
- メモ詳細画面のエクスポートから `exportMemoAsPDF` を削除

#### spec/requirements.md
- 8.2 PDFエクスポートセクション全体を削除（FR-EXPORT-004〜007）

#### spec/usecases.tsv
- `exportNoteAsPDF` ユースケースを削除
- `exportNotesAsPDF` ユースケースを削除

### 2. テストケースファイルの削除
- `spec/testcases/export/exportNoteAsPDF.tsv`
- `spec/testcases/export/exportNotesAsPDF.tsv`

### 3. 実装ファイルの削除

#### ドメイン層
- `app/core/domain/export/ports/pdfExporter.ts`

#### アプリケーション層
- `app/core/application/export/exportNoteAsPDF.ts`
- `app/core/application/export/exportNotesAsPDF.ts`

#### アダプター層
- `app/core/adapters/pdfExporter/` ディレクトリ全体

### 4. コードの更新

#### app/core/domain/export/valueObject.ts
- `exportFormatSchema` を `z.enum(["markdown"])` に変更（"pdf" を削除）

#### app/core/application/context.ts
- `PdfExporter` インポートを削除
- `Context` 型から `pdfExporter: PdfExporter` プロパティを削除

## 影響範囲
- Exportドメインの仕様と実装
- アプリケーションコンテキスト
- ユースケース一覧

## テスト実行結果
- 型チェック: 成功
- リンター: 成功（修正箇所なし）

## 備考
- PDFエクスポート機能は不要と判断され、Markdownエクスポートのみをサポートすることになった
- 将来的にPDFエクスポートが必要になった場合は、この変更ログを参照して再実装可能
