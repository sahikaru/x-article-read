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

/** Article list item from mp.weixin.qq.com admin API */
export interface WeChatArticleListItem {
  aid: string;
  title: string;
  digest: string;
  link: string;
  cover: string;
  createTime: number; // unix timestamp
}

/** Search result for a WeChat public account */
export interface WeChatAccountInfo {
  fakeid: string;
  nickname: string;
  alias: string;
  roundHeadImg: string;
  serviceType: number;
}

// ---------------------------------------------------------------------------
// Single article fetch (public URL, no auth needed)
// ---------------------------------------------------------------------------

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

  const accountName = (
    $("#js_name").text() ||
    $(".profile_nickname").text() ||
    ""
  ).trim();

  const author = (
    $("meta[name='author']").attr("content") ||
    $("#js_author_name").text() ||
    ""
  ).trim() || accountName;

  let publishDate =
    $("#publish_time").text().trim() ||
    $("meta[property='og:article:published_time']").attr("content") ||
    "";

  if (!publishDate) {
    const ctMatch = html.match(/var\s+ct\s*=\s*"(\d+)"/);
    if (ctMatch) {
      publishDate = new Date(parseInt(ctMatch[1]) * 1000).toISOString();
    }
  }

  if (!publishDate) {
    publishDate = new Date().toISOString();
  }

  const contentEl = $("#js_content").length
    ? $("#js_content")
    : $(".rich_media_content");

  contentEl.find("script, style, .reward_area, .like_area").remove();

  const content = extractTextContent($, contentEl);

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

function extractTextContent(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el: cheerio.Cheerio<any>
): string {
  const blocks: string[] = [];

  el.find("p, section, h1, h2, h3, h4, blockquote").each((_, elem) => {
    const $elem = $(elem);
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

  if (blocks.length === 0) {
    return el.text().trim();
  }

  return blocks.join("\n\n");
}

export function isWeChatUrl(url: string): boolean {
  return /mp\.weixin\.qq\.com\/s/.test(url);
}

export function extractWeChatId(url: string): string {
  const shortMatch = url.match(/mp\.weixin\.qq\.com\/s\/([A-Za-z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

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

  return url.replace(/[^a-zA-Z0-9]/g, "").slice(-20);
}

// ---------------------------------------------------------------------------
// Batch fetch via mp.weixin.qq.com admin API (requires token + cookie)
// ---------------------------------------------------------------------------

const MP_BASE = "https://mp.weixin.qq.com/cgi-bin";
const DEFAULT_DELAY_MS = 5000; // 5 seconds between requests

function mpHeaders(cookie: string): Record<string, string> {
  return {
    Cookie: cookie,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://mp.weixin.qq.com/",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Search for a WeChat public account by name.
 * Requires mp.weixin.qq.com token and cookie.
 */
export async function searchWeChatAccount(
  query: string,
  token: string,
  cookie: string
): Promise<WeChatAccountInfo[]> {
  const url = `${MP_BASE}/searchbiz?action=search_biz&begin=0&count=5&query=${encodeURIComponent(query)}&token=${token}&lang=zh_CN&f=json&ajax=1`;

  const res = await fetch(url, { headers: mpHeaders(cookie) });
  if (!res.ok) throw new Error(`WeChat search failed: ${res.status}`);

  const data = await res.json();
  if (data.base_resp?.ret !== 0) {
    throw new Error(
      `WeChat API error: ${data.base_resp?.err_msg || "unknown"} (code: ${data.base_resp?.ret})`
    );
  }

  return (data.list || []).map((item: Record<string, unknown>) => ({
    fakeid: item.fakeid as string,
    nickname: item.nickname as string,
    alias: item.alias as string,
    roundHeadImg: item.round_head_img as string,
    serviceType: item.service_type as number,
  }));
}

/**
 * Fetch article list for a WeChat public account by fakeid.
 * Paginates through all articles with rate limiting.
 *
 * @param onProgress - callback with (fetched, total_estimate) for progress reporting
 */
export async function fetchWeChatAccountArticles(
  fakeid: string,
  token: string,
  cookie: string,
  options?: {
    maxArticles?: number;
    delayMs?: number;
    onProgress?: (fetched: number) => void;
  }
): Promise<WeChatArticleListItem[]> {
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
  const maxArticles = options?.maxArticles ?? 500;
  const allArticles: WeChatArticleListItem[] = [];
  let begin = 0;
  const count = 5; // WeChat API max per page

  while (allArticles.length < maxArticles) {
    const url = `${MP_BASE}/appmsg?action=list_ex&begin=${begin}&count=${count}&fakeid=${fakeid}&type=9&query=&token=${token}&lang=zh_CN&f=json&ajax=1`;

    const res = await fetch(url, { headers: mpHeaders(cookie) });
    if (!res.ok) throw new Error(`WeChat article list failed: ${res.status}`);

    const data = await res.json();
    if (data.base_resp?.ret !== 0) {
      const code = data.base_resp?.ret;
      if (code === 200013) {
        // Frequency limit hit
        throw new Error(
          "WeChat rate limit reached. Please wait a few minutes and try again."
        );
      }
      throw new Error(
        `WeChat API error: ${data.base_resp?.err_msg || "unknown"} (code: ${code})`
      );
    }

    const items: WeChatArticleListItem[] = (data.app_msg_list || []).map(
      (item: Record<string, unknown>) => ({
        aid: String(item.aid),
        title: item.title as string,
        digest: item.digest as string,
        link: (item.link as string).replace(/&amp;/g, "&"),
        cover: item.cover as string,
        createTime: item.create_time as number,
      })
    );

    if (items.length === 0) break;

    allArticles.push(...items);
    options?.onProgress?.(allArticles.length);

    // Check if there are more
    if (data.app_msg_cnt && allArticles.length >= data.app_msg_cnt) break;
    if (items.length < count) break;

    begin += count;

    // Rate limiting — critical to avoid account ban
    await sleep(delayMs);
  }

  return allArticles;
}
