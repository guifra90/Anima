/**
 * ANIMA Web Skill - Executor
 * 
 * Handles all web:* tool calls.
 * Uses zero-config, zero-API-key services:
 * - Search: DuckDuckGo HTML API (free, no auth)
 * - Fetch:  Jina AI Reader (free, no auth, returns clean Markdown)
 * - News:   DuckDuckGo News Search (free, no auth)
 */

const https = require('https');
const http = require('http');

// ─────────────────────────────────────────────
// HTTP UTILS
// ─────────────────────────────────────────────

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'ANIMA-AgencyOS/1.0 (web skill; +https://anima.agency)',
        'Accept': 'text/html,application/json',
        ...options.headers
      },
      timeout: 20000,
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location, options).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)); });
  });
}

// ─────────────────────────────────────────────
// TOOL IMPLEMENTATIONS
// ─────────────────────────────────────────────

/**
 * web:search — DuckDuckGo Instant Answers + HTML scraping
 * Returns a list of { title, url, snippet } results.
 */
async function search({ query, maxResults = 5 }) {
  if (!query || !query.trim()) throw new Error('query is required');
  const limit = Math.min(maxResults, 10);
  const encoded = encodeURIComponent(query.trim());

  console.log(`[WEB-SKILL] search: "${query}"`);

  let html = '';
  try {
    // Strategy 1: DuckDuckGo HTML (Fast, but prone to 202/403)
    html = await httpGet(`https://html.duckduckgo.com/html/?q=${encoded}`);
  } catch (err) {
    console.warn(`[WEB-SKILL] DDG Search failed (${err.message}), trying Jina Search fallback...`);
    // Strategy 2: Jina AI Search (More resilient, cleaner results)
    try {
      const jinaSearchResult = await httpGet(`https://s.jina.ai/${encoded}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = JSON.parse(jinaSearchResult);
      if (data && data.data && data.data.length > 0) {
        return { 
          query, 
          results: data.data.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.description || r.content?.substring(0, 200) || ''
          })) 
        };
      }
    } catch (jinaErr) {
      throw new Error(`All search strategies failed. Last error: ${jinaErr.message}`);
    }
  }
  
  const results = [];
  // Extract results from DDG HTML using regex (no DOM parser needed)
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  
  const urls = [];
  const titles = [];
  const snippets = [];
  
  let m;
  while ((m = resultRegex.exec(html)) !== null && urls.length < limit) {
    const rawUrl = m[1];
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    // DDG often URL-encodes the real URL as a redirect
    const realUrl = rawUrl.startsWith('//duckduckgo.com/l/') 
      ? decodeURIComponent(rawUrl.replace(/.*uddg=/, ''))
      : rawUrl;
    if (realUrl.startsWith('http') && title) {
      urls.push(realUrl);
      titles.push(title);
    }
  }

  while ((m = snippetRegex.exec(html)) !== null && snippets.length < limit) {
    snippets.push(m[1].replace(/<[^>]+>/g, '').trim());
  }

  for (let i = 0; i < Math.min(urls.length, limit); i++) {
    results.push({
      title: titles[i] || 'Untitled',
      url: urls[i],
      snippet: snippets[i] || ''
    });
  }

  if (results.length === 0) {
    return { query, results: [], message: 'No results found. Try a different query.' };
  }

  return { query, results };
}

/**
 * web:fetch — Jina AI Reader
 * Fetches a URL and returns clean Markdown content.
 */
async function fetch({ url }) {
  if (!url || !url.trim()) throw new Error('url is required');
  
  const targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) throw new Error(`Invalid URL: ${targetUrl}`);
  
  console.log(`[WEB-SKILL] fetch: "${targetUrl}"`);

  // Use Jina AI Reader API: prepend r.jina.ai to any URL for clean Markdown
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;
  
  try {
    const content = await httpGet(jinaUrl, {
      headers: { 'Accept': 'text/plain' }
    });
    
    // Trim very long documents to avoid token overflow
    const MAX_CHARS = 12000;
    const trimmed = content.length > MAX_CHARS 
      ? content.substring(0, MAX_CHARS) + '\n\n... [Content trimmed for token budget]'
      : content;
    
    return {
      url: targetUrl,
      content: trimmed,
      chars: content.length,
      trimmed: content.length > MAX_CHARS
    };
  } catch (err) {
    throw new Error(`Failed to fetch "${targetUrl}": ${err.message}`);
  }
}

/**
 * web:news — DuckDuckGo News Search
 * Searches specifically for recent news on a topic.
 */
async function news({ topic, language = 'en' }) {
  if (!topic || !topic.trim()) throw new Error('topic is required');
  
  console.log(`[WEB-SKILL] news: "${topic}" (lang: ${language})`);

  // DuckDuckGo news endpoint
  const encoded = encodeURIComponent(topic.trim() + ' news');
  const html = await httpGet(`https://html.duckduckgo.com/html/?q=${encoded}&ia=news`);
  
  const results = [];
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  
  const urls = [];
  const titles = [];
  const snippets = [];
  
  let m;
  while ((m = resultRegex.exec(html)) !== null && urls.length < 8) {
    const rawUrl = m[1];
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    const realUrl = rawUrl.startsWith('//duckduckgo.com/l/')
      ? decodeURIComponent(rawUrl.replace(/.*uddg=/, ''))
      : rawUrl;
    if (realUrl.startsWith('http') && title) {
      urls.push(realUrl);
      titles.push(title);
    }
  }

  while ((m = snippetRegex.exec(html)) !== null && snippets.length < 8) {
    snippets.push(m[1].replace(/<[^>]+>/g, '').trim());
  }

  for (let i = 0; i < Math.min(urls.length, 8); i++) {
    results.push({
      title: titles[i] || 'Untitled',
      url: urls[i],
      snippet: snippets[i] || ''
    });
  }

  return { topic, results };
}

// ─────────────────────────────────────────────
// DISPATCHER
// ─────────────────────────────────────────────

/**
 * Main entrypoint called by ai-bridge-server.ts
 * Normalizes the tool name and routes to the correct implementation.
 */
async function run(toolName, args) {
  // Normalize: strip namespace prefix (e.g. "web:search" -> "search")
  const method = toolName.replace(/^web[_:]+/, '');

  console.log(`[WEB-EXECUTOR] Running tool: "${toolName}" -> method: "${method}"`, args);

  switch (method) {
    case 'search':
      return await search(args);
    case 'fetch':
      return await fetch(args);
    case 'news':
      return await news(args);
    default:
      throw new Error(`TOOL_NOT_IMPLEMENTED: web:${method}`);
  }
}

module.exports = { run };
