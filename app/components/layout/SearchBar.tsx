import { SearchIcon } from "lucide-react";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/context/search";
import { cn } from "@/lib/utils";

export type SearchBarProps = React.ComponentProps<"div"> & {
  placeholder?: string;
};

export function SearchBar({
  placeholder = "Search notes...",
  className,
  ...props
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, changeQuery } = useSearch();

  return (
    <div {...props} className={cn("relative max-w-4xl", className)}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        name="search"
        placeholder={placeholder}
        value={query}
        onChange={(event) => changeQuery(event.target.value)}
        className="pl-9"
      />
    </div>
  );
}
