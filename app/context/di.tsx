import { createContext, useContext, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { Container } from "@/core/application/container";
import { createLocalStorageContainer, createTursoWasmContainer } from "@/di";
import { useDatabase } from "@/hooks/useDatabase";

const DIContainer = createContext<Container | null>(null);

// Storage adapter type
type StorageAdapter = "localStorage" | "tursoWasm";

// Get storage adapter from environment variable
// Defaults to localStorage for development convenience
const VALID_ADAPTERS = ["localStorage", "tursoWasm"] as const;
const envAdapter = import.meta.env.VITE_STORAGE_ADAPTER as string | undefined;
const STORAGE_ADAPTER: StorageAdapter = (() => {
  if (!envAdapter) {
    return "localStorage";
  }
  if (!VALID_ADAPTERS.includes(envAdapter as StorageAdapter)) {
    throw new Error(
      `Invalid VITE_STORAGE_ADAPTER: "${envAdapter}". Must be one of: ${VALID_ADAPTERS.join(", ")}`,
    );
  }
  return envAdapter as StorageAdapter;
})();

export function DIContainerProvider(props: {
  databasePath?: string;
  children: React.ReactNode;
}) {
  const [container, setContainer] = useState<Container | null>(null);
  const database = useDatabase(props.databasePath || "");

  useEffect(() => {
    if (STORAGE_ADAPTER === "localStorage") {
      // For localStorage, we don't need to wait for database
      setContainer(createLocalStorageContainer());
    } else if (STORAGE_ADAPTER === "tursoWasm" && database) {
      // For tursoWasm, we need to wait for database to load
      setContainer(createTursoWasmContainer(database));
    }
  }, [database]);

  if (!container) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center w-dvw h-dvh">
        <Spinner className="size-8" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <DIContainer.Provider value={container}>
      {props.children}
    </DIContainer.Provider>
  );
}

export function useDIContainer() {
  const context = useContext(DIContainer);
  if (!context) {
    throw new Error("useDIContainer must be used within DIContainerProvider");
  }
  return context;
}
