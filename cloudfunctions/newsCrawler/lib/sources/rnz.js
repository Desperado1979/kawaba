const cheerio = require("cheerio");
const { fetchHtml } = require("../http");
const { clampText } = require("../utils");

const BASE = "https://www.rnz.co.nz";

function absUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return BASE + href;
  return BASE + "/" + href;
}

async function crawlRnzPacific() {
  const html = await fetchHtml(`${BASE}/international/pacific-news`);
  const $ = cheerio.load(html);

  const items = [];
  const seen = new Set();

  // RNZ uses article teasers; try to collect titles and urls.
  $("a").each((_, a) => {
    const href = $(a).attr("href");
    const title = $(a).text();
    if (!href || !title) return;
    if (!String(href).includes("/international/pacific-news/")) return;
    const t = title.trim();
    if (t.length < 18) return;
    const url = absUrl(href);
    if (seen.has(url)) return;
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
    if (items.length >= 12) return false;
  });

  const detailCount = Math.min(6, items.length);
  for (let i = 0; i < detailCount; i++) {
    try {
      const detailHtml = await fetchHtml(items[i].origin_url);
      const $$ = cheerio.load(detailHtml);
      const p =
        $$(".article__body p").first().text() ||
        $$(".article-body p").first().text() ||
        $$("p").first().text();
      items[i].excerpt_en = clampText(p, 240);
      items[i].excerpt_zh = items[i].excerpt_en ? `英文摘要：${items[i].excerpt_en}` : "";
    } catch (_) {}
  }

  return items;
}

module.exports = { crawlRnzPacific };

