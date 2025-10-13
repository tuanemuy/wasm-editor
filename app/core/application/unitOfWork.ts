// import type { ${Entitye}Repository } from "@/core/domain/asset/ports/${entity}Repository";

export type Repositories = {
  // ${entity}Repository: ${Entity}Repository;
};

export interface UnitOfWorkProvider {
  run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T>;
}
