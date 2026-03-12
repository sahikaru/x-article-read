"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FeedFiltersProps {
  interpretationFilter: "all" | "interpreted" | "pending";
  onInterpretationFilterChange: (value: "all" | "interpreted" | "pending") => void;
  sortBy: "date" | "likes" | "views";
  onSortByChange: (value: "date" | "likes" | "views") => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
  availableTags: string[];
}

export function FeedFilters({
  interpretationFilter,
  onInterpretationFilterChange,
  sortBy,
  onSortByChange,
  selectedTag,
  onTagChange,
  availableTags,
}: FeedFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Interpretation filter */}
        <div className="flex items-center gap-1 rounded-md border border-gh-border p-0.5">
          {(["all", "interpreted", "pending"] as const).map((value) => (
            <Button
              key={value}
              variant={interpretationFilter === value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onInterpretationFilterChange(value)}
              className="capitalize"
            >
              {value}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1 rounded-md border border-gh-border p-0.5">
          {(["date", "likes", "views"] as const).map((value) => (
            <Button
              key={value}
              variant={sortBy === value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSortByChange(value)}
              className="capitalize"
            >
              {value}
            </Button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gh-text-secondary">Tags:</span>
          {selectedTag && (
            <button
              onClick={() => onTagChange(null)}
              className="inline-flex items-center gap-1 rounded-full bg-gh-accent-blue/20 px-2.5 py-0.5 text-xs text-gh-accent-blue"
            >
              {selectedTag}
              <X className="h-3 w-3" />
            </button>
          )}
          {!selectedTag &&
            availableTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => onTagChange(tag)}
                className="rounded-full bg-gh-bg px-2.5 py-0.5 text-xs text-gh-text-secondary hover:bg-gh-border hover:text-gh-text"
              >
                {tag}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
