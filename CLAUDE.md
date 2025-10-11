# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm lint` - Lint code with Biome
- `pnpm lint:fix` - Lint code with Biome and fix issues
- `pnpm format` - Format code with Biome
- `pnpm format:check` - Check code formatting with Biome
- `pnpm typecheck` - Type check code with tsc
- `pnpm test` - Run tests with Vitest
- `TEST_DOMAIN=${domain(lowercase)} pnpm test:domain` - Run tests with Vitest for a specific domain

## Code Quality

- Run `pnpm typecheck`, `pnpm run lint:fix` and `pnpm run format` after making changes to ensure code quality and consistency.

## Tech Stack

- **Runtime**: Browser
- **Frontend**: React Router v7 Framework mode, Tailwind CSS, shadcn/ui and Tiptap
- **Database**: @tursodatabase/database-wasm with Drizzle ORM
- **Validation**: Zod 4 schemas
- **Error Handling**: neverthrow for Result types

## Core Architecture

Hexagonal architecture with domain-driven design principles:

- **Domain Layer** (`app/core/domain/`): Contains business logic, types, and port interfaces
    - `app/core/domain/${domain}/entity.ts`: Domain entities
    - `app/core/domain/${domain}/valueObject.ts`: Value objects
    - `app/core/domain/${domain}/ports/**.ts`: Port interfaces for external services (repositories, exteranl APIs, etc.)
- **Adapter Layer** (`app/core/adapters/`): Contains concrete implementations for external services
    - `app/core/adapters/${externalServiceProvider}/**.ts`: Adapters for external services like databases, APIs, etc.
- **Application Layer** (`app/core/application/`): Contains use cases and application services
    - `app/core/application/context.ts`: Context type for dependency injection
    - `app/core/application/${domain}/${usecase}.ts`: Application services that orchestrate domain logic. Each service is a function that takes a context object.
    - `app/core/error/domain.ts`: Error types for domain layer
    - `app/core/error/adapter.ts`: Error types for adapter layer
    - `app/core/error/application.ts`: Error types for application layer

### Example Implementation

See `docs/implementation_example.md` for detailed examples of types, ports, adapters, application services and context object.

### Note

Do not use Node API or any server-side libraries in the core architecture. ex. Use File System Access API instead of Node fs module.

## SPA Architecture

React Router v7 application code using:

- TypeScript
- Vite
- React 19
- Reacdt Router v7 Framework mode
- Tailwind CSS v4
- shadcn/ui
- Tiptap

- UI Components
    - `app/components/ui/`: Reusable UI components using shadcn/ui
    - `app/components/${domain}/`: Domain-specific components
    - `app/components/**/*`: Other reusable components
- Pages and Routes
    - `app/routes/`: Route components using React Router v7 Framework mode
- Styles
    - `app/styles/index.css`: Entry point for global styles
- Server Actions

## Error Handling

- All backend functions return `Result<T, E>` or `Promise<Result<T, E>>` types using `neverthrow`
- Each modules has its own error types. Error types should extend a base `AnyError` class (`app/lib/error.ts`)
- Error types are defined in:
    - `app/core/error/domain.ts`: Domain layer errors
    - `app/core/error/adapter.ts`: Adapter layer errors
    - `app/core/error/application.ts`: Application layer errors
