const { fetchHtml } = require("../http");
const { clampText } = require("../utils");
const { walkAnchors, firstParagraphText } = require("../html_lite");

/* 使用 www 与站点主站一致，部分 CDN 对裸域 / Bot UA 会 403 */
const BASE = "https://www.dailypost.vu";

function absUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return BASE + href;
  return BASE + "/" + href;
}

async function fetchDetailExcerpt(item, listUrl) {
  try {
    const detailHtml = await fetchHtml(item.origin_url, { referer: listUrl });
    let p = firstParagraphText(detailHtml, 30);
    if (!p) p = firstParagraphText(detailHtml, 12);
    item.excerpt_en = clampText(p, 240);
    item.excerpt_zh = item.excerpt_en ? `英文摘要：${item.excerpt_en}` : "";
  } catch (_) {
    // ignore
  }
}

async function crawlDailyPost() {
  const listUrl = `${BASE}/news/`;
  const html = await fetchHtml(listUrl, { referer: `${BASE}/` });
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
    if (items.length >= 10) break;
  }

  const detailCount = Math.min(3, items.length);
  await Promise.all(items.slice(0, detailCount).map((item) => fetchDetailExcerpt(item, listUrl)));

  return items;
}

module.exports = { crawlDailyPost };
