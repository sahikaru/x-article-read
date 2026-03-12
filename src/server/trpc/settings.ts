import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "./init";
import { settings } from "@/lib/db/schema";

export const settingsRouter = router({
  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(settings)
        .where(eq(settings.key, input.key));
      return rows[0]?.value ?? null;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }),

  set: publicProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(settings)
        .values({ key: input.key, value: input.value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: input.value },
        });
      return { key: input.key };
    }),

  testApiKey: publicProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": input.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API key validation failed: ${res.status} ${body}`);
      }
      return { valid: true };
    }),
});
