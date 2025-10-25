/**
 * LocalStorage Tag Repository Adapter
 *
 * Implements TagRepository port using browser localStorage API.
 * Stores tags as JSON objects in localStorage.
 */

import {
  NotFoundError,
  NotFoundErrorCode,
  SystemError,
  SystemErrorCode,
} from "@/core/application/error";
import type { Tag } from "@/core/domain/tag/entity";
import type { TagRepository } from "@/core/domain/tag/ports/tagRepository";
import type { TagId, TagName } from "@/core/domain/tag/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";

const TAGS_STORAGE_KEY = "app_tags";
const NOTE_TAG_RELATIONS_STORAGE_KEY = "app_note_tag_relations";

interface TagDataModel {
  id: string;
  name: string;
  created_at: number; // Unix timestamp (seconds)
  updated_at: number; // Unix timestamp (seconds)
}

interface NoteTagRelation {
  note_id: string;
  tag_id: string;
}

export class LocalStorageTagRepository implements TagRepository {
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
   * Save all tags to localStorage
   */
  private saveAllTags(tags: Map<string, TagDataModel>): void {
    try {
      const obj = Object.fromEntries(tags);
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      // Check for quota exceeded error
      if (
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" ||
          error.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        throw new SystemError(
          SystemErrorCode.StorageError,
          "Storage quota exceeded. Please delete some data or clear browser data.",
          error,
        );
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to save tags to localStorage",
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
   * Save all note-tag relations to localStorage
   */
  private saveAllRelations(relations: NoteTagRelation[]): void {
    try {
      localStorage.setItem(
        NOTE_TAG_RELATIONS_STORAGE_KEY,
        JSON.stringify(relations),
      );
    } catch (error) {
      // Check for quota exceeded error
      if (
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" ||
          error.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        throw new SystemError(
          SystemErrorCode.StorageError,
          "Storage quota exceeded. Please delete some data or clear browser data.",
          error,
        );
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to save note-tag relations to localStorage",
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
      createdAt: new Date(data.created_at * 1000),
      updatedAt: new Date(data.updated_at * 1000),
    };
  }

  async save(tag: Tag): Promise<void> {
    try {
      const tags = this.getAllTags();

      tags.set(tag.id, {
        id: tag.id,
        name: tag.name,
        created_at: Math.floor(tag.createdAt.getTime() / 1000),
        updated_at: Math.floor(tag.updatedAt.getTime() / 1000),
      });

      this.saveAllTags(tags);
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to save tag",
        error,
      );
    }
  }

  async findByName(name: TagName): Promise<Tag | null> {
    try {
      const tags = this.getAllTags();

      for (const tag of tags.values()) {
        if (tag.name === name) {
          return this.into(tag);
        }
      }

      return null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find tag by name",
        error,
      );
    }
  }

  async findById(id: TagId): Promise<Tag> {
    try {
      const tags = this.getAllTags();
      const data = tags.get(id);

      if (!data) {
        throw new NotFoundError(
          NotFoundErrorCode.TagNotFound,
          `Tag not found: ${id}`,
        );
      }

      return this.into(data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find tag",
        error,
      );
    }
  }

  async findByIds(ids: TagId[]): Promise<Tag[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const tags = this.getAllTags();
      const result: Tag[] = [];

      for (const id of ids) {
        const data = tags.get(id);
        if (data) {
          result.push(this.into(data));
        }
      }

      return result;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find tags by IDs",
        error,
      );
    }
  }

  async findAll(): Promise<Tag[]> {
    try {
      const tags = this.getAllTags();
      return Array.from(tags.values()).map((data) => this.into(data));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find all tags",
        error,
      );
    }
  }

  async delete(id: TagId): Promise<void> {
    try {
      const tags = this.getAllTags();
      tags.delete(id);
      this.saveAllTags(tags);

      // Also delete related note-tag relations
      const relations = this.getAllRelations();
      const filteredRelations = relations.filter((r) => r.tag_id !== id);
      this.saveAllRelations(filteredRelations);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to delete tag",
        error,
      );
    }
  }

  async deleteMany(ids: TagId[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    try {
      const tags = this.getAllTags();
      const idSet = new Set(ids);

      for (const id of ids) {
        tags.delete(id);
      }

      this.saveAllTags(tags);

      // Also delete related note-tag relations
      const relations = this.getAllRelations();
      const filteredRelations = relations.filter(
        (r) => !idSet.has(createTagId(r.tag_id)),
      );
      this.saveAllRelations(filteredRelations);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to delete tags",
        error,
      );
    }
  }

  async exists(id: TagId): Promise<boolean> {
    try {
      const tags = this.getAllTags();
      return tags.has(id);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to check tag existence",
        error,
      );
    }
  }
}
