import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTags } from "@/core/application/tag/getTags";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { useAppContext } from "@/lib/context";

export interface UseTagsResult {
  tags: TagWithUsage[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Hook for fetching and managing tags list
 */
export function useTags(): UseTagsResult {
  const context = useAppContext();
  const [tags, setTags] = useState<TagWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadTrigger is intentional trigger
  useEffect(() => {
    setLoading(true);
    setError(null);

    getTags(context)
      .then((loadedTags) => {
        setTags(loadedTags);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to load tags:", error);
        setError(error);
        toast.error("Failed to load tags");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [context, reloadTrigger]);

  const reload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  return {
    tags,
    loading,
    error,
    reload,
  };
}
