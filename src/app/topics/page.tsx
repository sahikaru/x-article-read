import Link from "next/link";
import { Hash } from "lucide-react";
import { appRouter } from "@/server/trpc/router";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";

const createCaller = createCallerFactory(appRouter);

export default async function TopicsPage() {
  const caller = createCaller(createTRPCContext());
  const allArticles = await caller.articles.list({ limit: 100 });

  // Build tag counts from articles
  const tagCounts = new Map<string, number>();
  for (const article of allArticles.items) {
    // Fetch tags for each article via getBySlug
    const full = await caller.articles.getBySlug({ slug: article.slug });
    if (full?.tags) {
      for (const tag of full.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }

  const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gh-text">Topics</h1>
      <p className="mt-1 text-sm text-gh-text-secondary">
        Browse articles by topic
      </p>

      {sortedTags.length === 0 ? (
        <div className="mt-8 py-12 text-center text-gh-text-secondary">
          No topics yet. Tags will appear once articles are tagged.
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          {sortedTags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/topics/${encodeURIComponent(tag)}`}
              className="flex items-center gap-2 rounded-lg border border-gh-border bg-gh-bg-secondary px-4 py-2.5 text-sm transition-colors hover:border-gh-accent-blue"
            >
              <Hash className="h-4 w-4 text-gh-accent-blue" />
              <span className="font-medium text-gh-text">{tag}</span>
              <span className="rounded-full bg-gh-border px-2 py-0.5 text-xs text-gh-text-secondary">
                {count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
