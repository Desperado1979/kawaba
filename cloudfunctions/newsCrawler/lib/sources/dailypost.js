const { fetchHtml } = require("../http");
const { clampText } = require("../utils");
const { walkAnchors, firstParagraphText } = require("../html_lite");

const BASE = "https://dailypost.vu";

function absUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return BASE + href;
  return BASE + "/" + href;
}

async function crawlDailyPost() {
  const html = await fetchHtml(`${BASE}/news/`);
  const items = [];

  const seen = new Set();
  for (const { href, text } of walkAnchors(html)) {
    if (!href || !String(href).includes("/news/") || !text || text.trim().length < 15) continue;
    const url = absUrl(href);
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      title: clampText(text, 120),
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

  const detailCount = Math.min(6, items.length);
  for (let i = 0; i < detailCount; i++) {
    try {
      const detailHtml = await fetchHtml(items[i].origin_url);
      let p = firstParagraphText(detailHtml, 30);
      if (!p) p = firstParagraphText(detailHtml, 12);
      items[i].excerpt_en = clampText(p, 240);
      items[i].excerpt_zh = items[i].excerpt_en ? `英文摘要：${items[i].excerpt_en}` : "";
    } catch (_) {
      // ignore
    }
  }

  return items;
}

module.exports = { crawlDailyPost };
