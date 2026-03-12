import { z } from "zod";
import { router, publicProcedure } from "./init";
import { createFollowService } from "@/lib/services/follows";

export const followsRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    const service = createFollowService(ctx.db);
    return service.listFollows();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = createFollowService(ctx.db);
      return service.getFollow(input.id);
    }),

  create: publicProcedure
    .input(
      z.object({
        platform: z.enum(["twitter", "wechat"]),
        username: z.string().min(1),
        displayName: z.string().min(1),
        avatarUrl: z.string().optional(),
        bio: z.string().optional(),
        categoryIds: z.array(z.number()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...followData } = input;
      const service = createFollowService(ctx.db);
      const follow = await service.createFollow(followData);
      if (categoryIds.length) {
        await service.assignCategories(follow.id, categoryIds);
      }
      return follow;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
        bio: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, ...data } = input;
      const service = createFollowService(ctx.db);
      await service.updateFollow(id, data);
      if (categoryIds) {
        await service.removeAllCategories(id);
        if (categoryIds.length) {
          await service.assignCategories(id, categoryIds);
        }
      }
      return service.getFollow(id);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createFollowService(ctx.db);
      await service.deleteFollow(input.id);
      return { id: input.id };
    }),

  listByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(({ ctx, input }) => {
      const service = createFollowService(ctx.db);
      return service.listFollowsByCategory(input.categoryId);
    }),
});
