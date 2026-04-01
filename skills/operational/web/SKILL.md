---
name: web
description: >
  Read and search the internet. Use it to fetch real-time news, research topics,
  read articles, and gather external information from any public URL.
---

# Web Skill

This skill allows agents to access the public internet to retrieve real, up-to-date information. Use it before analyzing trends, writing reports, or answering questions that require current knowledge.

## When to Use

- **News research**: Fetch the latest AI, tech, or industry news.
- **URL reading**: Read the content of any public web page or article.
- **Topic research**: Search for specific information before writing a report.

## Search & Fetch

Use `web:search` to find relevant pages for a topic. Then use `web:fetch` to read the full content of a specific URL from the results.

### Suggested Workflow for News Reports:
1. `web:search` for the topic (e.g., "artificial intelligence news this week").
2. Pick the 2-3 most relevant URLs from the results.
3. `web:fetch` each URL to read the full article content.
4. Synthesize the real content into your report.

## Rules
- **Always use real data**: Never summarize or invent content you haven't fetched.
- **Respect focus**: Only read URLs relevant to the current task.
- **Cite sources**: When reporting news, always mention the source URL.
- **Efficient fetching**: Fetch a maximum of 3-5 URLs per task to stay within token limits.
