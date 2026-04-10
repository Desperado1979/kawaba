const cloud = require("wx-server-sdk");
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

/** 单源墙钟上限，避免跨境站点把整段云函数拖到 60s+ */
const PER_SOURCE_MS = 26000;

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
  const [rnzRes, bbcRes, gRes] = await Promise.allSettled([
    cappedCrawl(PER_SOURCE_MS, crawlRnzPacificRss),
    cappedCrawl(PER_SOURCE_MS, crawlBbcAsiaRss),
    cappedCrawl(PER_SOURCE_MS, crawlGoogleVanuatuRss),
  ]);

  const items = [];
  if (rnzRes.status === "fulfilled") items.push(...rnzRes.value);
  if (bbcRes.status === "fulfilled") items.push(...bbcRes.value);
  if (gRes.status === "fulfilled") items.push(...gRes.value);

  const res = await upsertNews(items);
  return {
    success: true,
    sources: {
      rnz_rss: sourceStatus(rnzRes, "rnz_rss"),
      bbc_asia_rss: sourceStatus(bbcRes, "bbc_asia_rss"),
      google_vanuatu_rss: sourceStatus(gRes, "google_vanuatu_rss"),
    },
    note:
      "抓取已改为 RSS（RNZ Pacific + BBC Asia + Google News Vanuatu）。原 HTML 直爬 dailypost/rnz 在腾讯云出口易 403/超时，代码仍保留在 lib/sources/dailypost.js、rnz.js 供本机试验。",
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

