const { fetchHtml } = require("./http");
const { textFromHtml } = require("./html_lite");
const { clampText } = require("./utils");

const RSS_ACCEPT = "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8";

function unwrapCdata(inner) {
  const t = String(inner).trim();
  const m = t.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return m ? m[1].trim() : t;
}

function innerTag(block, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return unwrapCdata(m[1]).trim();
}

function parseRssItems(xml, max) {
  const items = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < max) {
    const b = m[1];
    const title = textFromHtml(innerTag(b, "title"));
    let link = innerTag(b, "link").replace(/\s+/g, "").trim();
    if (!link || !link.startsWith("http")) {
      const g = innerTag(b, "guid").trim();
      if (g.startsWith("http")) link = g;
    }
    const rawDesc = innerTag(b, "description") || innerTag(b, "summary") || innerTag(b, "content:encoded");
    const desc = clampText(textFromHtml(rawDesc), 400);
    if (title.length > 8 && link.startsWith("http")) {
      items.push({ title, link, desc });
    }
  }
  return items;
}

function parseAtomEntries(xml, max) {
  const items = [];
  const re = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < max) {
    const b = m[1];
    const title = textFromHtml(innerTag(b, "title"));
    const lm = b.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
    const link = lm ? lm[1].trim() : "";
    const rawSum = innerTag(b, "summary") || innerTag(b, "content");
    const desc = clampText(textFromHtml(rawSum), 400);
    if (title.length > 5 && link.startsWith("http")) {
      items.push({ title, link, desc });
    }
  }
  return items;
}

function parseFeed(xml, max = 12) {
  const s = String(xml || "");
  const rss = parseRssItems(s, max);
  if (rss.length) return rss;
  return parseAtomEntries(s, max);
}

/**
 * GET RSS/Atom and map to crawler item shape (excerpt_en from description for summarizer).
 */
async function fetchFeedAsItems(url, sourceName, referer, max = 12) {
  const xml = await fetchHtml(url, {
    referer,
    timeoutMs: 18000,
    acceptHeader: RSS_ACCEPT,
  });
  const raw = parseFeed(xml, max);
  return raw.map((r) => ({
    title: clampText(r.title, 180),
    excerpt_en: r.desc || "",
    /* 留空以便 newsSummarizer 用 DeepSeek 生成中文；勿填英文占位否则不会跑摘要 */
    excerpt_zh: "",
    origin_url: r.link,
    origin_lang: "en",
    source: sourceName,
    category: "local",
    cover_image: "",
    created_at: new Date(),
    is_top: false,
  }));
}

module.exports = { parseFeed, fetchFeedAsItems };
