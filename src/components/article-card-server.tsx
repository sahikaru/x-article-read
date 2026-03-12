import Link from "next/link";
import { Heart, Repeat2, Eye } from "lucide-react";
import { PlatformAvatar } from "./platform-avatar";
import { PlatformIcon, platformColor } from "./platform-icon";

interface Engagement {
  likes: number;
  retweets: number;
  views: number;
}

interface ArticleCardServerProps {
  article: {
    id: number;
    slug: string;
    title: string;
    authorUsername: string;
    authorDisplayName: string;
    publishedAt: string;
    originalContent: string;
    contentPreview?: string | null;
    interpretation: string | null;
    engagement: unknown;
    platform: string;
  };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function parseEngagement(engagement: unknown): Engagement | null {
  if (!engagement) return null;
  return engagement as Engagement;
}

export function ArticleCardServer({ article }: ArticleCardServerProps) {
  const eng = parseEngagement(article.engagement);
  const date = new Date(article.publishedAt);
  const preview =
    article.contentPreview ??
    article.originalContent.slice(0, 200) +
      (article.originalContent.length > 200 ? "..." : "");

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="block rounded-md border border-gh-border bg-gh-bg-secondary p-4 transition-colors hover:border-gh-accent-blue"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <div className="relative">
              <PlatformAvatar platform={article.platform} username={article.authorUsername} displayName={article.authorDisplayName} size={24} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gh-bg-secondary">
                <PlatformIcon platform={article.platform} className={`h-2.5 w-2.5 ${platformColor(article.platform)}`} />
              </span>
            </div>
            <span className="font-medium text-gh-text">
              {article.authorDisplayName}
            </span>
            <span className="text-gh-text-secondary">
              @{article.authorUsername}
            </span>
            <span className="text-gh-text-secondary">·</span>
            <time className="text-gh-text-secondary" dateTime={article.publishedAt}>
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>

          <h3 className="mt-2 font-semibold text-gh-text">{article.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gh-text-secondary">
            {preview}
          </p>

          <div className="mt-3 flex items-center gap-4 text-xs text-gh-text-secondary">
            {eng && (
              <>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {formatNumber(eng.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <Repeat2 className="h-3.5 w-3.5" />
                  {formatNumber(eng.retweets)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {formatNumber(eng.views)}
                </span>
              </>
            )}
            <span className="ml-auto flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  article.interpretation
                    ? "bg-gh-accent-green"
                    : "bg-gh-accent-orange"
                }`}
              />
              {article.interpretation ? "Interpreted" : "Pending"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
