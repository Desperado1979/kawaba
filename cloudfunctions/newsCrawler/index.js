const cloud = require("wx-server-sdk");
const { crawlReliefWebVanuatu } = require("./lib/sources/reliefweb_vanuatu");
const {
  crawlChinaDailyPacific,
  crawlXinhuaPacific,
} = require("./lib/sources/china_accessible_rss");
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
    ? `<p><a href="${safeUrl}" target="_blank" rel="noreferrer">Source: ${safeSource || "link"}</a></p>`
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

/** 单源墙钟上限；境内 RSS + ReliefWeb 并行，总时长控制在云函数 60s 内 */
const PER_SOURCE_MS = 34000;

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
  // Note on “translation”:
  // We do NOT republish full translated articles (copyright risk).
  // We store a short excerpt + source link and allow later manual/AI summarization.
  const overseas = process.env.ENABLE_OVERSEAS_RSS === "1";
  const jobs = [
    ["reliefweb_vut", () => cappedCrawl(PER_SOURCE_MS, crawlReliefWebVanuatu)],
    ["china_daily_pacific", () => cappedCrawl(PER_SOURCE_MS, crawlChinaDailyPacific)],
    ["xinhua_pacific", () => cappedCrawl(PER_SOURCE_MS, crawlXinhuaPacific)],
  ];
  if (overseas) {
    jobs.push(
      ["rnz_rss", () => cappedCrawl(PER_SOURCE_MS, crawlRnzPacificRss)],
      ["bbc_asia_rss", () => cappedCrawl(PER_SOURCE_MS, crawlBbcAsiaRss)],
      ["google_vanuatu_rss", () => cappedCrawl(PER_SOURCE_MS, crawlGoogleVanuatuRss)]
    );
  }

  const settled = await Promise.allSettled(jobs.map(([, fn]) => fn()));

  const sources = {};
  const items = [];
  settled.forEach((r, i) => {
    const key = jobs[i][0];
    sources[key] = sourceStatus(r, key);
    if (r.status === "fulfilled") items.push(...r.value);
  });
  if (!overseas) {
    sources.rnz_rss = "skipped(env ENABLE_OVERSEAS_RSS!=1)";
    sources.bbc_asia_rss = "skipped(env ENABLE_OVERSEAS_RSS!=1)";
    sources.google_vanuatu_rss = "skipped(env ENABLE_OVERSEAS_RSS!=1)";
  }

  const res = await upsertNews(items);
  return {
    success: true,
    sources,
    note:
      "默认只跑 ReliefWeb(VUT)+China Daily/Xinhua(太平洋关键词)；海外 RNZ/BBC/Google 已默认关闭以免全量超时，需时在云函数环境变量设 ENABLE_OVERSEAS_RSS=1。ReliefWeb 若 4xx 请按 reliefweb.int 文档登记 appname。",
    stats: {
      fetched: items.length,
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
  // Manual run: callFunction({name:'newsCrawler', data:{type:'run'}})
  if (event?.type && event.type !== "run") {
    return { success: false, message: `unknown type: ${event.type}` };
  }
  return await runCrawl();
};

