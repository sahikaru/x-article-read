import { describe, it, expect } from "vitest";
import {
  parseWeChatHtml,
  isWeChatUrl,
  extractWeChatId,
} from "../wechat";

const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Test Article" />
  <meta name="author" content="Zhang San" />
</head>
<body>
  <div class="rich_media">
    <h1 id="activity-name">Understanding DeFi Liquidity Pools</h1>
    <div id="meta_content">
      <span id="js_name">CryptoInsights</span>
    </div>
    <em id="publish_time">2026-03-10</em>
    <div id="js_content">
      <section>
        <p>Liquidity pools are the backbone of decentralized exchanges.</p>
        <p>They allow users to trade tokens without traditional order books.</p>
        <h2>How It Works</h2>
        <p>Automated Market Makers (AMMs) use a constant product formula.</p>
        <blockquote>Risk: Impermanent loss can significantly impact returns.</blockquote>
      </section>
    </div>
  </div>
</body>
</html>
`;

const ERROR_HTML = `
<!DOCTYPE html>
<html>
<head></head>
<body>
  <div class="weui-msg">参数错误</div>
</body>
</html>
`;

describe("WeChat parser", () => {
  it("extracts article data from valid HTML", () => {
    const result = parseWeChatHtml(SAMPLE_HTML, "https://mp.weixin.qq.com/s/abc123");

    expect(result.title).toBe("Understanding DeFi Liquidity Pools");
    expect(result.accountName).toBe("CryptoInsights");
    expect(result.publishDate).toBe("2026-03-10");
    expect(result.sourceUrl).toBe("https://mp.weixin.qq.com/s/abc123");
    expect(result.content).toContain("Liquidity pools");
    expect(result.content).toContain("Automated Market Makers");
    expect(result.content).toContain("How It Works");
    expect(result.content).toContain("Impermanent loss");
  });

  it("throws on error/invalid HTML", () => {
    expect(() =>
      parseWeChatHtml(ERROR_HTML, "https://mp.weixin.qq.com/s/bad")
    ).toThrow("Could not extract article title");
  });
});

describe("isWeChatUrl", () => {
  it("detects WeChat URLs", () => {
    expect(isWeChatUrl("https://mp.weixin.qq.com/s/abc123")).toBe(true);
    expect(isWeChatUrl("https://mp.weixin.qq.com/s?__biz=xxx&mid=123")).toBe(true);
    expect(isWeChatUrl("https://x.com/user/status/123")).toBe(false);
    expect(isWeChatUrl("https://google.com")).toBe(false);
  });
});

describe("extractWeChatId", () => {
  it("extracts ID from short URL", () => {
    expect(extractWeChatId("https://mp.weixin.qq.com/s/Kdm0L3VvYOk4B95K-bL_LA")).toBe(
      "Kdm0L3VvYOk4B95K-bL_LA"
    );
  });

  it("extracts ID from long URL with sn param", () => {
    expect(
      extractWeChatId(
        "https://mp.weixin.qq.com/s?__biz=MzA3&mid=100&idx=1&sn=abc123"
      )
    ).toBe("abc123");
  });

  it("extracts ID from long URL with mid+idx", () => {
    expect(
      extractWeChatId(
        "https://mp.weixin.qq.com/s?__biz=MzA3&mid=200&idx=2"
      )
    ).toBe("200_2");
  });
});
