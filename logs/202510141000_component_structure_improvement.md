# コンポーネントディレクトリ構造の改善提案

**作成日**: 2025-10-14
**対象**: `app/components/` ディレクトリの構造

## 背景

SPAの実装を完了したが、コンポーネントのディレクトリ構成が以下の問題を抱えており、保守性と再利用性に課題がある。

## 現在の構造

```
app/components/
├── ClientOnly.tsx
├── editor/
│   └── TiptapEditor.tsx
├── home/
│   ├── CreateNoteFAB.tsx
│   ├── EmptyState.tsx
│   ├── FilterBadges.tsx
│   ├── HomeHeader.tsx
│   ├── LoadMoreButton.tsx
│   ├── NoteCard.tsx
│   ├── NoteList.tsx
│   ├── SearchBar.tsx
│   ├── SortSelect.tsx
│   ├── TagItem.tsx
│   ├── TagList.tsx
│   └── TagSidebar.tsx
├── memo/
│   ├── BackButton.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── MemoActions.tsx
│   ├── MemoHeader.tsx
│   ├── MemoTitle.tsx
│   └── SaveStatusIndicator.tsx
├── settings/
│   ├── AutoSaveSettingsCard.tsx
│   ├── SettingsActions.tsx
│   ├── SettingsHeader.tsx
│   └── SortSettingsCard.tsx
└── ui/
    └── (shadcn/ui components)
```

## 問題点

### 1. ページとドメインの混在

現在の構造は一貫性のない分類基準を使用している：

- `home/`, `settings/` → **ページ名**で分類
- `memo/` → ドメイン名（`note`）と異なる名前
- `editor/` → **機能名**で分類

### 2. 設計意図との乖離

`CLAUDE.md` には以下の方針が記載されている：

```markdown
- UI Components
    - `app/components/ui/`: Reusable UI components using shadcn/ui
    - `app/components/${domain}/`: Domain-specific components
    - `app/components/**/*`: Other reusable components
```

しかし実装は **ドメイン駆動ではなくページ駆動** になっている。

### 3. Core Architectureとの不整合

Core Architectureでは明確にドメインで分割されている：

```
app/core/domain/
├── note/
│   ├── entity.ts
│   ├── valueObject.ts
│   └── ports/
└── tag/
    ├── entity.ts
    ├── valueObject.ts
    └── ports/
```

プレゼンテーション層もこれに合わせるべきだが、現在は不整合がある。

### 4. コンポーネントの再利用性の低下

具体的な問題例：

- `home/NoteCard.tsx` - ノートカードコンポーネントだが、`note/` ではなく `home/` にある
- `home/TagItem.tsx`, `home/TagList.tsx` - タグコンポーネントだが `tag/` ではなく `home/` にある
- `memo/MemoTitle.tsx` - メモタイトル表示だが、実際は `NoteTitle` であるべき

これらのコンポーネントを別のページで使いたい場合に、配置場所が直感的でない。

### 5. コンポーネントの発見性の低下

開発者が以下のような疑問を持つ：

- 「ノートカードを使いたい」 → どこにある？ `home/`? `memo/`? `note/`?
- 「タグ関連のコンポーネントを探したい」 → `home/` を見る必要がある
- 「共通のヘッダーコンポーネント」 → 各ページディレクトリに分散している

## 改善案

### 提案する構造

ドメイン駆動設計の原則に従い、以下の構造を提案する：

```
app/components/
├── common/
│   ├── ClientOnly.tsx
│   ├── EmptyState.tsx
│   ├── LoadMoreButton.tsx
│   └── SearchBar.tsx
├── editor/
│   └── TiptapEditor.tsx
├── layout/
│   ├── BackButton.tsx
│   ├── HomeHeader.tsx
│   ├── MemoHeader.tsx
│   └── SettingsHeader.tsx
├── note/
│   ├── CreateNoteFAB.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── FilterBadges.tsx
│   ├── NoteActions.tsx
│   ├── NoteCard.tsx
│   ├── NoteList.tsx
│   ├── NoteTitle.tsx
│   ├── SaveStatusIndicator.tsx
│   └── SortSelect.tsx
├── settings/
│   ├── AutoSaveSettingsCard.tsx
│   ├── SettingsActions.tsx
│   └── SortSettingsCard.tsx
├── tag/
│   ├── TagItem.tsx
│   ├── TagList.tsx
│   └── TagSidebar.tsx
└── ui/
    └── (shadcn/ui components)
```

### ディレクトリの役割

| ディレクトリ | 役割 | 例 |
|------------|------|-----|
| `common/` | ページやドメインに依存しない汎用コンポーネント | EmptyState, LoadMoreButton |
| `editor/` | エディター機能に特化したコンポーネント | TiptapEditor |
| `layout/` | ページレイアウトやナビゲーション関連 | Header, BackButton |
| `note/` | ノート（メモ）ドメインのコンポーネント | NoteCard, NoteList, NoteActions |
| `settings/` | 設定ドメインのコンポーネント | SettingsCard, SettingsActions |
| `tag/` | タグドメインのコンポーネント | TagItem, TagList, TagSidebar |
| `ui/` | 基本UIコンポーネント（shadcn/ui） | Button, Card, Dialog |

### 移行マッピング

| 現在のパス | 新しいパス | 理由 |
|-----------|-----------|------|
| `home/CreateNoteFAB.tsx` | `note/CreateNoteFAB.tsx` | ノート作成アクション |
| `home/EmptyState.tsx` | `common/EmptyState.tsx` | 汎用コンポーネント |
| `home/FilterBadges.tsx` | `note/FilterBadges.tsx` | ノートフィルター機能 |
| `home/HomeHeader.tsx` | `layout/HomeHeader.tsx` | レイアウトコンポーネント |
| `home/LoadMoreButton.tsx` | `common/LoadMoreButton.tsx` | 汎用コンポーネント |
| `home/NoteCard.tsx` | `note/NoteCard.tsx` | ノート表示 |
| `home/NoteList.tsx` | `note/NoteList.tsx` | ノート一覧表示 |
| `home/SearchBar.tsx` | `common/SearchBar.tsx` | 汎用検索 |
| `home/SortSelect.tsx` | `note/SortSelect.tsx` | ノートソート |
| `home/TagItem.tsx` | `tag/TagItem.tsx` | タグ表示 |
| `home/TagList.tsx` | `tag/TagList.tsx` | タグ一覧表示 |
| `home/TagSidebar.tsx` | `tag/TagSidebar.tsx` | タグサイドバー |
| `memo/BackButton.tsx` | `layout/BackButton.tsx` | ナビゲーション |
| `memo/DeleteConfirmDialog.tsx` | `note/DeleteConfirmDialog.tsx` | ノート削除 |
| `memo/MemoActions.tsx` | `note/NoteActions.tsx` | ノートアクション |
| `memo/MemoHeader.tsx` | `layout/MemoHeader.tsx` | レイアウトコンポーネント |
| `memo/MemoTitle.tsx` | `note/NoteTitle.tsx` | ノートタイトル |
| `memo/SaveStatusIndicator.tsx` | `note/SaveStatusIndicator.tsx` | ノート保存状態 |
| `settings/SettingsHeader.tsx` | `layout/SettingsHeader.tsx` | レイアウトコンポーネント |

### 命名規則の統一

`memo` → `note` に統一する：

- `MemoActions` → `NoteActions`
- `MemoHeader` → レイアウトなので `MemoHeader` のまま（ページ固有のヘッダー）
- `MemoTitle` → `NoteTitle`

## 期待される効果

### 1. 再利用性の向上

- ドメインごとにコンポーネントがまとまり、他のページでも使いやすくなる
- 「ノート関連のコンポーネントがほしい」→ `note/` を見ればOK

### 2. Core Architectureとの一貫性

- ドメイン駆動設計の原則に従った構造
- `app/core/domain/` と `app/components/` の対応が明確

### 3. 保守性の向上

- コンポーネントの配置が予測しやすい
- 新しい開発者がコードベースを理解しやすい

### 4. スケーラビリティの向上

- 新しいドメインを追加する際の方針が明確
- コンポーネントの配置基準が一貫している

## 実装計画

### Phase 1: 新ディレクトリ構造の準備

```bash
mkdir -p app/components/{common,layout,note,tag}
```

### Phase 2: ファイル移動とリネーム

各コンポーネントを新しい構造に移動し、必要に応じてリネームする。

### Phase 3: import文の更新

全ファイルのimport文を新しいパスに更新する。

### Phase 4: 旧ディレクトリの削除

```bash
rm -rf app/components/{home,memo}
```

### Phase 5: 型チェックとリント

```bash
pnpm typecheck
pnpm lint:fix
pnpm format
```

## 参考資料

- `CLAUDE.md` - SPA Architecture セクション
- `spec/pages.md` - ページ構成とコンポーネント設計
- `app/core/domain/` - ドメインモデル定義

## まとめ

現在のページ駆動の構造から、ドメイン駆動の構造に移行することで：

1. Core Architectureとの一貫性が保たれる
2. コンポーネントの再利用性が向上する
3. 新しい開発者がコードベースを理解しやすくなる
4. 長期的な保守性が向上する

この改善を行うことを強く推奨する。
