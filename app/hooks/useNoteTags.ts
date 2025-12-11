import { useEffect, useState } from "react";
import type { Container } from "@/core/application/container";
import { getTagsByNote } from "@/core/application/tag/getTagsByNote";
import { createNoteId } from "@/core/domain/note/valueObject";
import type { TagWithUsage } from "@/core/domain/tag/entity";

export interface UseNoteTagsResult {
  noteTagsMap: Map<string, TagWithUsage[]>;
  loading: boolean;
}

/**
 * Hook for fetching tags for multiple notes in parallel
 */
export function useNoteTags(
  container: Container,
  noteIds: string[],
): UseNoteTagsResult {
  const [noteTagsMap, setNoteTagsMap] = useState<Map<string, TagWithUsage[]>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  // Serialize noteIds to avoid dependency array issues
  const noteIdsKey = noteIds.join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: Using serialized noteIdsKey to avoid array size changes
  useEffect(() => {
    if (noteIds.length === 0) {
      setNoteTagsMap(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);

    const loadTags = async () => {
      try {
        const tagMap = new Map<string, TagWithUsage[]>();

        // Load tags for all notes in parallel
        const tagPromises = noteIds.map(async (noteId) => {
          const noteTags = await getTagsByNote(container, {
            noteId: createNoteId(noteId),
          });
          // Use default usageCount of 1 to avoid dependency on tags state
          const tagsWithUsage = noteTags.map((tag) => ({
            ...tag,
            usageCount: 1,
          }));
          return [noteId, tagsWithUsage] as const;
        });

        const tagResults = await Promise.all(tagPromises);
        for (const [noteId, noteTags] of tagResults) {
          tagMap.set(noteId, noteTags);
        }

        setNoteTagsMap(tagMap);
      } catch (error) {
        // Silent failure - tags are supplementary information
        // and their absence doesn't prevent core functionality
        if (import.meta.env.DEV) {
          console.error("Failed to load tags for notes:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, [container, noteIdsKey, noteIds.length]);

  return {
    noteTagsMap,
    loading,
  };
}
