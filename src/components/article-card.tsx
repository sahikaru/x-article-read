"use client";

import Link from "next/link";
import { Heart, Repeat2, Eye } from "lucide-react";
import { PlatformAvatar } from "./platform-avatar";
import { PlatformIcon, platformColor } from "./platform-icon";

interface Engagement {
  likes: number;
  retweets: number;
  views: number;
}

interface ArticleCardProps {
  slug: string;
  title: string;
  authorUsername: string;
  authorDisplayName: string;
  publishedAt: string;
  originalContent: string;
  contentPreview?: string | null;
  interpretation: string | null;
  engagement: Engagement | null;
  platform: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ArticleCard({
  slug,
  title,
  authorUsername,
  authorDisplayName,
  publishedAt,
  originalContent,
  contentPreview,
  interpretation,
  engagement,
  platform,
}: ArticleCardProps) {
  const eng: Engagement | null =
    engagement && typeof engagement === "object"
      ? engagement
      : typeof engagement === "string"
        ? (() => { try { return JSON.parse(engagement); } catch { return null; } })()
        : null;
  const date = new Date(publishedAt);
  const preview =
    contentPreview ??
    originalContent.slice(0, 200) +
      (originalContent.length > 200 ? "..." : "");

  return (
    <Link
      href={`/articles/${slug}`}
      className="block rounded-md border border-gh-border bg-gh-bg-secondary p-4 transition-colors hover:border-gh-accent-blue"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Author */}
          <div className="flex items-center gap-2 text-sm">
            <div className="relative">
              <PlatformAvatar platform={platform} username={authorUsername} displayName={authorDisplayName} size={24} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gh-bg-secondary">
                <PlatformIcon platform={platform} className={`h-2.5 w-2.5 ${platformColor(platform)}`} />
              </span>
            </div>
            <span className="font-medium text-gh-text">{authorDisplayName}</span>
            <span className="text-gh-text-secondary">@{authorUsername}</span>
            <span className="text-gh-text-secondary">·</span>
            <time className="text-gh-text-secondary" dateTime={publishedAt}>
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </time>
          </div>

          {/* Title */}
          <h3 className="mt-2 font-semibold text-gh-text">{title}</h3>

          {/* Preview */}
          <p className="mt-1 text-sm leading-relaxed text-gh-text-secondary">{preview}</p>

          {/* Footer: engagement + status */}
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
                  interpretation ? "bg-gh-accent-green" : "bg-gh-accent-orange"
                }`}
              />
              {interpretation ? "Interpreted" : "Pending"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
