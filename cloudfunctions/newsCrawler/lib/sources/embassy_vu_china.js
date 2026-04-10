const { fetchHtml } = require("../http");
const { walkAnchors } = require("../html_lite");
const { clampText } = require("../utils");

/**
 * 中国驻瓦努阿图大使馆 · 使馆动态（中文列表）
 * 列表页：https://vu.china-embassy.gov.cn/chn/sgdt/
 */
const ORIGIN = "https://vu.china-embassy.gov.cn";
const LIST_PATH = "/chn/sgdt/";

function normalizeLink(href, listUrl) {
  if (!href) return "";
  const h = href.trim();
  try {
    return new URL(h, listUrl).href;
  } catch {
    return "";
  }
}

/** 稿件路径多为 /chn/.../20260x/t20260xxx_1184xxxx.htm */
function looksLikeEmbassyArticle(url) {
  if (!url || !/vu\.china-embassy\.gov\.cn/i.test(url)) return false;
  if (/\.(pdf|jpg|jpeg|png|zip)(\?|$)/i.test(url)) return false;
  return /\/\d{6}\/t\d+_\d+\.htm(\?.*)?$/i.test(url);
}

async function crawlEmbassyVanuatuChina() {
  const listUrl = `${ORIGIN}${LIST_PATH}`;
  const html = await fetchHtml(listUrl, {
    referer: `${ORIGIN}/`,
    timeoutMs: 22000,
  });
  const items = [];
  const seen = new Set();

  for (const { href, text } of walkAnchors(html)) {
    const abs = normalizeLink(href, listUrl);
    if (!abs || !looksLikeEmbassyArticle(abs)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    const title = clampText(String(text || "").replace(/\s+/g, " ").trim(), 220);
    if (title.length < 4) continue;
    items.push({
      title,
      excerpt_en: "",
      excerpt_zh: "",
      origin_url: abs,
      origin_lang: "zh",
      source: "中国驻瓦努阿图使馆",
      category: "chinese",
      cover_image: "",
      created_at: new Date(),
      is_top: false,
    });
    if (items.length >= 10) break;
  }

  return items;
}

module.exports = { crawlEmbassyVanuatuChina };
