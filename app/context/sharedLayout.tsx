import { AnimatePresence, LayoutGroup } from "motion/react";
import { createContext, useContext } from "react";

interface SharedLayoutProviderProps {
  children: React.ReactNode;
}

const SharedLayoutContext = createContext<null>(null);

export function SharedLayoutProvider({ children }: SharedLayoutProviderProps) {
  return (
    <SharedLayoutContext.Provider value={null}>
      <LayoutGroup>
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </LayoutGroup>
    </SharedLayoutContext.Provider>
  );
}

export const useSharedLayout = () => {
  const context = useContext(SharedLayoutContext);
  if (context === undefined) {
    throw new Error(
      "useSharedLayout must be used within a SharedLayoutProvider",
    );
  }
  return context;
};
