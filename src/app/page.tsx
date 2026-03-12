"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ArticleCard } from "@/components/article-card";
import { FeedFilters } from "@/components/feed-filters";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  const [interpretationFilter, setInterpretationFilter] = useState<
    "all" | "interpreted" | "pending"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "likes" | "views">("date");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const hasInterpretation =
    interpretationFilter === "all"
      ? undefined
      : interpretationFilter === "interpreted";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.articles.list.useInfiniteQuery(
      { limit: 20, hasInterpretation, tag: selectedTag ?? undefined },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const articles = data?.pages.flatMap((p) => p.items) ?? [];

  const tagsQuery = trpc.articles.listTags.useQuery();
  const availableTags = tagsQuery.data ?? [];

  // Client-side sort by engagement
  const sorted = [...articles].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }
    const engA = a.engagement as { likes?: number; views?: number } | null;
    const engB = b.engagement as { likes?: number; views?: number } | null;
    if (sortBy === "likes") return (engB?.likes ?? 0) - (engA?.likes ?? 0);
    return (engB?.views ?? 0) - (engA?.views ?? 0);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gh-text">Feed</h1>
      <p className="mt-1 text-sm text-gh-text-secondary">
        Latest tweets and articles
      </p>

      <div className="mt-4">
        <FeedFilters
          interpretationFilter={interpretationFilter}
          onInterpretationFilterChange={setInterpretationFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          availableTags={availableTags}
        />
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && (
          <div className="py-12 text-center text-gh-text-secondary">
            Loading articles...
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="py-12 text-center text-gh-text-secondary">
            No articles yet. Fetch some tweets to get started.
          </div>
        )}

        {sorted.map((article) => (
          <ArticleCard
            key={article.id}
            slug={article.slug}
            title={article.title}
            authorUsername={article.authorUsername}
            authorDisplayName={article.authorDisplayName}
            publishedAt={article.publishedAt}
            originalContent={article.originalContent}
            contentPreview={article.contentPreview}
            interpretation={article.interpretation}
            engagement={article.engagement as { likes: number; retweets: number; views: number } | null}
            platform={article.platform}
          />
        ))}

        {hasNextPage && (
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
