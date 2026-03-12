import { eq, isNull, desc, inArray } from "drizzle-orm";
import { articles, articleTags } from "../db/schema";
import type { Db } from "../db";
import type { CreateArticleInput } from "../types";

export function createArticleService(db: Db) {
  return {
    async createArticle(input: CreateArticleInput) {
      const { tags, ...articleData } = input;
      const plainText = input.originalContent
        .replace(/^#{1,6}\s+.*$/gm, "") // headings
        .replace(/>\s?.*$/gm, "") // blockquotes
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
        .replace(/[*_~`]/g, "") // inline formatting
        .replace(/\n{2,}/g, "\n") // multiple newlines
        .trim();
      const contentPreview =
        plainText.slice(0, 200) +
        (plainText.length > 200 ? "..." : "");
      const [article] = await db
        .insert(articles)
        .values({
          ...articleData,
          contentPreview,
          engagement: input.engagement ?? null,
        })
        .returning();

      if (tags?.length) {
        await db
          .insert(articleTags)
          .values(tags.map((tag) => ({ articleId: article.id, tag })));
      }

      return article;
    },

    async getArticleBySlug(slug: string) {
      const rows = await db
        .select()
        .from(articles)
        .where(eq(articles.slug, slug));
      if (!rows.length) return null;

      const tags = await db
        .select()
        .from(articleTags)
        .where(eq(articleTags.articleId, rows[0].id));

      return { ...rows[0], tags: tags.map((t) => t.tag) };
    },

    async getAllArticles() {
      return db
        .select()
        .from(articles)
        .orderBy(desc(articles.publishedAt));
    },

    async deleteArticle(id: number) {
      return db.delete(articles).where(eq(articles.id, id));
    },

    async getArticlesByAuthor(username: string) {
      return db
        .select()
        .from(articles)
        .where(eq(articles.authorUsername, username))
        .orderBy(desc(articles.publishedAt));
    },

    async getArticlesByTag(tag: string) {
      const tagRows = await db
        .select()
        .from(articleTags)
        .where(eq(articleTags.tag, tag));
      if (!tagRows.length) return [];

      const ids = tagRows.map((t) => t.articleId);
      return db
        .select()
        .from(articles)
        .where(inArray(articles.id, ids))
        .orderBy(desc(articles.publishedAt));
    },

    async getPendingInterpretation() {
      return db
        .select()
        .from(articles)
        .where(isNull(articles.interpretation))
        .orderBy(desc(articles.publishedAt));
    },

    async updateInterpretation(id: number, interpretation: string) {
      return db
        .update(articles)
        .set({
          interpretation,
          interpretedAt: new Date().toISOString(),
        })
        .where(eq(articles.id, id));
    },

    async getAllTags() {
      const rows = await db.select({ tag: articleTags.tag }).from(articleTags);
      return [...new Set(rows.map((r) => r.tag))].sort();
    },
  };
}
