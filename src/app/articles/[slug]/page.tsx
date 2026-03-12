import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Repeat2, Eye, ExternalLink, ArrowLeft } from "lucide-react";
import { appRouter } from "@/server/trpc/router";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { MdxRenderer } from "@/components/mdx-renderer";
import { InterpretationPanel } from "@/components/interpretation-panel";

const createCaller = createCallerFactory(appRouter);

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const caller = createCaller(createTRPCContext());
  const article = await caller.articles.getBySlug({ slug });

  if (!article) {
    notFound();
  }

  const rawEng = article.engagement;
  const engagement: { likes: number; retweets: number; views: number } | null =
    rawEng && typeof rawEng === "object"
      ? (rawEng as { likes: number; retweets: number; views: number })
      : typeof rawEng === "string"
        ? (() => { try { return JSON.parse(rawEng); } catch { return null; } })()
        : null;
  const date = new Date(article.publishedAt);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gh-text-secondary hover:text-gh-accent-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      {/* Header */}
      <header className="rounded-md border border-gh-border bg-gh-bg-secondary p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gh-border text-sm font-medium">
            {article.authorDisplayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link
              href={`/follows/${article.authorUsername}`}
              className="font-semibold text-gh-text hover:text-gh-accent-blue"
            >
              {article.authorDisplayName}
            </Link>
            <p className="text-sm text-gh-text-secondary">
              @{article.authorUsername}
            </p>
          </div>
          <time
            className="ml-auto text-sm text-gh-text-secondary"
            dateTime={article.publishedAt}
          >
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        <h1 className="mt-4 text-xl font-bold text-gh-text">{article.title}</h1>

        {/* Engagement */}
        {engagement && (
          <div className="mt-3 flex items-center gap-4 text-sm text-gh-text-secondary">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {formatNumber(engagement.likes)}
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="h-4 w-4" />
              {formatNumber(engagement.retweets)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {formatNumber(engagement.views)}
            </span>
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-gh-accent-blue hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View original
            </a>
          </div>
        )}
      </header>

      {/* Content: side-by-side on desktop, stacked on mobile */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Original content */}
        <section className="rounded-md border border-gh-border bg-gh-bg-secondary p-6 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <h2 className="mb-3 text-lg font-semibold text-gh-text">
            Original Content
          </h2>
          {article.mdxContent ? (
            <MdxRenderer source={article.mdxContent} />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-gh-text-secondary">
              {article.originalContent}
            </p>
          )}
        </section>

        {/* Interpretation */}
        <div>
          <InterpretationPanel
            interpretation={article.interpretation}
            articleId={article.id}
          />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/topics/${tag}`}
                  className="rounded-full bg-gh-bg-secondary px-3 py-1 text-xs text-gh-accent-blue hover:bg-gh-border"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
