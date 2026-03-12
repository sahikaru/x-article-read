import { z } from "zod";
import { router, publicProcedure } from "./init";
import { createCategoryService } from "@/lib/services/categories";

export const categoriesRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    const service = createCategoryService(ctx.db);
    return service.listCategories();
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().min(1),
        icon: z.string().optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(({ ctx, input }) => {
      const service = createCategoryService(ctx.db);
      return service.createCategory(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const service = createCategoryService(ctx.db);
      await service.updateCategory(id, data);
      return service.getCategory(id);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createCategoryService(ctx.db);
      await service.deleteCategory(input.id);
      return { id: input.id };
    }),
});
