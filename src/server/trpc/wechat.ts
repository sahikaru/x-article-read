import { z } from "zod";
import { router, publicProcedure } from "./init";
import { settings } from "@/lib/db/schema";
import {
  searchWeChatAccount,
  fetchWeChatAccountArticles,
  fetchWeChatArticle,
} from "@/lib/services/wechat";
import { createArticleService } from "@/lib/services/articles";
import { formatDate } from "@/lib/mdx/builder";
import type { Db } from "@/lib/db";

async function getWeChatCredentials(db: Db) {
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const token = map.wechat_token;
  const cookie = map.wechat_cookie;
  if (!token || !cookie) {
    throw new Error("WeChat credentials not configured. Go to Settings to add your token and cookie.");
  }
  return { token, cookie };
}

export const wechatRouter = router({
  /** Search for a public account by name */
  searchAccount: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { token, cookie } = await getWeChatCredentials(ctx.db);
      return searchWeChatAccount(input.query, token, cookie);
    }),

  /** Fetch all articles from an account and save to DB */
  fetchAccount: publicProcedure
    .input(
      z.object({
        fakeid: z.string(),
        accountName: z.string(),
        maxArticles: z.number().min(1).max(1000).default(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, cookie } = await getWeChatCredentials(ctx.db);
      const svc = createArticleService(ctx.db);

      // Step 1: Get article list from API
      const articleList = await fetchWeChatAccountArticles(
        input.fakeid,
        token,
        cookie,
        { maxArticles: input.maxArticles, delayMs: 5000 }
      );

      // Step 2: Save each article to DB (skip duplicates)
      let saved = 0;
      let skipped = 0;

      for (const item of articleList) {
        const slug = `${formatDate(new Date(item.createTime * 1000).toISOString())}-${item.aid}`;
        const existing = await svc.getArticleBySlug(slug);
        if (existing) {
          skipped++;
          continue;
        }

        // Try to fetch the full article content
        let content = item.digest;
        try {
          const full = await fetchWeChatArticle(item.link);
          content = full.content || item.digest;
        } catch {
          // If individual fetch fails, use the digest as content
        }

        await svc.createArticle({
          sourceId: item.aid,
          platform: "wechat",
          contentType: "article",
          slug,
          title: item.title,
          authorUsername: input.accountName,
          authorDisplayName: input.accountName,
          publishedAt: formatDate(
            new Date(item.createTime * 1000).toISOString()
          ),
          sourceUrl: item.link,
          originalContent: content,
          wordCount: content.length,
        });
        saved++;

        // Rate limit between individual article fetches
        if (saved < articleList.length) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      return {
        total: articleList.length,
        saved,
        skipped,
      };
    }),
});
