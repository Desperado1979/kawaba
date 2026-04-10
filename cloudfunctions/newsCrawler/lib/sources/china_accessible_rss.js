const { fetchFeedAsItems } = require("../rss_feed");

/**
 * 中国大陆访问海外 RNZ/BBC/Google RSS 常超时；改用国内英文门户 RSS，再按关键词筛太平洋/瓦努阿图相关。
 */
const PACIFIC =
  /vanuatu|port\s*vila|\bvila\b|pacific|oceania|fiji|tonga|samoa|solomon|papua|new\s+caledonia|ni-?vanuatu|nauru|kiribati|tuvalu|micronesia|palau|marshall|melanesia|polynesia/i;

function filterPacific(items) {
  return items.filter((it) => {
    const blob = `${it.title || ""} ${it.excerpt_en || ""}`;
    return PACIFIC.test(blob);
  });
}

async function crawlChinaDailyPacific() {
  const url = "https://www.chinadaily.com.cn/rss/world_rss.xml";
  const all = await fetchFeedAsItems(url, "China Daily", "https://www.chinadaily.com.cn/", 45);
  return filterPacific(all).slice(0, 12);
}

async function crawlXinhuaPacific() {
  const url = "http://www.xinhuanet.com/english/rss/worldrss.xml";
  const all = await fetchFeedAsItems(url, "Xinhua", "http://www.xinhuanet.com/", 45);
  return filterPacific(all).slice(0, 12);
}

module.exports = { crawlChinaDailyPacific, crawlXinhuaPacific };
