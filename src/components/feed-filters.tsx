"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlatformAvatar } from "@/components/platform-avatar";
import { X, ChevronDown, Search, Check } from "lucide-react";

interface Author {
  username: string;
  displayName: string;
  platform?: string;
}

interface FeedFiltersProps {
  interpretationFilter: "all" | "interpreted" | "pending";
  onInterpretationFilterChange: (value: "all" | "interpreted" | "pending") => void;
  sortBy: "date" | "likes" | "views";
  onSortByChange: (value: "date" | "likes" | "views") => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
  availableTags: string[];
  selectedAuthor: string | null;
  onAuthorChange: (username: string | null) => void;
  authors: Author[];
}

function AuthorPicker({
  selectedAuthor,
  onAuthorChange,
  authors,
}: {
  selectedAuthor: string | null;
  onAuthorChange: (username: string | null) => void;
  authors: Author[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = authors.filter(
    (a) =>
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase())
  );

  const selected = authors.find((a) => a.username === selectedAuthor);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-md border border-gh-border px-2.5 py-1.5 text-sm transition-colors hover:bg-gh-bg-secondary"
      >
        {selected ? (
          <>
            <PlatformAvatar
              platform={selected.platform ?? "twitter"}
              username={selected.username}
              displayName={selected.displayName}
              size={18}
            />
            <span className="max-w-[120px] truncate text-gh-text">{selected.displayName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAuthorChange(null);
                setOpen(false);
              }}
              className="ml-0.5 rounded p-0.5 text-gh-text-secondary hover:bg-gh-border hover:text-gh-text"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            <span className="text-gh-text-secondary">Author</span>
            <ChevronDown className="h-3.5 w-3.5 text-gh-text-secondary" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-gh-border bg-gh-bg-secondary shadow-lg shadow-black/40">
          {/* Search */}
          <div className="border-b border-gh-border p-2">
            <div className="flex items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-gh-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter authors..."
                className="w-full bg-transparent text-sm text-gh-text placeholder:text-gh-text-secondary focus:outline-none"
              />
            </div>
          </div>

          {/* Author list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gh-text-secondary">
                No authors found
              </div>
            ) : (
              filtered.map((a) => {
                const isSelected = selectedAuthor === a.username;
                return (
                  <button
                    key={a.username}
                    onClick={() => {
                      onAuthorChange(isSelected ? null : a.username);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gh-accent-blue/10"
                  >
                    <PlatformAvatar
                      platform={a.platform ?? "twitter"}
                      username={a.username}
                      displayName={a.displayName}
                      size={24}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-gh-text">{a.displayName}</div>
                      <div className="truncate text-xs text-gh-text-secondary">@{a.username}</div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-gh-accent-blue" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FeedFilters({
  interpretationFilter,
  onInterpretationFilterChange,
  sortBy,
  onSortByChange,
  selectedTag,
  onTagChange,
  availableTags,
  selectedAuthor,
  onAuthorChange,
  authors,
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

        {/* Author picker */}
        <AuthorPicker
          selectedAuthor={selectedAuthor}
          onAuthorChange={onAuthorChange}
          authors={authors}
        />

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
