import { getDb } from "./index";
import { categories } from "./schema";

const DEFAULT_CATEGORIES = [
  { name: "Uncategorized", color: "#8b949e", icon: "folder", sortOrder: 0 },
  { name: "DeFi Traders", color: "#3fb950", icon: "trending-up", sortOrder: 1 },
  { name: "Macro Analysts", color: "#58a6ff", icon: "globe", sortOrder: 2 },
  {
    name: "On-Chain Analysts",
    color: "#d29922",
    icon: "database",
    sortOrder: 3,
  },
  {
    name: "CT Influencers",
    color: "#f85149",
    icon: "megaphone",
    sortOrder: 4,
  },
  { name: "Builders", color: "#bc8cff", icon: "hammer", sortOrder: 5 },
];

async function seed() {
  const db = getDb();

  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoNothing({ target: categories.name });
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);
}

seed().catch(console.error);
