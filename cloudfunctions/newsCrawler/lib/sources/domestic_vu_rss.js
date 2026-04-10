const { fetchFeedAsItems } = require("../rss_feed");

const MAX_AGE_DAYS = 45;

/** 仅标题/摘要与「瓦努阿图 / Port Vila / 中瓦 / 使馆语境」相关；不要用泛化的 pacific（会误伤日本台风等）。 */
const VU_STRICT =
  /vanuatu|port\s*vila|ni-?vanuatu|瓦努阿图|中瓦|驻瓦(?:努阿图)?(?:使馆|大使)?|瓦国|维拉港/i;

function filterVuStrict(items) {
  return items.filter((it) => VU_STRICT.test(`${it.title || ""} ${it.excerpt_en || ""}`));
}

function filterRecent(items, days = MAX_AGE_DAYS) {
  const cutoff = Date.now() - days * 86400000;
  return items.filter((it) => {
    const t = it.created_at instanceof Date ? it.created_at.getTime() : new Date(it.created_at).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

/** 意思一下：门户里「明确提到瓦努阿图」的稿，近期有效；不追求覆盖面。 */
async function crawlChinaDailyVanuatuOnly() {
  const url = "https://www.chinadaily.com.cn/rss/world_rss.xml";
  const all = await fetchFeedAsItems(url, "China Daily", "https://www.chinadaily.com.cn/", 80);
  return filterVuStrict(filterRecent(all)).slice(0, 5);
}

async function crawlXinhuaVanuatuOnly() {
  const url = "http://www.xinhuanet.com/english/rss/worldrss.xml";
  const all = await fetchFeedAsItems(url, "Xinhua", "http://www.xinhuanet.com/", 80);
  return filterVuStrict(filterRecent(all)).slice(0, 5);
}

module.exports = { crawlChinaDailyVanuatuOnly, crawlXinhuaVanuatuOnly, VU_STRICT, filterRecent };
