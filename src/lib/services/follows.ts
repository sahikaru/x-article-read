import { eq, and, inArray } from "drizzle-orm";
import { follows, followCategories } from "../db/schema";
import type { Db } from "../db";
import type { CreateFollowInput } from "../types";

export function createFollowService(db: Db) {
  return {
    async createFollow(input: CreateFollowInput) {
      const [follow] = await db.insert(follows).values(input).returning();
      return follow;
    },

    async getFollow(id: number) {
      const rows = await db
        .select()
        .from(follows)
        .where(eq(follows.id, id));
      return rows[0] ?? null;
    },

    async listFollows() {
      return db.select().from(follows);
    },

    async updateFollow(id: number, data: Partial<CreateFollowInput>) {
      return db.update(follows).set(data).where(eq(follows.id, id));
    },

    async deleteFollow(id: number) {
      return db.delete(follows).where(eq(follows.id, id));
    },

    async assignCategories(followId: number, categoryIds: number[]) {
      if (!categoryIds.length) return;
      await db
        .insert(followCategories)
        .values(categoryIds.map((categoryId) => ({ followId, categoryId })))
        .onConflictDoNothing();
    },

    async removeCategory(followId: number, categoryId: number) {
      return db
        .delete(followCategories)
        .where(
          and(
            eq(followCategories.followId, followId),
            eq(followCategories.categoryId, categoryId)
          )
        );
    },

    async removeAllCategories(followId: number) {
      return db
        .delete(followCategories)
        .where(eq(followCategories.followId, followId));
    },

    async listFollowsByCategory(categoryId: number) {
      const junctions = await db
        .select()
        .from(followCategories)
        .where(eq(followCategories.categoryId, categoryId));
      if (!junctions.length) return [];

      const ids = junctions.map((j) => j.followId);
      return db
        .select()
        .from(follows)
        .where(inArray(follows.id, ids));
    },
  };
}
