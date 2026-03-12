import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../../db/schema";
import { createInterpretationService } from "../interpretation";
import { createArticleService } from "../articles";
import type { Db } from "../../db";

// Mock Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: "这是一篇关于 DeFi Trading 的推文解读。\n\n<Callout type=\"info\">\n关键洞察：作者讨论了 Funding Rate 的影响\n</Callout>\n\n---TAGS---\nDeFi, Trading, Funding Rate",
            },
          ],
        }),
      };

      constructor() {}
    },
  };
});

let sqlite: InstanceType<typeof Database>;
let db: Db;

beforeAll(() => {
  sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema }) as unknown as Db;
  migrate(db as any, { migrationsFolder: "./drizzle" });
});

afterAll(() => {
  sqlite.close();
});

describe("interpretationService", () => {
  it("interprets an article and saves result", async () => {
    const articleSvc = createArticleService(db);
    const article = await articleSvc.createArticle({
      sourceId: "interp-100",
      platform: "twitter",
      contentType: "tweet",
      slug: "interp-test-100",
      title: "DeFi Funding Rate Analysis",
      authorUsername: "defi_trader",
      authorDisplayName: "DeFi Trader",
      publishedAt: "2024-06-01T00:00:00Z",
      sourceUrl: "https://x.com/defi_trader/status/100",
      originalContent:
        "The funding rate on perpetuals has been negative for 3 days. This usually signals a reversal incoming.",
    });

    const interpSvc = createInterpretationService(db);
    const result = await interpSvc.interpretArticle(article.id, {
      apiKey: "test-key",
    });

    expect(result.interpretation).toContain("DeFi Trading");
    expect(result.suggestedTags).toContain("DeFi");
    expect(result.suggestedTags).toContain("Trading");

    // Verify saved to DB
    const updated = await articleSvc.getArticleBySlug("interp-test-100");
    expect(updated!.interpretation).toContain("DeFi Trading");
    expect(updated!.interpretedAt).toBeTruthy();
  });

  it("throws when no API key is provided", async () => {
    const interpSvc = createInterpretationService(db);
    // Remove env var for this test
    const origKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    await expect(interpSvc.interpretArticle(999)).rejects.toThrow(
      "No API key configured"
    );

    if (origKey) process.env.ANTHROPIC_API_KEY = origKey;
  });

  it("throws when article not found", async () => {
    const interpSvc = createInterpretationService(db);
    await expect(
      interpSvc.interpretArticle(99999, { apiKey: "test-key" })
    ).rejects.toThrow("Article 99999 not found");
  });
});
