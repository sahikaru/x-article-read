import { router } from "./init";
import { followsRouter } from "./follows";
import { categoriesRouter } from "./categories";
import { articlesRouter } from "./articles";
import { interpretationRouter } from "./interpretation";
import { searchRouter } from "./search";
import { settingsRouter } from "./settings";
import { wechatRouter } from "./wechat";

export const appRouter = router({
  follows: followsRouter,
  categories: categoriesRouter,
  articles: articlesRouter,
  interpretation: interpretationRouter,
  search: searchRouter,
  settings: settingsRouter,
  wechat: wechatRouter,
});

export type AppRouter = typeof appRouter;
