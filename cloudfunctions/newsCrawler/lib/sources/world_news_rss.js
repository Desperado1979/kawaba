const { fetchFeedAsItems } = require("../rss_feed");

/**
 * CGTN World — 中国国际电视台英文世界新闻，覆盖面广
 */
async function crawlCgtnWorldRss() {
  const items = await fetchFeedAsItems(
    "https://www.cgtn.com/subscribe/rss/section/world.xml",
    "CGTN",
    "https://www.cgtn.com/",
    8
  );
  return items.map((i) => ({ ...i, category: "world" }));
}

/**
 * UN News (Peace & Security) — 联合国新闻，最客观中立，聚焦国际冲突与安全
 */
async function crawlUnNewsPeaceRss() {
  const items = await fetchFeedAsItems(
    "https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/feed/rss.xml",
    "UN News",
    "https://news.un.org/",
    8
  );
  return items.map((i) => ({ ...i, category: "world" }));
}

module.exports = { crawlCgtnWorldRss, crawlUnNewsPeaceRss };
