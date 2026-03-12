import { createArticleService } from "../src/lib/services/articles";
import { getDb } from "../src/lib/db";

async function main() {
  const db = getDb();
  const svc = createArticleService(db);

  const all = await svc.getAllArticles();
  const pending = await svc.getPendingInterpretation();

  console.log(`Total articles: ${all.length}`);
  console.log(`Interpreted: ${all.length - pending.length}`);
  console.log(`Pending: ${pending.length}`);

  if (pending.length > 0) {
    console.log("\nPending articles:");
    for (const article of pending) {
      console.log(
        `  - [${article.id}] ${article.title.slice(0, 60)} (@${article.authorUsername})`
      );
    }
  }
}

main().catch(console.error);
