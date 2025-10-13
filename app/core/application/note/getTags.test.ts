import { beforeEach, describe, expect, it } from "vitest";
import { MockTagRepository } from "@/core/adapters/mock/tagRepository";
import type { Tag } from "@/core/domain/note/entity";
import type { TagName } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { getTags } from "./getTags";

describe("getTags", () => {
  let mockTagRepository: MockTagRepository;
  let context: Context;

  beforeEach(async () => {
    mockTagRepository = new MockTagRepository();

    // Create test tags
    const tags: Tag[] = [
      { name: "tag1" as TagName, usageCount: 5 },
      { name: "tag2" as TagName, usageCount: 3 },
      { name: "tag3" as TagName, usageCount: 1 },
    ];

    mockTagRepository.setTags(tags);

    context = {
      tagRepository: mockTagRepository,
    } as unknown as Context;
  });

  it("should get all tags", async () => {
    const result = await getTags(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value)).toBe(true);
    }
  });

  it("should return tags with usage count", async () => {
    const result = await getTags(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(3);
      for (const tag of result.value) {
        expect(tag).toHaveProperty("name");
        expect(tag).toHaveProperty("usageCount");
        expect(typeof tag.usageCount).toBe("number");
      }
    }
  });

  it("should return empty array when no tags exist", async () => {
    mockTagRepository.setTags([]);

    const result = await getTags(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should return RepositoryError when database get fails", async () => {
    mockTagRepository.setShouldFailFindAll(true);

    const result = await getTags(context);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get tags");
    }
  });
});
