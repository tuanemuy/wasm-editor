import {
  createTagName,
  createUsageCount,
  generateTagId,
  type TagId,
  type TagName,
  type UsageCount,
} from "./valueObject";

export type Tag = Readonly<{
  id: TagId;
  name: TagName;
  usageCount: UsageCount;
}>;

export type CreateTagParams = {
  name: string;
  usageCount?: number;
};

export function createTag(params: CreateTagParams): Tag {
  return {
    id: generateTagId(),
    name: createTagName(params.name),
    usageCount: createUsageCount(params.usageCount || 0),
  };
}

export function incrementUsageCount(tag: Tag): Tag {
  return {
    ...tag,
    usageCount: createUsageCount(tag.usageCount + 1),
  };
}

export function decrementUsageCount(tag: Tag): Tag {
  return {
    ...tag,
    usageCount: createUsageCount(Math.max(0, tag.usageCount - 1)),
  };
}
