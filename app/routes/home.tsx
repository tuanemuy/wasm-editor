import { PlusIcon, SearchIcon, SettingsIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { combinedSearch } from "@/core/application/note/combinedSearch";
import { createNote } from "@/core/application/note/createNote";
import { getNotes } from "@/core/application/note/getNotes";
import { getTags } from "@/core/application/tag/getTags";
import { getTagsByNote } from "@/core/application/tag/getTagsByNote";
import type { Note } from "@/core/domain/note/entity";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { createTagId } from "@/core/domain/tag/valueObject";
import { useAppContext } from "@/lib/context";
import { createPagination } from "@/lib/pagination";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "WASM Editor - Home" },
    { name: "description", content: "Your notes, all in one place" },
  ];
}

type SortOption =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "updated_asc";

export default function Home() {
  const context = useAppContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<TagWithUsage[]>([]);
  const [noteTags, setNoteTags] = useState<Map<string, TagWithUsage[]>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Parse URL params
  const searchQuery = searchParams.get("q") || "";
  const sortOption = (searchParams.get("sort") || "created_desc") as SortOption;
  const tagFilters = searchParams.get("tags")?.split(",").filter(Boolean) || [];

  // Load tags
  useEffect(() => {
    getTags(context)
      .then(setTags)
      .catch((error) => {
        console.error("Failed to load tags:", error);
        toast.error("Failed to load tags");
      });
  }, [context]);

  // Load notes
  // biome-ignore lint/correctness/useExhaustiveDependencies: tagFilters is correctly spread into dependencies
  useEffect(() => {
    setLoading(true);
    const orderBy = sortOption.startsWith("created")
      ? "created_at"
      : "updated_at";
    const order = sortOption.endsWith("desc") ? "desc" : "asc";

    const loadNotes = async () => {
      try {
        const result =
          searchQuery || tagFilters.length > 0
            ? await combinedSearch(context, {
                query: searchQuery,
                tagIds: tagFilters.map((id) => createTagId(id)),
                pagination: createPagination(page, 20),
                orderBy,
                order,
              })
            : await getNotes(context, {
                pagination: createPagination(page, 20),
                orderBy,
                order,
              });

        if (page === 1) {
          setNotes(result.items);
        } else {
          setNotes((prev) => [...prev, ...result.items]);
        }
        setHasMore(result.items.length === 20);

        // Load tags for all notes in parallel
        const tagMap = new Map<string, TagWithUsage[]>();
        const tagPromises = result.items.map(async (note) => {
          const noteTags = await getTagsByNote(context, { noteId: note.id });
          const tagsWithUsage = noteTags.map((tag) => {
            // Use default usageCount of 1 to avoid dependency on tags state
            return { ...tag, usageCount: 1 };
          });
          return [note.id, tagsWithUsage] as const;
        });

        const tagResults = await Promise.all(tagPromises);
        for (const [noteId, noteTags] of tagResults) {
          tagMap.set(noteId, noteTags);
        }
        setNoteTags(tagMap);
      } catch (error) {
        console.error("Failed to load notes:", error);
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [context, page, searchQuery, sortOption, ...tagFilters]);

  // Reset page when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally triggering on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortOption, ...tagFilters]);

  // Create new note
  const handleCreateNote = async () => {
    if (creating) return;
    setCreating(true);

    try {
      const note = await createNote(context, { content: "" });
      navigate(`/memos/${note.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("Failed to create note");
      setCreating(false);
    }
  };

  // Update search query
  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  // Update sort option
  const handleSortChange = (value: SortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    setSearchParams(params);
  };

  // Toggle tag filter
  const handleTagClick = (tagId: string) => {
    const params = new URLSearchParams(searchParams);
    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];

    if (currentTags.includes(tagId)) {
      const newTags = currentTags.filter((id) => id !== tagId);
      if (newTags.length > 0) {
        params.set("tags", newTags.join(","));
      } else {
        params.delete("tags");
      }
    } else {
      params.set("tags", [...currentTags, tagId].join(","));
    }

    setSearchParams(params);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Extract title from note content
  const extractTitle = (content: string) => {
    const firstLine = content.split("\n")[0];
    const title = firstLine.replace(/^#+\s*/, "").trim();
    return title || "Untitled";
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const hasFilters = searchQuery || tagFilters.length > 0;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40 flex flex-col">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Tags</h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => handleTagClick(tag.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    tagFilters.includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>#{tag.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tag.usageCount}
                    </Badge>
                  </div>
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No tags yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Notes</h1>
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Newest first</SelectItem>
                  <SelectItem value="created_asc">Oldest first</SelectItem>
                  <SelectItem value="updated_desc">Recently updated</SelectItem>
                  <SelectItem value="updated_asc">
                    Least recently updated
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          {hasFilters && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {searchQuery && (
                <Badge variant="secondary">Search: {searchQuery}</Badge>
              )}
              {tagFilters.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="secondary">
                    #{tag.name}
                  </Badge>
                ) : null;
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 px-2"
              >
                <XIcon className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </header>

        {/* Notes list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
            {loading && page === 1 ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {hasFilters ? "No notes found" : "No notes yet"}
                </p>
                {!hasFilters && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Click the + button to create your first note
                  </p>
                )}
              </div>
            ) : (
              <>
                {notes.map((note) => {
                  const noteTagsList = noteTags.get(note.id) || [];
                  return (
                    <Link key={note.id} to={`/memos/${note.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">
                            {extractTitle(note.content)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {note.content || "Empty note"}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {noteTagsList.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  #{tag.name}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(
                                sortOption.startsWith("updated")
                                  ? note.updatedAt
                                  : note.createdAt,
                              )}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                    >
                      {loading ? <Spinner className="h-4 w-4" /> : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* FAB */}
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          onClick={handleCreateNote}
          disabled={creating}
        >
          {creating ? (
            <Spinner className="h-6 w-6" />
          ) : (
            <PlusIcon className="h-6 w-6" />
          )}
        </Button>
      </main>
    </div>
  );
}
