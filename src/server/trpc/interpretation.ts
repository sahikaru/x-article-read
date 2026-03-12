import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "./init";
import { createArticleService } from "@/lib/services/articles";
import { settings } from "@/lib/db/schema";
import {
  createInterpretationService,
  type InterpretOptions,
} from "@/lib/services/interpretation";

async function getSettingsOptions(
  db: Parameters<typeof createInterpretationService>[0]
): Promise<InterpretOptions> {
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const opts: InterpretOptions = {};
  if (map.anthropic_api_key) opts.apiKey = map.anthropic_api_key;
  if (
    map.model === "claude-haiku-4-5-20251001" ||
    map.model === "claude-sonnet-4-6-20250514"
  ) {
    opts.model = map.model;
  }
  return opts;
}

export const interpretationRouter = router({
  interpret: publicProcedure
    .input(
      z.object({
        articleId: z.number(),
        model: z
          .enum(["claude-haiku-4-5-20251001", "claude-sonnet-4-6-20250514"])
          .optional(),
        apiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = createInterpretationService(ctx.db);
      const saved = await getSettingsOptions(ctx.db);
      const options: InterpretOptions = { ...saved };
      if (input.model) options.model = input.model;
      if (input.apiKey) options.apiKey = input.apiKey;

      const result = await service.interpretArticle(input.articleId, options);
      return {
        articleId: input.articleId,
        status: "completed" as const,
        interpretation: result.interpretation,
        suggestedTags: result.suggestedTags,
      };
    }),

  batchInterpret: publicProcedure
    .input(
      z.object({
        articleIds: z.array(z.number()).min(1),
        model: z
          .enum(["claude-haiku-4-5-20251001", "claude-sonnet-4-6-20250514"])
          .optional(),
        apiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = createInterpretationService(ctx.db);
      const saved = await getSettingsOptions(ctx.db);
      const options: InterpretOptions = { ...saved };
      if (input.model) options.model = input.model;
      if (input.apiKey) options.apiKey = input.apiKey;

      const results = [];
      for (const articleId of input.articleIds) {
        try {
          const result = await service.interpretArticle(articleId, options);
          results.push({
            articleId,
            status: "completed" as const,
            interpretation: result.interpretation,
            suggestedTags: result.suggestedTags,
          });
        } catch (error) {
          results.push({
            articleId,
            status: "failed" as const,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return results;
    }),

  getStatus: publicProcedure.query(async ({ ctx }) => {
    const service = createArticleService(ctx.db);
    const all = await service.getAllArticles();
    const pending = await service.getPendingInterpretation();

    return {
      total: all.length,
      interpreted: all.length - pending.length,
      pending: pending.length,
    };
  }),
});
