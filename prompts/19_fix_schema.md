# データベーススキーマを修正する

## 背景

- `spec/requirements.md` に要件を定義した
- `spec/domains/index.md` にドメインを定義した
- `spec/domains/${domain}.md` にドメインモデルの詳細を記載した
- `docs/backend.md` にバックエンドの実装例を記載した
- `src/core/domain/${domain}/` 以下にドメインモデルを実装した
- `src/adapters/drizzlePglite/schema.ts` にデータベーススキーマを定義した

## タスク

- JSON型を使用している箇所を見直し、正規化する
- 必要に応じて設計やドメインモデルの実装を修正する

## 条件

- 基本的には正規化を推奨する
- ページやコンポーネントの構造等、明確な理由がある場合はJSON/JSONB型を使用してもよい
- 設計やドメインモデルを変更する場合は、
    - `spec/domains/${domain}.md` を更新する
    - `logs` 以下に変更履歴を残す
