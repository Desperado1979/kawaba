const axios = require("axios");
const { textFromHtml } = require("../html_lite");
const { clampText } = require("../utils");

/** ReliefWeb v2 JSON API — 体量小，部分网络环境下比海外 RSS 更易连通。appname 请用可识别字符串，必要时到 reliefweb 登记。 */
const API = "https://api.reliefweb.int/v2/reports";
const APPNAME = "kavabar-wx-miniprogram";

async function crawlReliefWebVanuatu() {
  const { data } = await axios.post(
    `${API}?appname=${encodeURIComponent(APPNAME)}`,
    {
      limit: 12,
      preset: "latest",
      filter: {
        conditions: [{ field: "country.iso3", value: "VUT" }],
        operator: "AND",
      },
      fields: {
        include: ["title", "url", "date", "body-html"],
      },
    },
    {
      timeout: 32000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "KavabarNewsCrawler/1.0",
      },
      validateStatus: (s) => s >= 200 && s < 300,
    }
  );

  const rows = Array.isArray(data?.data) ? data.data : [];
  const items = [];
  for (const row of rows) {
    const f = row.fields || {};
    const title = (f.title || "").trim();
    const origin_url = (f.url || "").trim();
    if (!title || !origin_url.startsWith("http")) continue;
    const excerpt_en = clampText(textFromHtml(f["body-html"] || ""), 400);
    items.push({
      title: clampText(title, 200),
      excerpt_en,
      excerpt_zh: "",
      origin_url,
      origin_lang: "en",
      source: "ReliefWeb",
      category: "local",
      cover_image: "",
      created_at: f.date ? new Date(f.date) : new Date(),
      is_top: false,
    });
  }
  return items;
}

module.exports = { crawlReliefWebVanuatu };
