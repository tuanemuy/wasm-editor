# WASM SQLite データベース接続改善設計書

## 概要

本設計書は、Notionのブログ記事「Notion in the browser: WASM SQLite」から得られた知見を基に、現在のWASM SQLiteデータベース接続アーキテクチャの改善案を提案するものです。

### 参考記事の要点

Notionは以下のアプローチでブラウザでのSQLiteキャッシングを実現:
- **OPFS (Origin Private File System)** を使用したデータ永続化
- **Web Worker** でのSQLite操作（メインスレッドのブロッキング回避）
- **SharedWorker** アーキテクチャによる複数タブ間の整合性管理
- **OPFS SyncAccessHandle Pool VFS** の採用（クロスオリジン分離不要）

結果: ページナビゲーション時間が20%改善

---

## 現状分析

### 現在の実装

| 項目 | 現状 |
|------|------|
| ライブラリ | `@tursodatabase/database-wasm` v0.3.2 |
| 永続化 | OPFS (WALモード) |
| 実行環境 | メインスレッド |
| 複数タブ対応 | なし（各タブが独立した接続） |
| キャッシュ | 単一接続のキャッシュのみ |
| CORS分離 | 開発サーバーで設定済み |

### 現在のアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Tab 1                         │
├─────────────────────────────────────────────────────────────┤
│  React App (Main Thread)                                     │
│       ↓                                                      │
│  DI Container                                                │
│       ↓                                                      │
│  TursoWasm Client (getDatabase)                              │
│       ↓                                                      │
│  @tursodatabase/database-wasm                                │
│       ↓                                                      │
│  OPFS (local.db, local.db-wal, local.db-shm)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Browser Tab 2                         │
├─────────────────────────────────────────────────────────────┤
│  React App (Main Thread)                                     │
│       ↓                                                      │
│  DI Container                                                │
│       ↓                                                      │
│  TursoWasm Client (getDatabase) ← 別の接続                   │
│       ↓                                                      │
│  @tursodatabase/database-wasm                                │
│       ↓                                                      │
│  OPFS (local.db, local.db-wal, local.db-shm) ← 同じファイル │
└─────────────────────────────────────────────────────────────┘
```

### 課題

1. **UIブロッキングリスク**: データベース操作がメインスレッドで実行されるため、重いクエリがUIをブロックする可能性

2. **複数タブ間の整合性問題**:
   - 複数タブが同じOPFSファイルに書き込むことでデータ破損のリスク
   - Notionが経験した「間違ったデータが表示される」問題と同様の潜在的リスク

3. **タブ間同期なし**:
   - Tab Aでの変更がTab Bに反映されない
   - ユーザーが複数タブを開いた場合の一貫性が保証されない

4. **リソース効率**:
   - 各タブがWASMモジュールを個別にロード
   - メモリ使用量の増加

---

## 改善提案

### 提案アーキテクチャ: SharedWorkerベース

Notionの実装を参考に、以下のアーキテクチャを提案:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │    Tab 1     │    │    Tab 2     │    │    Tab 3     │               │
│  │  (Main)      │    │  (Main)      │    │  (Main)      │               │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘               │
│         │                   │                   │                        │
│         │                   │                   │                        │
│         │    ┌──────────────┴───────────────────┤                        │
│         │    │                                  │                        │
│         ▼    ▼                                  ▼                        │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │                    SharedWorker                            │          │
│  │  ┌─────────────────────────────────────────────────────┐  │          │
│  │  │  - アクティブタブの管理                              │  │          │
│  │  │  - クエリのルーティング                              │  │          │
│  │  │  - Web Lock によるタブ検出                           │  │          │
│  │  └─────────────────────────────────────────────────────┘  │          │
│  └───────────────────────────┬───────────────────────────────┘          │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │                 Dedicated Worker (Active Tab)              │          │
│  │  ┌─────────────────────────────────────────────────────┐  │          │
│  │  │  - SQLite 操作の実行                                 │  │          │
│  │  │  - OPFS への読み書き                                 │  │          │
│  │  │  - 単一書き込みポイント                              │  │          │
│  │  └─────────────────────────────────────────────────────┘  │          │
│  └───────────────────────────┬───────────────────────────────┘          │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │                         OPFS                               │          │
│  │            local.db / local.db-wal / local.db-shm         │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### コンポーネント設計

#### 1. SharedWorker (`database-shared-worker.ts`)

役割:
- 全タブからの接続を管理
- アクティブタブの選出と監視
- SQLiteクエリを適切なDedicated Workerにルーティング

```typescript
// app/workers/database-shared-worker.ts

interface TabConnection {
  port: MessagePort;
  tabId: string;
  isActive: boolean;
  workerPort?: MessagePort;
}

interface QueryMessage {
  type: 'query';
  id: string;
  method: 'exec' | 'prepare' | 'get' | 'all';
  sql: string;
  params?: unknown[];
}

interface QueryResult {
  type: 'result';
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

const connections = new Map<string, TabConnection>();
let activeTabId: string | null = null;

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  const tabId = crypto.randomUUID();

  connections.set(tabId, { port, tabId, isActive: false });

  port.onmessage = async (e: MessageEvent) => {
    const message = e.data;

    switch (message.type) {
      case 'register':
        handleRegister(tabId, message.workerPort);
        break;
      case 'query':
        await handleQuery(tabId, message);
        break;
      case 'unregister':
        handleUnregister(tabId);
        break;
    }
  };

  port.postMessage({ type: 'connected', tabId });
};

function handleRegister(tabId: string, workerPort: MessagePort) {
  const connection = connections.get(tabId);
  if (connection) {
    connection.workerPort = workerPort;

    // アクティブタブがなければこのタブをアクティブに
    if (!activeTabId) {
      setActiveTab(tabId);
    }
  }
}

function setActiveTab(tabId: string) {
  // 前のアクティブタブを非アクティブに
  if (activeTabId) {
    const prev = connections.get(activeTabId);
    if (prev) {
      prev.isActive = false;
      prev.port.postMessage({ type: 'deactivated' });
    }
  }

  activeTabId = tabId;
  const connection = connections.get(tabId);
  if (connection) {
    connection.isActive = true;
    connection.port.postMessage({ type: 'activated' });
  }
}

async function handleQuery(fromTabId: string, message: QueryMessage) {
  if (!activeTabId) {
    const connection = connections.get(fromTabId);
    connection?.port.postMessage({
      type: 'result',
      id: message.id,
      success: false,
      error: 'No active database connection'
    });
    return;
  }

  const activeConnection = connections.get(activeTabId);
  if (!activeConnection?.workerPort) {
    return;
  }

  // アクティブタブのWorkerにクエリを転送
  return new Promise<void>((resolve) => {
    const handler = (e: MessageEvent) => {
      if (e.data.id === message.id) {
        activeConnection.workerPort?.removeEventListener('message', handler);
        const fromConnection = connections.get(fromTabId);
        fromConnection?.port.postMessage(e.data);
        resolve();
      }
    };
    activeConnection.workerPort.addEventListener('message', handler);
    activeConnection.workerPort.postMessage(message);
  });
}

function handleUnregister(tabId: string) {
  connections.delete(tabId);

  // アクティブタブが閉じられた場合、新しいアクティブタブを選出
  if (activeTabId === tabId) {
    activeTabId = null;
    const firstConnection = connections.values().next().value;
    if (firstConnection) {
      setActiveTab(firstConnection.tabId);
    }
  }
}
```

#### 2. Dedicated Worker (`database-worker.ts`)

役割:
- SQLite操作の実際の実行
- OPFSへのアクセス
- メインスレッドから分離された処理

```typescript
// app/workers/database-worker.ts

import type { Database } from "@tursodatabase/database-wasm/vite";

let database: Database | null = null;
let isActive = false;

interface WorkerMessage {
  type: 'init' | 'query' | 'activate' | 'deactivate' | 'close';
  id?: string;
  path?: string;
  method?: 'exec' | 'prepare' | 'get' | 'all';
  sql?: string;
  params?: unknown[];
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'init':
      await initDatabase(message.path!);
      break;
    case 'query':
      if (isActive) {
        await executeQuery(message);
      } else {
        self.postMessage({
          type: 'result',
          id: message.id,
          success: false,
          error: 'Worker is not active'
        });
      }
      break;
    case 'activate':
      isActive = true;
      break;
    case 'deactivate':
      isActive = false;
      break;
    case 'close':
      closeDatabase();
      break;
  }
};

async function initDatabase(path: string) {
  const { connect } = await import("@tursodatabase/database-wasm/vite");

  database = await connect(path, { timeout: 1000 });
  await initializeSchema(database);

  self.postMessage({ type: 'initialized' });
}

async function executeQuery(message: WorkerMessage) {
  if (!database) {
    self.postMessage({
      type: 'result',
      id: message.id,
      success: false,
      error: 'Database not initialized'
    });
    return;
  }

  try {
    let result: unknown;

    switch (message.method) {
      case 'exec':
        await database.exec(message.sql!);
        result = null;
        break;
      case 'get':
        result = await database.prepare(message.sql!).get(...(message.params || []));
        break;
      case 'all':
        result = await database.prepare(message.sql!).all(...(message.params || []));
        break;
    }

    self.postMessage({
      type: 'result',
      id: message.id,
      success: true,
      data: result
    });
  } catch (error) {
    self.postMessage({
      type: 'result',
      id: message.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function closeDatabase() {
  if (database) {
    database.close();
    database = null;
  }
}

async function initializeSchema(db: Database) {
  // 既存の initializeDatabase ロジックをここに移動
  // ...
}
```

#### 3. メインスレッドクライアント (`database-client.ts`)

役割:
- SharedWorkerとの通信管理
- Dedicated Workerの初期化
- アプリケーションコードへのAPI提供

```typescript
// app/core/adapters/tursoWasm/database-client.ts

import { wrap, type Remote } from 'comlink';

interface DatabaseClient {
  exec(sql: string): Promise<void>;
  get<T>(sql: string, ...params: unknown[]): Promise<T | undefined>;
  all<T>(sql: string, ...params: unknown[]): Promise<T[]>;
}

let sharedWorker: SharedWorker | null = null;
let dedicatedWorker: Worker | null = null;
let clientPromise: Promise<DatabaseClient> | null = null;

export async function getDatabaseClient(path: string): Promise<DatabaseClient> {
  if (clientPromise) {
    return clientPromise;
  }

  clientPromise = initializeClient(path);
  return clientPromise;
}

async function initializeClient(path: string): Promise<DatabaseClient> {
  // SharedWorker を作成
  sharedWorker = new SharedWorker(
    new URL('../workers/database-shared-worker.ts', import.meta.url),
    { type: 'module', name: 'database-shared' }
  );

  // Dedicated Worker を作成
  dedicatedWorker = new Worker(
    new URL('../workers/database-worker.ts', import.meta.url),
    { type: 'module' }
  );

  // Web Lock を使用してタブの存在を追跡
  const tabId = crypto.randomUUID();
  navigator.locks.request(`db-tab-${tabId}`, { mode: 'exclusive' }, async () => {
    // このロックはタブが閉じられるまで保持される
    return new Promise(() => {}); // 無限に保持
  });

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    sharedWorker!.port.onmessage = (e) => {
      if (e.data.type === 'connected') {
        // SharedWorker に Dedicated Worker のポートを登録
        sharedWorker!.port.postMessage(
          { type: 'register', workerPort: messageChannel.port1 },
          [messageChannel.port1]
        );

        // Dedicated Worker を初期化
        dedicatedWorker!.postMessage({ type: 'init', path });
      } else if (e.data.type === 'activated') {
        dedicatedWorker!.postMessage({ type: 'activate' });
      } else if (e.data.type === 'deactivated') {
        dedicatedWorker!.postMessage({ type: 'deactivate' });
      }
    };

    dedicatedWorker!.onmessage = (e) => {
      if (e.data.type === 'initialized') {
        // クライアントAPIを返す
        resolve(createClientAPI(sharedWorker!.port));
      }
      // クエリ結果は SharedWorker 経由で処理
      messageChannel.port2.postMessage(e.data);
    };

    sharedWorker!.port.start();
  });
}

function createClientAPI(port: MessagePort): DatabaseClient {
  const pendingQueries = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>();

  port.addEventListener('message', (e) => {
    if (e.data.type === 'result') {
      const pending = pendingQueries.get(e.data.id);
      if (pending) {
        pendingQueries.delete(e.data.id);
        if (e.data.success) {
          pending.resolve(e.data.data);
        } else {
          pending.reject(new Error(e.data.error));
        }
      }
    }
  });

  const query = <T>(method: string, sql: string, params?: unknown[]): Promise<T> => {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      pendingQueries.set(id, { resolve: resolve as (v: unknown) => void, reject });
      port.postMessage({ type: 'query', id, method, sql, params });
    });
  };

  return {
    exec: (sql) => query('exec', sql),
    get: (sql, ...params) => query('get', sql, params),
    all: (sql, ...params) => query('all', sql, params),
  };
}

// HMR サポート
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (sharedWorker) {
      sharedWorker.port.postMessage({ type: 'unregister' });
      sharedWorker.port.close();
    }
    if (dedicatedWorker) {
      dedicatedWorker.postMessage({ type: 'close' });
      dedicatedWorker.terminate();
    }
    sharedWorker = null;
    dedicatedWorker = null;
    clientPromise = null;
  });
}
```

---

## 実装フェーズ

### Phase 1: Web Worker への移行（基本的な改善）

**目標**: メインスレッドのブロッキングを解消

**実装内容**:
1. Dedicated Worker の作成
2. SQLite操作をWorkerに移動
3. Comlink を使用したメインスレッドとの通信

**メリット**:
- UIのレスポンシブ性向上
- 重いクエリでもUIがフリーズしない

**リスク**: 低

**推定工数**: 小

### Phase 2: SharedWorker アーキテクチャ

**目標**: 複数タブ間の整合性を保証

**実装内容**:
1. SharedWorker の作成
2. アクティブタブ管理ロジック
3. Web Lock を使用したタブ検出
4. クエリルーティング

**メリット**:
- データ破損リスクの排除
- 全タブで一貫したデータ表示

**リスク**: 中

**推定工数**: 中

### Phase 3: タブ間同期（オプション）

**目標**: リアルタイムでのタブ間データ同期

**実装内容**:
1. BroadcastChannel による変更通知
2. React Query / SWR 等によるキャッシュ無効化
3. オプティミスティック更新

**メリット**:
- 優れたUX
- 複数タブでの一貫した体験

**リスク**: 中

**推定工数**: 中〜大

---

## 技術的考慮事項

### ブラウザサポート

| 機能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| OPFS | ✅ | ✅ | ✅ | ✅ |
| SharedWorker | ✅ | ✅ | ✅ (15.4+) | ✅ |
| Web Locks | ✅ | ✅ | ✅ (15.4+) | ✅ |

### 既存の利点（維持すべき点）

1. **CORS分離ヘッダーは既に設定済み**
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`
   - SharedArrayBuffer が使用可能

2. **Turso WASM には Worker サポートが含まれている**
   - `@tursodatabase/database-wasm` にはworkerビルドが存在

3. **HMRサポートの設計パターン**
   - 既存のHMR対応コードを拡張可能

### 注意点

1. **Comlink の導入**
   - Worker通信を簡素化するライブラリ
   - Notionも使用している
   - `pnpm add comlink`

2. **エラーハンドリング**
   - Worker間通信のエラーを適切に処理
   - 既存のSystemError/DatabaseErrorパターンを維持

3. **デバッグ**
   - Worker内のデバッグは複雑
   - 適切なログ出力の設計が必要

---

## 代替案の検討

### 案A: 現状維持 + 楽観的ロック

**概要**: 複数タブの書き込み競合を楽観的ロックで解決

**Pros**:
- 実装がシンプル
- 既存アーキテクチャを大きく変更しない

**Cons**:
- 根本的な解決にならない
- 競合時のUXが悪化する可能性

### 案B: IndexedDB への移行

**概要**: SQLiteをやめてIndexedDBを使用

**Pros**:
- ネイティブブラウザAPI
- 複数タブからの同時アクセスをサポート

**Cons**:
- SQLiteの柔軟なクエリ機能を失う
- 大規模な書き換えが必要
- 全文検索等の機能が制限される

### 案C: SharedWorkerアーキテクチャ（推奨）

**概要**: Notionと同様のアプローチ

**Pros**:
- 実績のあるアプローチ
- データ整合性を保証
- パフォーマンス向上

**Cons**:
- 実装の複雑さ
- デバッグの難しさ

---

## 結論と推奨事項

### 推奨: Phase 1 から段階的に実装

1. **即座に実施**: Phase 1（Web Worker移行）
   - メインスレッドのブロッキング解消
   - リスクが低く、効果が確実

2. **次のステップ**: Phase 2（SharedWorkerアーキテクチャ）
   - 複数タブ使用のユースケースが増えた場合
   - データ破損の報告があった場合

3. **将来的に検討**: Phase 3（タブ間同期）
   - UX向上の優先度が高まった場合

### 判断基準

以下の場合は優先度を上げてPhase 2まで実装を推奨:
- ユーザーが複数タブを開く使用パターンが一般的
- データの一貫性が重要なアプリケーション
- 書き込み頻度が高い

---

## 参考資料

- [Notion: WASM SQLite in the browser](https://www.notion.com/blog/notion-in-the-browser-wasm-sqlite)
- [SQLite WASM/JS OPFS Documentation](https://sqlite.org/wasm/doc/trunk/persistence.md)
- [Roy Hashimoto's SharedWorker approach](https://github.com/nicolo-ribaudo/nicolo-ribaudo.github.io/discussions/1)
- [Comlink Library](https://github.com/GoogleChromeLabs/comlink)
- [OPFS SyncAccessHandle Pool VFS](https://nicolo-ribaudo.github.io/nicolo-ribaudo.github.io/)
- [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
