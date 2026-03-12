import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../../db/schema";
import { createArticleService } from "../articles";
import { createFollowService } from "../follows";
import { createCategoryService } from "../categories";
import type { Db } from "../../db";

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

describe("categoryService", () => {
  const svc = () => createCategoryService(db);

  it("creates and lists categories", async () => {
    const cat = await svc().createCategory({
      name: "Test",
      color: "#ff0000",
    });
    expect(cat.id).toBeDefined();
    expect(cat.name).toBe("Test");

    const all = await svc().listCategories();
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it("updates a category", async () => {
    const cat = await svc().createCategory({
      name: "ToUpdate",
      color: "#000",
    });
    await svc().updateCategory(cat.id, { color: "#fff" });
    const updated = await svc().getCategory(cat.id);
    expect(updated?.color).toBe("#fff");
  });

  it("deletes a category", async () => {
    const cat = await svc().createCategory({
      name: "ToDelete",
      color: "#000",
    });
    await svc().deleteCategory(cat.id);
    const result = await svc().getCategory(cat.id);
    expect(result).toBeNull();
  });
});

describe("followService", () => {
  const svc = () => createFollowService(db);
  const catSvc = () => createCategoryService(db);

  it("creates and lists follows", async () => {
    const follow = await svc().createFollow({
      platform: "twitter",
      username: "svc_user",
      displayName: "Svc User",
    });
    expect(follow.id).toBeDefined();

    const all = await svc().listFollows();
    expect(all.some((f) => f.username === "svc_user")).toBe(true);
  });

  it("assigns categories to a follow", async () => {
    const follow = await svc().createFollow({
      platform: "twitter",
      username: "cat_user",
      displayName: "Cat User",
    });
    const cat = await catSvc().createCategory({
      name: "FollowCat",
      color: "#abc",
    });

    await svc().assignCategories(follow.id, [cat.id]);
    const byCategory = await svc().listFollowsByCategory(cat.id);
    expect(byCategory.some((f) => f.id === follow.id)).toBe(true);
  });

  it("deletes a follow", async () => {
    const follow = await svc().createFollow({
      platform: "twitter",
      username: "del_user",
      displayName: "Del User",
    });
    await svc().deleteFollow(follow.id);
    const result = await svc().getFollow(follow.id);
    expect(result).toBeNull();
  });
});

describe("articleService", () => {
  const svc = () => createArticleService(db);

  it("creates an article with tags", async () => {
    const article = await svc().createArticle({
      sourceId: "t-100",
      platform: "twitter",
      contentType: "tweet",
      slug: "svc-test-100",
      title: "Service Test",
      authorUsername: "author1",
      authorDisplayName: "Author One",
      publishedAt: "2024-01-01T00:00:00Z",
      sourceUrl: "https://x.com/author1/status/100",
      originalContent: "Hello service test",
      tags: ["defi", "trading"],
    });
    expect(article.id).toBeDefined();

    const fetched = await svc().getArticleBySlug("svc-test-100");
    expect(fetched).not.toBeNull();
    expect(fetched!.tags).toEqual(["defi", "trading"]);
  });

  it("lists all articles sorted by publishedAt desc", async () => {
    await svc().createArticle({
      sourceId: "t-200",
      platform: "twitter",
      contentType: "tweet",
      slug: "svc-test-200",
      title: "Older Article",
      authorUsername: "author2",
      authorDisplayName: "Author Two",
      publishedAt: "2023-01-01T00:00:00Z",
      sourceUrl: "https://x.com/author2/status/200",
      originalContent: "Older article",
    });

    const all = await svc().getAllArticles();
    expect(all.length).toBeGreaterThanOrEqual(2);
    // Most recent first
    expect(
      new Date(all[0].publishedAt).getTime()
    ).toBeGreaterThanOrEqual(new Date(all[1].publishedAt).getTime());
  });

  it("gets pending interpretation articles", async () => {
    const pending = await svc().getPendingInterpretation();
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending.every((a) => a.interpretation === null)).toBe(true);
  });

  it("updates interpretation", async () => {
    const all = await svc().getAllArticles();
    const article = all[0];
    await svc().updateInterpretation(article.id, "This is the interpretation");

    const updated = await svc().getArticleBySlug(article.slug);
    expect(updated!.interpretation).toBe("This is the interpretation");
    expect(updated!.interpretedAt).toBeTruthy();
  });

  it("deletes an article", async () => {
    const article = await svc().createArticle({
      sourceId: "t-300",
      platform: "twitter",
      contentType: "tweet",
      slug: "svc-del-300",
      title: "To Delete",
      authorUsername: "author3",
      authorDisplayName: "Author Three",
      publishedAt: "2024-06-01T00:00:00Z",
      sourceUrl: "https://x.com/author3/status/300",
      originalContent: "Delete me",
      tags: ["test"],
    });

    await svc().deleteArticle(article.id);
    const result = await svc().getArticleBySlug("svc-del-300");
    expect(result).toBeNull();
  });
});
