import { eq } from "drizzle-orm";
import { categories } from "../db/schema";
import type { Db } from "../db";
import type { CreateCategoryInput } from "../types";

export function createCategoryService(db: Db) {
  return {
    async createCategory(input: CreateCategoryInput) {
      const [category] = await db
        .insert(categories)
        .values(input)
        .returning();
      return category;
    },

    async getCategory(id: number) {
      const rows = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));
      return rows[0] ?? null;
    },

    async listCategories() {
      return db.select().from(categories).orderBy(categories.sortOrder);
    },

    async updateCategory(id: number, data: Partial<CreateCategoryInput>) {
      return db.update(categories).set(data).where(eq(categories.id, id));
    },

    async deleteCategory(id: number) {
      return db.delete(categories).where(eq(categories.id, id));
    },
  };
}
