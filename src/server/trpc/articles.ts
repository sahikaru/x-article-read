import { z } from "zod";
import { router, publicProcedure } from "./init";
import { createArticleService } from "@/lib/services/articles";

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
});
