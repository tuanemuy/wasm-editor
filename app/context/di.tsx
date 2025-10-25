import { createContext, useContext } from "react";
import { Spinner } from "@/components/ui/spinner";
import { BrowserExportPort } from "@/core/adapters/browser/exportPort";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractorPort } from "@/core/adapters/browser/tagExtractorPort";
import type { Database } from "@/core/adapters/tursoWasm/client";
import { TursoWasmNoteQueryService } from "@/core/adapters/tursoWasm/noteQueryService";
import { TursoWasmTagQueryService } from "@/core/adapters/tursoWasm/tagQueryService";
import { TursoWasmUnitOfWorkProvider } from "@/core/adapters/tursoWasm/unitOfWork";
import type { Container } from "@/core/application/container";
import { useDatabase } from "@/hooks/useDatabase";

const DIContainer = createContext<Container>({} as Container);

export function DIContainerProvider(props: {
  databasePath: string;
  children: React.ReactNode;
}) {
  const database = useDatabase(props.databasePath);

  if (!database) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center w-dvw h-dvh">
        <Spinner className="size-8" />
        <p>Loading database...</p>
      </div>
    );
  }

  const container = createContainer(database);

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

export function createContainer(db: Database): Container {
  const unitOfWorkProvider = new TursoWasmUnitOfWorkProvider(db);
  const noteQueryService = new TursoWasmNoteQueryService(db);
  const tagQueryService = new TursoWasmTagQueryService(db);
  const exportPort = new BrowserExportPort();
  const tagExtractorPort = new BrowserTagExtractorPort();
  const settingsRepository = new BrowserSettingsRepository();

  return {
    unitOfWorkProvider,
    noteQueryService,
    tagQueryService,
    exportPort,
    tagExtractorPort,
    settingsRepository,
  };
}
