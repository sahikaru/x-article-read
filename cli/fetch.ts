import { fetchTweet, extractTweetId } from "../src/lib/services/twitter";
import {
  fetchWeChatArticle,
  isWeChatUrl,
  extractWeChatId,
} from "../src/lib/services/wechat";
import { createArticleService } from "../src/lib/services/articles";
import {
  buildMdx,
  buildSlug,
  buildWeChatMdx,
  buildWeChatSlug,
  formatDate,
} from "../src/lib/mdx/builder";
import { getDb } from "../src/lib/db";

async function fetchTwitter(url: string) {
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

async function fetchWeChat(url: string) {
  console.log(`Fetching WeChat article: ${url}`);
  const wechatArticle = await fetchWeChatArticle(url);

  console.log(`Title: ${wechatArticle.title}`);
  console.log(`Author: ${wechatArticle.author} (${wechatArticle.accountName})`);

  const slug = buildWeChatSlug(wechatArticle);
  const mdxContent = buildWeChatMdx(wechatArticle);
  const sourceId = extractWeChatId(url);

  const db = getDb();
  const svc = createArticleService(db);

  const existing = await svc.getArticleBySlug(slug);
  if (existing) {
    console.log(`Article already exists: ${slug}`);
    return;
  }

  const article = await svc.createArticle({
    sourceId,
    platform: "wechat",
    contentType: "article",
    slug,
    title: wechatArticle.title,
    authorUsername: wechatArticle.accountName,
    authorDisplayName: wechatArticle.author || wechatArticle.accountName,
    publishedAt: formatDate(wechatArticle.publishDate),
    sourceUrl: url,
    originalContent: wechatArticle.content,
    mdxContent,
    wordCount: wechatArticle.content.length,
  });

  console.log(`Created article: ${article.slug} (ID: ${article.id})`);
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npm run cli:fetch <url>");
    console.error("  Supports: Twitter/X URLs, WeChat article URLs");
    process.exit(1);
  }

  if (isWeChatUrl(url)) {
    await fetchWeChat(url);
  } else if (extractTweetId(url)) {
    await fetchTwitter(url);
  } else {
    console.error("Unsupported URL. Supported platforms:");
    console.error("  - Twitter/X: https://x.com/user/status/123");
    console.error("  - WeChat: https://mp.weixin.qq.com/s/xxx");
    process.exit(1);
  }
}

main().catch(console.error);
