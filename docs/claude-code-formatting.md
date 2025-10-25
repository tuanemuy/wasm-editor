# Claude Code フォーマット設定

このドキュメントでは、Claude CodeがPR作成前に自動的にコードをフォーマットするための設定方法を説明します。

## 問題の背景

- PR作成後に`pr-checks`ワークフローでフォーマットチェックが実行される
- Claude CodeなどのGitHub Appsがコードを修正する際、フォーマッターが自動実行されない
- そのため、PR作成後にフォーマットチェックが失敗する可能性がある

## 解決策

### 1. CLAUDE.mdの更新（完了）

`CLAUDE.md`にコミット前のフォーマット実行の指示を追加しました。Claude Codeはこのファイルを読み、コミット前に必ず`pnpm format`を実行するようになります。

### 2. GitHub Actionsワークフローの更新（手動で実施が必要）

`.github/workflows/claude.yml`を以下のように更新することで、Claude Codeがコードを変更した後、自動的にフォーマットを実行できるようになります。

#### 推奨される変更内容

`.github/workflows/claude.yml`の`steps`セクションに、以下のステップを追加してください：

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4
    with:
      fetch-depth: 1

  # Node.jsとpnpmのセットアップを追加
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: "22"

  - name: Setup pnpm
    uses: pnpm/action-setup@v4
    with:
      version: latest

  - name: Install dependencies
    run: pnpm install --frozen-lockfile

  - name: Run Claude Code
    id: claude
    uses: anthropics/claude-code-action@v1
    with:
      claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
      additional_permissions: |
        actions: read

  # Claude Codeが変更を加えた後にフォーマットを実行
  - name: Format code after Claude changes
    if: steps.claude.outputs.changes_made == 'true'
    run: |
      pnpm format
      if [[ -n $(git status -s) ]]; then
        git config user.name "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"
        git add .
        git commit -m "chore: apply code formatting"
        git push
      fi
```

#### 代替案：claude_argsでBashツールを許可

または、`claude_args`を使用して、Claude CodeがBashツールで直接フォーマットコマンドを実行できるようにすることもできます：

```yaml
- name: Run Claude Code
  id: claude
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    additional_permissions: |
      actions: read
    claude_args: '--allowed-tools Bash(pnpm:format)'
```

この場合、Claude Codeは`CLAUDE.md`の指示に従い、コミット前に自動的に`pnpm format`を実行します。

## 検証方法

1. Claude Codeに何らかのコード変更を依頼する
2. Claude Codeがコードを変更した後、フォーマットが自動的に適用されることを確認
3. PR作成後、`pr-checks`ワークフローでフォーマットチェックがパスすることを確認

## 注意事項

- GitHub Appsの権限により、`.github/workflows`ディレクトリ内のファイルは自動的に変更できません
- 上記のワークフロー変更は、リポジトリの管理者が手動で適用する必要があります
- `CLAUDE.md`の更新により、Claude Codeは指示に従ってフォーマットを実行しますが、ワークフローレベルでの保証を追加することを推奨します
