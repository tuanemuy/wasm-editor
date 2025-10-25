/**
 * LocalStorage Tag Query Service Adapter
 *
 * Implements TagQueryService port using browser localStorage API.
 * Handles complex read-only queries on Tags including usage count aggregation.
 */

import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Tag, TagWithUsage } from "@/core/domain/tag/entity";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";
import { createTagId } from "@/core/domain/tag/valueObject";

const TAGS_STORAGE_KEY = "app_tags";
const NOTE_TAG_RELATIONS_STORAGE_KEY = "app_note_tag_relations";

interface TagDataModel {
  id: string;
  name: string;
  created_at: number; // Unix timestamp (milliseconds)
  updated_at: number; // Unix timestamp (milliseconds)
}

interface NoteTagRelation {
  note_id: string;
  tag_id: string;
}

export class LocalStorageTagQueryService implements TagQueryService {
  /**
   * Get all tags from localStorage
   */
  private getAllTags(): Map<string, TagDataModel> {
    try {
      const data = localStorage.getItem(TAGS_STORAGE_KEY);
      if (!data) {
        return new Map();
      }

      const parsed = JSON.parse(data) as Record<string, TagDataModel>;
      return new Map(Object.entries(parsed));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to read tags from localStorage",
        error,
      );
    }
  }

  /**
   * Get all note-tag relations from localStorage
   */
  private getAllRelations(): NoteTagRelation[] {
    try {
      const data = localStorage.getItem(NOTE_TAG_RELATIONS_STORAGE_KEY);
      if (!data) {
        return [];
      }

      return JSON.parse(data) as NoteTagRelation[];
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to read note-tag relations from localStorage",
        error,
      );
    }
  }

  /**
   * Convert data model to Tag entity
   */
  private into(data: TagDataModel): Tag {
    return {
      id: createTagId(data.id),
      name: data.name as Tag["name"],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async findAllWithUsage(): Promise<TagWithUsage[]> {
    try {
      const tags = this.getAllTags();
      const relations = this.getAllRelations();

      // Calculate usage count for each tag
      const usageCountMap = new Map<string, number>();
      for (const relation of relations) {
        const count = usageCountMap.get(relation.tag_id) || 0;
        usageCountMap.set(relation.tag_id, count + 1);
      }

      // Build result with usage count
      const result: TagWithUsage[] = Array.from(tags.values()).map((tag) => ({
        ...this.into(tag),
        usageCount: usageCountMap.get(tag.id) || 0,
      }));

      // Sort by usage count descending
      result.sort((a, b) => b.usageCount - a.usageCount);

      return result;
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find tags with usage",
        error,
      );
    }
  }

  async findUnused(): Promise<Tag[]> {
    try {
      const tags = this.getAllTags();
      const relations = this.getAllRelations();

      // Get set of used tag IDs
      const usedTagIds = new Set(relations.map((r) => r.tag_id));

      // Filter tags that are not in the used set
      const unusedTags = Array.from(tags.values())
        .filter((tag) => !usedTagIds.has(tag.id))
        .map((tag) => this.into(tag));

      return unusedTags;
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find unused tags",
        error,
      );
    }
  }
}
