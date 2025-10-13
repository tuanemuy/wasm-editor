import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Context } from "@/core/application/context";

const AppContext = createContext<Context | null>(null);

/**
 * Provider component that initializes and provides the application context
 */
export function AppContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Context | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR evaluation
    import("./di")
      .then((module) => module.createContext())
      .then((ctx) => setContext(ctx))
      .catch((err) => setError(err));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Failed to initialize application
          </h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}

/**
 * Hook to access the application context
 */
export function useAppContext(): Context {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
}
