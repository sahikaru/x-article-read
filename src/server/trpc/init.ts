import { initTRPC } from "@trpc/server";
import { getDb, type Db } from "@/lib/db";

export type TRPCContext = {
  db: Db;
};

export function createTRPCContext(): TRPCContext {
  return { db: getDb() };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
