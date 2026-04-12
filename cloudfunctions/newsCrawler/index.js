const cloud = require("wx-server-sdk");
const { crawlCgtnWorldRss, crawlUnNewsPeaceRss } = require("./lib/sources/world_news_rss");
const { crawlVbtcRss } = require("./lib/sources/vbtc_rss");
const { crawlEmbassyVanuatuChina } = require("./lib/sources/embassy_vu_china");
const { crawlChinaDailyVanuatuOnly, crawlXinhuaVanuatuOnly } = require("./lib/sources/domestic_vu_rss");
const { crawlReliefWebVanuatu } = require("./lib/sources/reliefweb_vanuatu");
const {
  crawlRnzPacificRss,
  crawlBbcAsiaRss,
  crawlGoogleVanuatuRss,
} = require("./lib/sources/rss_sources");
const { md5 } = require("./lib/utils");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function toHtmlExcerpt({ title, excerpt, url, source }) {
  const safeTitle = title || "";
  const safeExcerpt = excerpt || "";
  const safeUrl = url || "";
  const safeSource = source || "";
  const link = safeUrl
    ? `<p><a href="${safeUrl}" target="_blank" rel="noreferrer">来源: ${safeSource || "链接"}</a></p>`
    : "";
  return `<h3>${safeTitle}</h3><p>${safeExcerpt}</p>${link}`;
}

async function upsertNews(items) {
  const inserted = [];
  const skipped = [];
  const failed = [];

  for (const item of items) {
    const title = (item.title || "").trim();
    const originUrl = (item.origin_url || "").trim();
    if (!title || !originUrl) {
      skipped.push({ reason: "missing_title_or_url", title, originUrl });
      continue;
    }

    const titleHash = md5(`${item.source || ""}::${title}::${originUrl}`);

    const exists = await db
      .collection("news")
      .where({ title_hash: titleHash })
      .limit(1)
      .get();

    if (exists.data && exists.data.length > 0) {
      skipped.push({ reason: "duplicate", title, originUrl });
      continue;
    }

    const doc = {
      title,
      content: toHtmlExcerpt({
        title,
        excerpt: item.excerpt_zh || item.excerpt_en || "",
        url: originUrl,
        source: item.source,
      }),
      category: item.category || "local",
      source: item.source || "Kavabar",
      cover_image: item.cover_image || "",
      view_count: 0,
      is_top: Boolean(item.is_top),
      created_at: item.created_at ? new Date(item.created_at) : new Date(),
      fetched_at: new Date(),
      origin_url: originUrl,
      origin_lang: item.origin_lang || "en",
      excerpt_en: item.excerpt_en || "",
      excerpt_zh: item.excerpt_zh || "",
      title_hash: titleHash,
    };

    try {
      const res = await db.collection("news").add({ data: doc });
      inserted.push({ _id: res._id, title, originUrl });
    } catch (e) {
      failed.push({ title, originUrl, errMsg: e.message || String(e) });
    }
  }

  return { inserted, skipped, failed };
}

const PER_SOURCE_MS = 28000;

function cappedCrawl(ms, fn) {
  let t;
  const cap = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(`exceeded ${ms}ms`)), ms);
  });
  return Promise.race([fn(), cap]).finally(() => clearTimeout(t));
}

function sourceStatus(result, label) {
  if (result.status !== "fulfilled") {
    return `fail: ${result.reason?.message || result.reason || label}`;
  }
  const arr = result.value;
  if (!Array.isArray(arr) || arr.length === 0) return "empty";
  return "ok";
}

async function runCrawl() {
  const overseas = process.env.ENABLE_OVERSEAS_RSS === "1";
  const enableReliefWeb = process.env.ENABLE_RELIEFWEB === "1";

  const jobs = [
    ["cgtn_world", () => cappedCrawl(PER_SOURCE_MS, crawlCgtnWorldRss)],
    ["un_news", () => cappedCrawl(PER_SOURCE_MS, crawlUnNewsPeaceRss)],
    ["vbtc_local", () => cappedCrawl(PER_SOURCE_MS, crawlVbtcRss)],
    ["embassy_vu", () => cappedCrawl(PER_SOURCE_MS, crawlEmbassyVanuatuChina)],
    ["chinadaily_vanuatu", () => cappedCrawl(PER_SOURCE_MS, crawlChinaDailyVanuatuOnly)],
    ["xinhua_vanuatu", () => cappedCrawl(PER_SOURCE_MS, crawlXinhuaVanuatuOnly)],
  ];
  if (enableReliefWeb) {
    jobs.unshift(["reliefweb_vut", () => cappedCrawl(PER_SOURCE_MS, crawlReliefWebVanuatu)]);
  }

  const settled = await Promise.allSettled(jobs.map(([, fn]) => fn()));

  const sources = {};
  const items = [];
  settled.forEach((r, i) => {
    const key = jobs[i][0];
    sources[key] = sourceStatus(r, key);
    if (r.status === "fulfilled") items.push(...r.value);
  });

  if (!enableReliefWeb) {
    sources.reliefweb_vut = "skipped(env ENABLE_RELIEFWEB!=1)";
  }
  if (!overseas) {
    sources.rnz_rss = "skipped(env ENABLE_OVERSEAS_RSS!=1)";
    sources.bbc_asia_rss = "skipped(env ENABLE_OVERSEAS_RSS!=1)";
    sources.google_vanuatu_rss = "skipped(env ENABLE_OVERSEAS_RSS!=1)";
  } else {
    const [rnzRes, bbcRes, gRes] = await Promise.allSettled([
      cappedCrawl(PER_SOURCE_MS, crawlRnzPacificRss),
      cappedCrawl(PER_SOURCE_MS, crawlBbcAsiaRss),
      cappedCrawl(PER_SOURCE_MS, crawlGoogleVanuatuRss),
    ]);
    sources.rnz_rss = sourceStatus(rnzRes, "rnz_rss");
    sources.bbc_asia_rss = sourceStatus(bbcRes, "bbc_asia_rss");
    sources.google_vanuatu_rss = sourceStatus(gRes, "google_vanuatu_rss");
    if (rnzRes.status === "fulfilled") items.push(...rnzRes.value);
    if (bbcRes.status === "fulfilled") items.push(...bbcRes.value);
    if (gRes.status === "fulfilled") items.push(...gRes.value);
  }

  const deduped = [];
  const seenUrl = new Set();
  for (const it of items) {
    const u = (it.origin_url || "").trim();
    if (!u || seenUrl.has(u)) continue;
    seenUrl.add(u);
    deduped.push(it);
  }

  const res = await upsertNews(deduped);
  return {
    success: true,
    sources,
    note:
      "新闻为点缀：使馆动态 + 仅含瓦努阿图关键词的近期门户稿。ReliefWeb 默认关（ENABLE_RELIEFWEB=1）；海外 RSS 默认关（ENABLE_OVERSEAS_RSS=1）。",
    stats: {
      fetched: deduped.length,
      inserted: res.inserted.length,
      skipped: res.skipped.length,
      failed: res.failed.length,
    },
    sample: {
      inserted: res.inserted.slice(0, 3),
      skipped: res.skipped.slice(0, 3),
      failed: res.failed.slice(0, 3),
    },
  };
}

exports.main = async (event) => {
  if (event?.type && event.type !== "run") {
    return { success: false, message: `unknown type: ${event.type}` };
  }
  return await runCrawl();
};
