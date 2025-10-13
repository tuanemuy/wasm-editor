import { createContext, useContext } from "react";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import type { Context } from "@/core/application/context";
import type { UnitOfWorkProvider } from "@/core/application/unitOfWork";

export type Container = Context;

export const ContainerContext = createContext<Container>({} as Container);

export const useContainer = () => {
  return useContext(ContainerContext);
};

function createContainer(): Context {
  const databasePath = process.env.VITE_APP_DATABASE_PATH;
  if (!databasePath) {
    throw new Error("VITE_APP_DATABASE_PATH is not defined");
  }

  const db = getDatabase(databasePath);
  const unitOfWorkProvider: UnitOfWorkProvider =
    new DrizzleSqliteUnitOfWorkProvider(db);

  const container: Context = {
    unitOfWorkProvider,
  };

  return container;
}

export function ContainerProvider({ children }: { children: React.ReactNode }) {
  const container = createContainer();

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}
