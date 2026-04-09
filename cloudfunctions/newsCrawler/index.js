const cloud = require("wx-server-sdk");
const { crawlDailyPost } = require("./lib/sources/dailypost");
const { crawlRnzPacific } = require("./lib/sources/rnz");
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

async function runCrawl() {
  // Note on “translation”:
  // We do NOT republish full translated articles (copyright risk).
  // We store a short excerpt + source link and allow later manual/AI summarization.
  const [dp, rnz] = await Promise.allSettled([crawlDailyPost(), crawlRnzPacific()]);
  const items = [];
  if (dp.status === "fulfilled") items.push(...dp.value);
  if (rnz.status === "fulfilled") items.push(...rnz.value);

  const res = await upsertNews(items);
  return {
    success: true,
    sources: {
      dailypost: dp.status === "fulfilled" ? "ok" : `fail: ${dp.reason?.message || dp.reason}`,
      rnz: rnz.status === "fulfilled" ? "ok" : `fail: ${rnz.reason?.message || rnz.reason}`,
    },
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

