#!/usr/bin/env tsx
/**
 * Check which articles are missing interpretations.
 *
 * Usage:
 *   npx tsx src/interpret.ts                  # list articles needing interpretation
 *   npx tsx src/interpret.ts --output=<dir>   # specify output directory
 *
 * This script only identifies articles that need interpretation.
 * Actual interpretation is done by Claude Code agents using the prompt template.
 */

import path from 'path';
import { getAllArticles, hasInterpretation } from './articles.js';

function main() {
  const outputArg = process.argv.find((a) => a.startsWith('--output='));
  const outputDir = outputArg
    ? outputArg.split('=')[1]
    : path.join(process.cwd(), 'output', 'articles');

  const articles = getAllArticles(outputDir);
  const needsInterpretation = articles.filter((a) => !hasInterpretation(a));
  const hasIt = articles.filter((a) => hasInterpretation(a));

  console.log(`\n=== Article Interpretation Status ===`);
  console.log(`Total: ${articles.length} | Done: ${hasIt.length} | Pending: ${needsInterpretation.length}\n`);

  if (needsInterpretation.length > 0) {
    console.log('--- Needs Interpretation ---');
    for (const a of needsInterpretation) {
      console.log(`  ${a.meta.date} | ${a.meta.title.slice(0, 50)}...`);
      console.log(`    File: ${a.filePath}`);
    }
  }

  if (hasIt.length > 0) {
    console.log('\n--- Has Interpretation ---');
    for (const a of hasIt) {
      console.log(`  ${a.meta.date} | ${a.meta.title.slice(0, 50)}...`);
    }
  }

  // Output the prompt template for AI interpretation
  if (needsInterpretation.length > 0) {
    console.log('\n--- Interpretation Prompt Template ---');
    console.log(`
For each article that needs interpretation, use the following prompt with Claude:

Read the file <file_path> and replace the placeholder interpretation section.

Rules:
- Write in Chinese (简体中文)
- Keep professional/technical terms in English
- Use <Callout type="warning"> for risk disclaimers
- Use <Callout type="info"> for key insights
- Cover: what the strategy/concept is, how it works, why it matters, risks
- Update the tags in frontmatter to relevant topics

Replace the entire section from "## 解读" to the end of the file.
`);
  }
}

main();
