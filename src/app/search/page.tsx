"use client";

import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ArticleCard } from "@/components/article-card";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const { data, isLoading } = trpc.search.search.useQuery(
    { query, limit: 20 },
    { enabled: query.length > 0 }
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gh-text">Search</h1>
      <p className="mt-1 text-sm text-gh-text-secondary">
        Search articles and tweets
      </p>

      <div className="mt-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gh-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, content, or interpretation..."
            className="w-full rounded-md border border-gh-border bg-gh-bg-secondary py-2.5 pl-10 pr-4 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {query.length === 0 && (
          <div className="py-12 text-center text-gh-text-secondary">
            Enter a search term to find articles.
          </div>
        )}

        {isLoading && query.length > 0 && (
          <div className="py-12 text-center text-gh-text-secondary">
            Searching...
          </div>
        )}

        {data && data.results.length === 0 && (
          <div className="py-12 text-center text-gh-text-secondary">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}

        {data?.results.map((article) => {
          const a = article as Record<string, unknown>;
          return (
            <ArticleCard
              key={article.id}
              slug={article.slug}
              title={article.title}
              authorUsername={article.authorUsername}
              authorDisplayName={article.authorDisplayName}
              publishedAt={article.publishedAt}
              originalContent={(a.originalContent as string) ?? ""}
              interpretation={article.interpretation}
              engagement={(a.engagement as { likes: number; retweets: number; views: number }) ?? null}
              platform={article.platform}
            />
          );
        })}
      </div>
    </div>
  );
}
