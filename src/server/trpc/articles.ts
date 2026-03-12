import { z } from "zod";
import { router, publicProcedure } from "./init";
import { createArticleService } from "@/lib/services/articles";
import { fetchTweet, extractTweetId } from "@/lib/services/twitter";
import {
  fetchWeChatArticle,
  isWeChatUrl,
  extractWeChatId,
} from "@/lib/services/wechat";
import {
  buildMdx,
  buildSlug,
  buildWeChatMdx,
  buildWeChatSlug,
  formatDate,
} from "@/lib/mdx/builder";

export const articlesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.number().optional(),
          authorUsername: z.string().optional(),
          tag: z.string().optional(),
          hasInterpretation: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const service = createArticleService(ctx.db);
      const limit = input?.limit ?? 20;

      let items;
      if (input?.authorUsername) {
        items = await service.getArticlesByAuthor(input.authorUsername);
      } else if (input?.tag) {
        items = await service.getArticlesByTag(input.tag);
      } else {
        items = await service.getAllArticles();
      }

      if (input?.hasInterpretation !== undefined) {
        items = items.filter((a) =>
          input.hasInterpretation ? a.interpretation !== null : a.interpretation === null
        );
      }

      // Cursor-based pagination
      if (input?.cursor) {
        const cursorIdx = items.findIndex((a) => a.id === input.cursor);
        if (cursorIdx >= 0) {
          items = items.slice(cursorIdx + 1);
        }
      }

      const hasMore = items.length > limit;
      const page = items.slice(0, limit);

      return {
        items: page,
        nextCursor: hasMore ? page[page.length - 1]?.id : undefined,
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      const service = createArticleService(ctx.db);
      return service.getArticleBySlug(input.slug);
    }),

  create: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        platform: z.enum(["twitter", "wechat"]),
        contentType: z.enum(["tweet", "thread", "article"]),
        slug: z.string(),
        title: z.string(),
        authorUsername: z.string(),
        authorDisplayName: z.string(),
        publishedAt: z.string(),
        sourceUrl: z.string(),
        originalContent: z.string(),
        mdxContent: z.string().optional(),
        summary: z.string().optional(),
        wordCount: z.number().optional(),
        engagement: z
          .object({
            likes: z.number(),
            retweets: z.number(),
            views: z.number(),
          })
          .optional(),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(({ ctx, input }) => {
      const service = createArticleService(ctx.db);
      return service.createArticle(input);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createArticleService(ctx.db);
      await service.deleteArticle(input.id);
      return { id: input.id };
    }),

  listByAuthor: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(({ ctx, input }) => {
      const service = createArticleService(ctx.db);
      return service.getArticlesByAuthor(input.username);
    }),

  listByTag: publicProcedure
    .input(z.object({ tag: z.string() }))
    .query(({ ctx, input }) => {
      const service = createArticleService(ctx.db);
      return service.getArticlesByTag(input.tag);
    }),

  listTags: publicProcedure.query(({ ctx }) => {
    const service = createArticleService(ctx.db);
    return service.getAllTags();
  }),

  fetchUrl: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const service = createArticleService(ctx.db);

      if (isWeChatUrl(input.url)) {
        const wechatArticle = await fetchWeChatArticle(input.url);
        const slug = buildWeChatSlug(wechatArticle);
        const existing = await service.getArticleBySlug(slug);
        if (existing) return { slug, duplicate: true };

        const mdxContent = buildWeChatMdx(wechatArticle);
        const article = await service.createArticle({
          sourceId: extractWeChatId(input.url),
          platform: "wechat",
          contentType: "article",
          slug,
          title: wechatArticle.title,
          authorUsername: wechatArticle.accountName,
          authorDisplayName: wechatArticle.author || wechatArticle.accountName,
          publishedAt: formatDate(wechatArticle.publishDate),
          sourceUrl: input.url,
          originalContent: wechatArticle.content,
          mdxContent,
          wordCount: wechatArticle.content.length,
        });
        return { slug: article.slug, duplicate: false };
      }

      const parsed = extractTweetId(input.url);
      if (!parsed) {
        throw new Error("Unsupported URL. Use Twitter/X or WeChat article URLs.");
      }

      const response = await fetchTweet(parsed.username, parsed.id);
      if (!response.tweet) throw new Error("Tweet not found");

      const tweet = response.tweet;
      const slug = buildSlug(tweet);
      const existing = await service.getArticleBySlug(slug);
      if (existing) return { slug, duplicate: true };

      const mdxContent = buildMdx(tweet, input.url);
      const article = await service.createArticle({
        sourceId: tweet.id,
        platform: "twitter",
        contentType: "tweet",
        slug,
        title: tweet.text.split("\n")[0].slice(0, 80),
        authorUsername: tweet.author.screen_name,
        authorDisplayName: tweet.author.name,
        publishedAt: formatDate(tweet.created_at),
        sourceUrl: input.url,
        originalContent: tweet.text,
        mdxContent,
        wordCount: tweet.text.split(/\s+/).length,
        engagement: {
          likes: tweet.likes ?? 0,
          retweets: tweet.retweets ?? 0,
          views: tweet.views ?? 0,
        },
      });
      return { slug: article.slug, duplicate: false };
    }),
});
