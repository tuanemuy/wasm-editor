import type { ReactNode } from "react";

export interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({
  text,
  query,
  className,
}: HighlightedTextProps): ReactNode {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  try {
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    // Filter out empty strings and create unique keys
    const elements: ReactNode[] = [];
    let keyCounter = 0;

    for (const part of parts) {
      if (!part) continue;

      const isMatch = regex.test(part);
      regex.lastIndex = 0;

      if (isMatch) {
        elements.push(
          <mark
            key={`mark-${keyCounter++}`}
            className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
          >
            {part}
          </mark>,
        );
      } else {
        elements.push(<span key={`span-${keyCounter++}`}>{part}</span>);
      }
    }

    return <span className={className}>{elements}</span>;
  } catch {
    // If regex fails, just return the original text without highlighting
    return <span className={className}>{text}</span>;
  }
}
