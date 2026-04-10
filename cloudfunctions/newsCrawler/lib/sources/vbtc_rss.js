const { fetchFeedAsItems } = require("../rss_feed");

/**
 * VBTC — 瓦努阿图国家广播电视台（英语 + 比斯拉马语混合）
 * WordPress 标准 RSS，体量小，更新频繁，纯本地新闻。
 */
async function crawlVbtcRss() {
  return fetchFeedAsItems(
    "https://vbtc.vu/feed/",
    "VBTC",
    "https://vbtc.vu/",
    15
  );
}

module.exports = { crawlVbtcRss };
