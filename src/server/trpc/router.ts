import { router } from "./init";
import { followsRouter } from "./follows";
import { categoriesRouter } from "./categories";
import { articlesRouter } from "./articles";
import { interpretationRouter } from "./interpretation";
import { searchRouter } from "./search";
import { settingsRouter } from "./settings";

export const appRouter = router({
  follows: followsRouter,
  categories: categoriesRouter,
  articles: articlesRouter,
  interpretation: interpretationRouter,
  search: searchRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
