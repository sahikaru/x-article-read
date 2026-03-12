import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { appRouter } from "@/server/trpc/router";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { ArticleCardServer } from "@/components/article-card-server";
import { PlatformAvatar } from "@/components/platform-avatar";
import { PlatformIcon, platformColor } from "@/components/platform-icon";

const createCaller = createCallerFactory(appRouter);

export default async function UserArticlesPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const caller = createCaller(createTRPCContext());

  const articles = await caller.articles.listByAuthor({ username });
  const allFollows = await caller.follows.list();
  const follow = allFollows.find(
    (f) => f.username.toLowerCase() === username.toLowerCase()
  );

  if (!follow && articles.length === 0) {
    notFound();
  }

  const displayName =
    follow?.displayName ?? articles[0]?.authorDisplayName ?? username;
  const bio = follow?.bio;

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gh-text-secondary hover:text-gh-accent-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      {/* Profile header */}
      <header className="rounded-md border border-gh-border bg-gh-bg-secondary p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <PlatformAvatar platform={follow?.platform ?? "twitter"} username={username} displayName={displayName} size={56} />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gh-bg-secondary">
              <PlatformIcon platform={follow?.platform ?? "twitter"} className={`h-3.5 w-3.5 ${platformColor(follow?.platform ?? "twitter")}`} />
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gh-text">{displayName}</h1>
            <p className="text-sm text-gh-text-secondary">@{username}</p>
            {bio && (
              <p className="mt-1 text-sm text-gh-text-secondary">{bio}</p>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-gh-text">{articles.length}</p>
            <p className="text-xs text-gh-text-secondary">
              article{articles.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Articles */}
      <div className="mt-4 space-y-3">
        {articles.length === 0 ? (
          <div className="py-12 text-center text-gh-text-secondary">
            No articles from @{username} yet.
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCardServer key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  );
}
