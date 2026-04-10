const { fetchHtml } = require("../http");
const { clampText } = require("../utils");
const { walkAnchors, firstParagraphText } = require("../html_lite");

const BASE = "https://www.rnz.co.nz";

function absUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return BASE + href;
  return BASE + "/" + href;
}

async function crawlRnzPacific() {
  const html = await fetchHtml(`${BASE}/international/pacific-news`);
  const items = [];
  const seen = new Set();

  for (const { href, text: title } of walkAnchors(html)) {
    if (!href || !title) continue;
    if (!String(href).includes("/international/pacific-news/")) continue;
    const t = title.trim();
    if (t.length < 18) continue;
    const url = absUrl(href);
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      title: clampText(t, 140),
      excerpt_en: "",
      excerpt_zh: "",
      origin_url: url,
      origin_lang: "en",
      source: "RNZ Pacific",
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
    } catch (_) {}
  }

  return items;
}

module.exports = { crawlRnzPacific };
