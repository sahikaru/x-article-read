import * as cheerio from "cheerio";

export interface WeChatArticle {
  title: string;
  author: string;
  accountName: string;
  publishDate: string;
  content: string;
  sourceUrl: string;
  coverImage?: string;
}

/**
 * Fetch and parse a WeChat public account article from its URL.
 * Works with mp.weixin.qq.com/s/ URLs.
 */
export async function fetchWeChatArticle(
  url: string
): Promise<WeChatArticle> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch WeChat article: ${res.status}`);
  }

  const html = await res.text();
  return parseWeChatHtml(html, url);
}

/**
 * Parse WeChat article HTML and extract structured data.
 */
export function parseWeChatHtml(
  html: string,
  sourceUrl: string
): WeChatArticle {
  const $ = cheerio.load(html);

  // Title: #activity-name or .rich_media_title
  const title = (
    $("#activity-name").text() ||
    $(".rich_media_title").text() ||
    ""
  ).trim();

  if (!title) {
    throw new Error(
      "Could not extract article title. The URL may be invalid or expired."
    );
  }

  // Account name: #js_name or .profile_nickname
  const accountName = (
    $("#js_name").text() ||
    $(".profile_nickname").text() ||
    ""
  ).trim();

  // Author: #js_author_name or meta tag, fallback to account name
  const author = (
    $("meta[name='author']").attr("content") ||
    $("#js_author_name").text() ||
    ""
  ).trim() || accountName;

  // Publish date: #publish_time or meta property
  let publishDate =
    $("#publish_time").text().trim() ||
    $("meta[property='og:article:published_time']").attr("content") ||
    "";

  // Try to extract date from script tags (var ct = "timestamp")
  if (!publishDate) {
    const ctMatch = html.match(/var\s+ct\s*=\s*"(\d+)"/);
    if (ctMatch) {
      publishDate = new Date(parseInt(ctMatch[1]) * 1000).toISOString();
    }
  }

  if (!publishDate) {
    publishDate = new Date().toISOString();
  }

  // Content: #js_content or .rich_media_content
  const contentEl = $("#js_content").length
    ? $("#js_content")
    : $(".rich_media_content");

  // Remove hidden elements, scripts, styles
  contentEl.find("script, style, .reward_area, .like_area").remove();

  // Extract text content, preserving paragraph structure
  const content = extractTextContent($, contentEl);

  // Cover image
  const coverImage =
    $("meta[property='og:image']").attr("content") ||
    $("meta[property='twitter:image']").attr("content") ||
    undefined;

  return {
    title,
    author,
    accountName,
    publishDate,
    content,
    sourceUrl,
    coverImage,
  };
}

/**
 * Extract clean text content from WeChat article body,
 * preserving paragraph structure.
 */
function extractTextContent(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el: cheerio.Cheerio<any>
): string {
  const blocks: string[] = [];

  el.find("p, section, h1, h2, h3, h4, blockquote").each((_, elem) => {
    const $elem = $(elem);
    // Skip if this element is nested inside another block we'll process
    if ($elem.parents("p, blockquote").length > 0 && elem.tagName !== "blockquote") {
      return;
    }
    const text = $elem.text().trim();
    if (text) {
      const tag = elem.tagName;
      if (tag === "blockquote") {
        blocks.push(`> ${text}`);
      } else if (tag?.match(/^h[1-4]$/)) {
        const level = parseInt(tag[1]);
        blocks.push(`${"#".repeat(level)} ${text}`);
      } else {
        blocks.push(text);
      }
    }
  });

  // If block extraction yielded nothing, fallback to raw text
  if (blocks.length === 0) {
    const rawText = el.text().trim();
    return rawText;
  }

  return blocks.join("\n\n");
}

/**
 * Check if a URL is a WeChat article URL.
 */
export function isWeChatUrl(url: string): boolean {
  return /mp\.weixin\.qq\.com\/s/.test(url);
}

/**
 * Extract a stable identifier from a WeChat URL.
 * WeChat URLs use query params like __biz, mid, idx, sn.
 */
export function extractWeChatId(url: string): string {
  // Short URL format: mp.weixin.qq.com/s/XXXXX
  const shortMatch = url.match(/mp\.weixin\.qq\.com\/s\/([A-Za-z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  // Long URL format: use sn parameter as unique ID
  try {
    const u = new URL(url);
    const sn = u.searchParams.get("sn");
    if (sn) return sn;
    const mid = u.searchParams.get("mid");
    const idx = u.searchParams.get("idx");
    if (mid && idx) return `${mid}_${idx}`;
  } catch {
    // ignore
  }

  // Fallback: hash the URL
  return url.replace(/[^a-zA-Z0-9]/g, "").slice(-20);
}
