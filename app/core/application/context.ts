import type { UnitOfWorkProvider } from "./unitOfWork";

/**
 * Application context containing all dependencies
 */
export type Context = {
  unitOfWorkProvider: UnitOfWorkProvider;
};
