import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { articles, articleTags } from "../db/schema";
import type { Db } from "../db";

const INTERPRETATION_PROMPT = `You are a financial markets analyst who interprets tweets and social media posts for a Chinese-speaking audience.

Rules:
- Write the interpretation in Chinese (简体中文)
- Keep professional/technical terms in English: Martingale, Grid Trading, LP, DeFi, NFT, MEV, TVL, APY, etc.
- Structure your interpretation clearly with sections
- Use <Callout type="warning"> for risk disclaimers
- Use <Callout type="info"> for key insights
- Be concise but thorough
- At the end, suggest 3-5 relevant tags for this content (e.g., DeFi, Trading, Macro, Bitcoin, Ethereum)

Format your response as:
1. The interpretation text (in Chinese with English technical terms)
2. A line "---TAGS---" followed by comma-separated tags`;

export interface InterpretOptions {
  model?: "claude-haiku-4-5-20251001" | "claude-sonnet-4-6-20250514";
  apiKey?: string;
}

export function createInterpretationService(db: Db) {
  return {
    async interpretArticle(
      articleId: number,
      options: InterpretOptions = {}
    ) {
      const model = options.model ?? "claude-haiku-4-5-20251001";
      const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error(
          "No API key configured. Set ANTHROPIC_API_KEY or use MCP mode."
        );
      }

      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId));
      if (!article) throw new Error(`Article ${articleId} not found`);

      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `Please interpret the following tweet/article:\n\nTitle: ${article.title}\nAuthor: ${article.authorDisplayName} (@${article.authorUsername})\nDate: ${article.publishedAt}\n\nContent:\n${article.originalContent}`,
          },
        ],
        system: INTERPRETATION_PROMPT,
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      // Parse interpretation and tags
      const parts = responseText.split("---TAGS---");
      const interpretation = parts[0].trim();
      const tagLine = parts[1]?.trim() ?? "";
      const suggestedTags = tagLine
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Save interpretation
      await db
        .update(articles)
        .set({
          interpretation,
          interpretedAt: new Date().toISOString(),
        })
        .where(eq(articles.id, articleId));

      // Save suggested tags (merge with existing)
      if (suggestedTags.length) {
        for (const tag of suggestedTags) {
          await db
            .insert(articleTags)
            .values({ articleId, tag })
            .onConflictDoNothing();
        }
      }

      return { interpretation, suggestedTags };
    },
  };
}
