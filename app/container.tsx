import { createContext, useContext } from "react";

// DI container type
export type Container = {};

export const ContainerContext = createContext<Container>({} as Container);

export const useContainer = () => {
  return useContext(ContainerContext);
};

export function ContainerProvider({ children }: { children: React.ReactNode }) {
  const container: Container = {};

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}
