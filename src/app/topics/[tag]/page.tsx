import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { appRouter } from "@/server/trpc/router";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { ArticleCardServer } from "@/components/article-card-server";

const createCaller = createCallerFactory(appRouter);

export default async function TopicTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const caller = createCaller(createTRPCContext());
  const articles = await caller.articles.listByTag({ tag: decodedTag });

  return (
    <div>
      <Link
        href="/topics"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gh-text-secondary hover:text-gh-accent-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        All topics
      </Link>

      <h1 className="text-2xl font-bold text-gh-text">#{decodedTag}</h1>
      <p className="mt-1 text-sm text-gh-text-secondary">
        {articles.length} article{articles.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-4 space-y-3">
        {articles.length === 0 ? (
          <div className="py-12 text-center text-gh-text-secondary">
            No articles with this tag.
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
