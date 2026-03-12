import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../../src/lib/db/schema";

// Mock getDb to use in-memory database
let sqlite: InstanceType<typeof Database>;
let db: ReturnType<typeof drizzle>;

vi.mock("../../src/lib/db", () => ({
  getDb: () => db,
}));

// Import after mock
import { handleToolCall } from "../handlers";
import { createArticleService } from "../../src/lib/services/articles";
import type { Db } from "../../src/lib/db";

beforeAll(() => {
  sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema });
  migrate(db as any, { migrationsFolder: "./drizzle" });
});

afterAll(() => {
  sqlite.close();
});

describe("MCP handlers", () => {
  it("list_pending_articles returns empty when no articles", async () => {
    const result = await handleToolCall("list_pending_articles", {});
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_article_content returns not found for missing slug", async () => {
    const result = await handleToolCall("get_article_content", {
      slug: "nonexistent",
    });
    expect(result.content[0].text).toContain("not found");
  });

  it("handles full workflow: create article -> list pending -> get content -> save interpretation", async () => {
    const svc = createArticleService(db as unknown as Db);
    await svc.createArticle({
      sourceId: "mcp-100",
      platform: "twitter",
      contentType: "tweet",
      slug: "mcp-test-100",
      title: "MCP Test Article",
      authorUsername: "tester",
      authorDisplayName: "Tester",
      publishedAt: "2024-06-01T00:00:00Z",
      sourceUrl: "https://x.com/tester/status/100",
      originalContent: "Test content for MCP",
    });

    // List pending
    const listResult = await handleToolCall("list_pending_articles", {});
    const pending = JSON.parse(listResult.content[0].text);
    expect(pending.some((a: any) => a.slug === "mcp-test-100")).toBe(true);

    // Get content
    const getResult = await handleToolCall("get_article_content", {
      slug: "mcp-test-100",
    });
    const article = JSON.parse(getResult.content[0].text);
    expect(article.title).toBe("MCP Test Article");

    // Save interpretation
    const saveResult = await handleToolCall("save_interpretation", {
      slug: "mcp-test-100",
      interpretation: "这是 MCP 测试解读",
      tags: ["test", "mcp"],
    });
    expect(saveResult.content[0].text).toContain("Interpretation saved");

    // Verify no longer pending
    const listResult2 = await handleToolCall("list_pending_articles", {});
    const pending2 = JSON.parse(listResult2.content[0].text);
    expect(pending2.some((a: any) => a.slug === "mcp-test-100")).toBe(false);
  });

  it("batch_interpret returns articles with content", async () => {
    const svc = createArticleService(db as unknown as Db);
    await svc.createArticle({
      sourceId: "mcp-200",
      platform: "twitter",
      contentType: "tweet",
      slug: "mcp-batch-200",
      title: "Batch Test",
      authorUsername: "batch",
      authorDisplayName: "Batch",
      publishedAt: "2024-07-01T00:00:00Z",
      sourceUrl: "https://x.com/batch/status/200",
      originalContent: "Batch content",
    });

    const result = await handleToolCall("batch_interpret", { limit: 10 });
    const batch = JSON.parse(result.content[0].text);
    expect(batch.some((a: any) => a.slug === "mcp-batch-200")).toBe(true);
  });

  it("returns error for unknown tool", async () => {
    const result = await handleToolCall("unknown_tool", {});
    expect(result.content[0].text).toContain("Unknown tool");
  });
});
