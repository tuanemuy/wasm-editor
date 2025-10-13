import {
  createDatabaseName,
  createDatabasePath,
  type DatabaseName,
  type DatabasePath,
  nowTimestamp,
  type Timestamp,
} from "./valueObject";

export type Database = Readonly<{
  handle: FileSystemFileHandle;
  name: DatabaseName;
  path: DatabasePath;
  isConnected: boolean;
  lastAccessedAt: Timestamp;
}>;

export type CreateDatabaseParams = {
  handle: FileSystemFileHandle;
  name: string;
  path: string;
};

export function createDatabase(params: CreateDatabaseParams): Database {
  return {
    handle: params.handle,
    name: createDatabaseName(params.name),
    path: createDatabasePath(params.path),
    isConnected: true,
    lastAccessedAt: nowTimestamp(),
  };
}

export function updateLastAccessed(database: Database): Database {
  return {
    ...database,
    lastAccessedAt: nowTimestamp(),
  };
}

export function disconnect(database: Database): Database {
  return {
    ...database,
    isConnected: false,
  };
}
