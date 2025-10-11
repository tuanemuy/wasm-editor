# Example Implementation

## Entities example

```typescript
// app/core/domain/post/entity.ts

import * as z from "zod";
import { validate } from "@/lib/validation";
import type { ValidationError } from "@/core/error/domain";
import type { AggregateOperationResult } from "@/core/types";
import {
  type PostId,
  type PostContent,
  type PostStatus,
  generatePostId,
  postIdSchema,
  postContentSchema,
  postStatusSchema
} from "./valueObject";

export type PostBase = Readonly<{
  id: PostId;
  content: PostContent;
  createdAt: Date;
  updatedAt: Date;
}>;
export type DraftPost = PostBase & {
  status: "draft";
};
export type PublishedPost = PostBase & {
  status: "published";
};
export type Post = DraftPost | PublishedPost;

export function reconstructPost(data: {
  id: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Result<Post, ValidationError> {
  return validate(z.object({
    id: postIdSchema,
    content: postContentSchema,
    status: postStatusSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
  }), data);
}

export type CreatePostParams = {
  content: PostContent;
  status: PostStatus;
};

export function createPost(params: CreatePostParams): Result<Post, ValidationError> {
  return validate(z.object({
    content: postContentSchema,
    status: postStatusSchema,
  }), params)
    .map((validated) => {
      const now = new Date(); 
      return {
        id: generatePostId(),
        content: validated.content,
        status: validated.status,
        createdAt: now,
        updatedAt: now,
      } satisfies Post;
    });
}

export function updatePostContent(post: Post, newContent: string): Result<Post, ValidationError> {
  return validate(postContentSchema, newContent)
    .map((validated) => {
      return {
        ...post,
        content: validated,
        updatedAt: new Date(),
      } satisfies Post;
    });
}

// Other methods or entities...
```

## Value Objects example

```typescript
// app/core/domain/post/valueObject.ts

import * as z from "zod";
import { v7 as uuidv7 } from "uuid";

export const postIdSchema = z.uuid().brand<"PostId">();
export type PostId = z.infer<typeof postIdSchema>;

export function generatePostId(): PostId {
  return uuidv7() as PostId;
}

export const postContentSchema = z.string().min(1).max(500);
export type PostContent = z.infer<typeof postContentSchema>;

export const postStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

// Other methods or value objects...

```

## Ports example

```typescript
// app/core/domain/post/ports/postRepository.ts

import type { Result } from "neverthrow";
import type { Pagination } from "@/lib/pagination";
import type { RepositoryError } from "@/core/error/adapter";
import type { Post } from "@/domain/post/entity";
import type { UserId } from "@/domain/user/valueObject";

export interface PostRepository {
  create(post: Post): Promise<Result<Post, RepositoryError>>;
  findByUserId(userId: UserId, pagination: Pagination): Promise<Result<{ items: Post[], count: number }, RepositoryError>>;
  // Other repository methods...
}
```

```typescript
// app/core/domain/file/ports/storageManager.ts

import type { ExternalServiceError } from "@/core/error/adapter";

export interface StorageManager {
  uploadFile(/* Arguments */): Promise<Result<File, ExternalServiceError>>;
  // Other storage management methods...
}
```

## Adapters example

```typescript
// app/core/adapters/drizzleSqlite/postRepository.ts

import { type Result, ok, err } from "neverthrow";
import type { Pagination } from "@/lib/pagination";
import type { RepositoryError } from "@/core/error/adapter";
import { type Post, reconstructPost } from "@/domain/post/entity";
import type { UserId } from "@/domain/user/valueObject";
import type { PostRepository } from "@/domain/post/ports/postRepository";
import type { Executor } from "./database";

export class DrizzleSqlitePostRepository implements PostRepository {
  constructor(
    private readonly executor: Executor) {}

  async create(post: Post): Promise<Result<Post, RepositoryError>> {
    try {
      const result = await this.executor
        .insert(posts)
        .values(post)
        .returning();

      const created = result[0];
      if (!created) {
        return err(new RepositoryError("Failed to create post"));
      }

      return reconstructPost(post).mapErr((error) => {
        return new RepositoryError("Invalid post data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create post", error));
    }
  }

  async listByUserId(userId: UserId, pagination: Pagination): Promise<Result<{ items: Post[], count: number }, RepositoryError>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(posts)
          .where(eq(posts.userId, userId))
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql`count(*)` })
          .from(posts)
          .where(eq(posts.userId, userId)),
      ]);

      return ok({
        items: items
          .map((item) => reconstructPost(item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0].count),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list posts", error));
    }
  }
}
```

## Database schema example

```typescript
// app/core/adapters/drizzleSqlite/schema.ts

import { v7 as uuidv7 } from "uuid";

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    // Other fields...
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
);
```

## Application Service example

```typescript
// app/core/application/post/createPost.ts

import { Result } from "neverthrow";
import { createPost } from "@/domain/post/entity";
import type { PostContent, PostStatus } from "@/domain/post/valueObject";
import type { PostRepository } from "@/domain/post/ports/postRepository";
import type { Context } from "../context";

export type CreatePostInput = {
  content: PostContent;
  status: PostStatus;
};

export async function createPost(
  context: Context,
  input: CreatePostInput
): Promise<Result<Post, RepositoryError>> {
  return createPost(input)
    .andThen((post) => {
      return context.postRepository.create(post)
    })
    /** Or use transaction if needed
    .map((post) => {
      return context.db.transaction(async (tx) => {
        const result = await context.withTransaction(tx).postRepository.create(post);
        if (postResult.isErr()) {
          throw postResult.error;
        }

        // Other operations...

        return result.value; // Or another aggregated result
      });
    })
    */
    .mapErr((error) => {
      return new ApplicationError("Failed to create post", error);
    });
}
```

## Context object example

```typescript
// Context object for specific environment
// ex: app/context.ts

import { getDatabase } from "@/core/adapters/drizzleSqlite/client";

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  // Other environment variables...
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.safeParse(process.env);
if (!env.success) {
  throw new Error(/* Zod errors */);
}

const db = getDatabase(env.data.DATABASE_URL);

export const context = {
  db,
  postRepository: new DrizzleSqlitePostRepository(db),
  storageManager: new S3StorageManager(/* S3 client */),
  withTransaction: (tx: Transaction) => ({
    postRepository: new DrizzleSqlitePostRepository(tx),
  }),
  // Other adapters...
};
```
