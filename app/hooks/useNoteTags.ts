import { useEffect, useState } from "react";
import { getTagsByNote } from "@/core/application/tag/getTagsByNote";
import { createNoteId } from "@/core/domain/note/valueObject";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { useAppContext } from "@/lib/context";

export interface UseNoteTagsResult {
  noteTagsMap: Map<string, TagWithUsage[]>;
  loading: boolean;
}

/**
 * Hook for fetching tags for multiple notes in parallel
 */
export function useNoteTags(noteIds: string[]): UseNoteTagsResult {
  const context = useAppContext();
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
          const noteTags = await getTagsByNote(context, {
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
        console.error("Failed to load note tags:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, [context, noteIdsKey, noteIds.length]);

  return {
    noteTagsMap,
    loading,
  };
}
