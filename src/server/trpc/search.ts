import { z } from "zod";
import { like, or } from "drizzle-orm";
import { router, publicProcedure } from "./init";
import { articles } from "@/lib/db/schema";
import { getSqlite } from "@/lib/db";
import { createSearchService } from "@/lib/services/search";

export const searchRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Try FTS5 first, fall back to LIKE if FTS not available
      try {
        const sqlite = getSqlite();
        const searchService = createSearchService(ctx.db, sqlite);
        const results = searchService.search(input.query, input.limit);
        return { results };
      } catch {
        // Fallback to LIKE queries if FTS5 is not initialized
        const pattern = `%${input.query}%`;
        const results = await ctx.db
          .select()
          .from(articles)
          .where(
            or(
              like(articles.title, pattern),
              like(articles.originalContent, pattern),
              like(articles.interpretation, pattern)
            )
          )
          .limit(input.limit);

        return { results };
      }
    }),
});
