import { fetchTweet, extractTweetId } from "../src/lib/services/twitter";
import { createArticleService } from "../src/lib/services/articles";
import { buildMdx, buildSlug, formatDate } from "../src/lib/mdx/builder";
import { getDb } from "../src/lib/db";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npm run cli:fetch <tweet_url>");
    process.exit(1);
  }

  const parsed = extractTweetId(url);
  if (!parsed) {
    console.error("Invalid tweet URL");
    process.exit(1);
  }

  console.log(`Fetching tweet ${parsed.id} by @${parsed.username}...`);
  const response = await fetchTweet(parsed.username, parsed.id);

  if (!response.tweet) {
    console.error("Tweet not found");
    process.exit(1);
  }

  const tweet = response.tweet;
  const slug = buildSlug(tweet);
  const mdxContent = buildMdx(tweet, url);

  const db = getDb();
  const svc = createArticleService(db);

  const existing = await svc.getArticleBySlug(slug);
  if (existing) {
    console.log(`Article already exists: ${slug}`);
    return;
  }

  const article = await svc.createArticle({
    sourceId: tweet.id,
    platform: "twitter",
    contentType: "tweet",
    slug,
    title: tweet.text.split("\n")[0].slice(0, 80),
    authorUsername: tweet.author.screen_name,
    authorDisplayName: tweet.author.name,
    publishedAt: formatDate(tweet.created_at),
    sourceUrl: url,
    originalContent: tweet.text,
    mdxContent,
    wordCount: tweet.text.split(/\s+/).length,
    engagement: {
      likes: tweet.likes ?? 0,
      retweets: tweet.retweets ?? 0,
      views: tweet.views ?? 0,
    },
  });

  console.log(`Created article: ${article.slug} (ID: ${article.id})`);
}

main().catch(console.error);
