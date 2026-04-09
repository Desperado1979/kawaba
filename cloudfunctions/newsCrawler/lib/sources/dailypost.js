const cheerio = require("cheerio");
const { fetchHtml } = require("../http");
const { clampText } = require("../utils");

// Best-effort scraping. Selectors may change; we fail gracefully.
const BASE = "https://dailypost.vu";

function absUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return BASE + href;
  return BASE + "/" + href;
}

async function crawlDailyPost() {
  const html = await fetchHtml(`${BASE}/news/`);
  const $ = cheerio.load(html);

  const items = [];

  // Try common article-card patterns.
  const candidates = $("a")
    .map((_, a) => {
      const href = $(a).attr("href");
      const text = $(a).text();
      return { href, text };
    })
    .get()
    .filter((x) => x.href && String(x.href).includes("/news/") && x.text && x.text.trim().length > 15);

  // De-dupe by href.
  const seen = new Set();
  for (const c of candidates) {
    const url = absUrl(c.href);
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      title: clampText(c.text, 120),
      excerpt_en: "",
      excerpt_zh: "",
      origin_url: url,
      origin_lang: "en",
      source: "Vanuatu Daily Post",
      category: "local",
      cover_image: "",
      created_at: new Date(),
      is_top: false,
    });
    if (items.length >= 12) break;
  }

  // Optional: fetch detail for first few to get excerpt.
  const detailCount = Math.min(6, items.length);
  for (let i = 0; i < detailCount; i++) {
    try {
      const detailHtml = await fetchHtml(items[i].origin_url);
      const $$ = cheerio.load(detailHtml);
      const p = $$(".article-content p").first().text() || $$("p").first().text();
      items[i].excerpt_en = clampText(p, 240);
      // “translation” policy: only generate a short Chinese summary placeholder
      items[i].excerpt_zh = items[i].excerpt_en ? `英文摘要：${items[i].excerpt_en}` : "";
    } catch (_) {
      // ignore
    }
  }

  return items;
}

module.exports = { crawlDailyPost };

