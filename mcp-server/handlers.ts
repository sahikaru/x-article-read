import { getDb } from "../src/lib/db";
import { createArticleService } from "../src/lib/services/articles";
import { articleTags } from "../src/lib/db/schema";

function getArticleSvc() {
  return createArticleService(getDb());
}

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const svc = getArticleSvc();

  switch (name) {
    case "list_pending_articles": {
      const limit = (args.limit as number) ?? 20;
      const pending = await svc.getPendingInterpretation();
      const results = pending.slice(0, limit).map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        author: `${a.authorDisplayName} (@${a.authorUsername})`,
        publishedAt: a.publishedAt,
        platform: a.platform,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    case "get_article_content": {
      const slug = args.slug as string;
      const article = await svc.getArticleBySlug(slug);
      if (!article) {
        return {
          content: [
            { type: "text", text: `Article not found: ${slug}` },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(article, null, 2),
          },
        ],
      };
    }

    case "save_interpretation": {
      const slug = args.slug as string;
      const interpretation = args.interpretation as string;
      const tags = (args.tags as string[]) ?? [];

      const article = await svc.getArticleBySlug(slug);
      if (!article) {
        return {
          content: [
            { type: "text", text: `Article not found: ${slug}` },
          ],
        };
      }

      await svc.updateInterpretation(article.id, interpretation);

      // Save tags
      if (tags.length > 0) {
        const db = getDb();
        for (const tag of tags) {
          await db
            .insert(articleTags)
            .values({ articleId: article.id, tag })
            .onConflictDoNothing();
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Interpretation saved for "${article.title}" (${slug}). Tags: ${tags.join(", ") || "none"}`,
          },
        ],
      };
    }

    case "batch_interpret": {
      const limit = (args.limit as number) ?? 5;
      const pending = await svc.getPendingInterpretation();
      const batch = [];
      for (const a of pending.slice(0, limit)) {
        const full = await svc.getArticleBySlug(a.slug);
        if (full) batch.push(full);
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(batch, null, 2),
          },
        ],
      };
    }

    default:
      return {
        content: [
          { type: "text", text: `Unknown tool: ${name}` },
        ],
      };
  }
}
