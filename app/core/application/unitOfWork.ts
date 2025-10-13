// import type { ${Entity}Repository } from "@/core/domain/${domain}/ports/${entity}Repository";

export type Repositories = {
  // ${entity}Repository: ${Entity}Repository;
};

export interface UnitOfWorkProvider {
  run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T>;
}
