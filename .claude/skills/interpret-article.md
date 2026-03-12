# Interpret Article

Interpret tweet/article content for a Chinese-speaking financial audience.

## Workflow

1. Use `list_pending_articles` to find uninterpreted articles
2. Use `get_article_content` to read the full article
3. Write interpretation following the rules below
4. Use `save_interpretation` to save the result

## Interpretation Rules

- Write in Chinese (简体中文)
- Keep professional/technical terms in English: Martingale, Grid Trading, LP, DeFi, NFT, MEV, TVL, APY, Funding Rate, Basis Trade, etc.
- Structure with clear sections
- Use `<Callout type="warning">` for risk disclaimers
- Use `<Callout type="info">` for key insights
- Suggest 3-5 relevant tags

## Output Format

The interpretation should include:
1. Context/background of the topic
2. Key points analysis
3. Market implications (if applicable)
4. Risk warnings (using Callout)
5. Key takeaways (using Callout)
