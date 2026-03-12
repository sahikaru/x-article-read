import type { FxTweetResponse } from "../types";

/**
 * Fetch tweet data via fxtwitter API (no auth required).
 */
export async function fetchTweet(
  username: string,
  tweetId: string
): Promise<FxTweetResponse> {
  const url = `https://api.fxtwitter.com/${username}/status/${tweetId}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`fxtwitter API error: ${res.status} for tweet ${tweetId}`);
  return res.json() as Promise<FxTweetResponse>;
}

/**
 * Extract tweet ID and username from a tweet URL.
 */
export function extractTweetId(
  url: string
): { username: string; id: string } | null {
  const m = url.match(/(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/);
  if (!m) return null;
  return { username: m[1], id: m[2] };
}
