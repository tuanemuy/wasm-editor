/**
 * DI Container React Context
 *
 * - ContainerProvider: Provider component for container access
 * - useContainer(): Hook to access container inside React components
 */

import { createContext, useContext, useEffect, useState } from "react";
import type { Container } from "@/core/application/container";
import { getContainer, getContainerSync } from "@/di";

const ContainerContext = createContext<Container | null>(null);

type ContainerProviderProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ContainerProvider({
  children,
  fallback = null,
}: ContainerProviderProps) {
  const [container, setContainer] = useState<Container | null>(
    getContainerSync(),
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (container) return;

    let cancelled = false;
    getContainer()
      .then((c) => {
        if (!cancelled) setContainer(c);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });

    return () => {
      cancelled = true;
    };
  }, [container]);

  if (error) {
    throw error;
  }

  if (!container) {
    return <>{fallback}</>;
  }

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}

export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error("useContainer must be used within ContainerProvider");
  }
  return container;
}
