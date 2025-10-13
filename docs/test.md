# Testing

- Use `pnpm test` for tests
- Use SQLite database for testing (DrizzleSqlite${entity}Repository is available)
- Use `src/core/adapters/mock/${adapter}.ts` to create mock implementations of external services for testing

## Application Service Tests

- Use `src/core/application/${domain}/${usecase}.test.ts` for unit tests of application services
