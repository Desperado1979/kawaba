const cloud = require("wx-server-sdk");
const { summarizeToChinese } = require("./lib/openai_compat");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function buildContent({ title, excerptZh, originUrl, source }) {
  const safeTitle = title || "";
  const safeExcerpt = excerptZh || "";
  const link = originUrl
    ? `<p><a href="${originUrl}" target="_blank" rel="noreferrer">Source: ${source || "link"}</a></p>`
    : "";
  return `<h3>${safeTitle}</h3><p>${safeExcerpt}</p>${link}`;
}

async function fetchCandidates(limit = 20) {
  // excerpt_en exists, excerpt_zh empty/missing
  const where = _.and([
    { excerpt_en: _.neq("") },
    _.or([{ excerpt_zh: "" }, { excerpt_zh: _.exists(false) }])
  ]);

  return await db
    .collection("news")
    .where(where)
    .orderBy("created_at", "desc")
    .limit(limit)
    .get();
}

exports.main = async (event) => {
  const dryRun = Boolean(event?.dryRun);
  const candidates = await fetchCandidates(20);
  const list = candidates.data || [];

  const updated = [];
  const skipped = [];
  const failed = [];

  for (const doc of list) {
    const title = doc.title || "";
    const excerptEn = doc.excerpt_en || "";
    if (!excerptEn) {
      skipped.push({ _id: doc._id, reason: "missing_excerpt_en" });
      continue;
    }

    try {
      const zh = await summarizeToChinese({ title, excerptEn, maxChars: 180 });
      if (!zh) {
        skipped.push({ _id: doc._id, reason: "empty_zh" });
        continue;
      }

      if (!dryRun) {
        await db.collection("news").doc(doc._id).update({
          data: {
            excerpt_zh: zh,
            content: buildContent({
              title: doc.title,
              excerptZh: zh,
              originUrl: doc.origin_url,
              source: doc.source
            }),
            summarized_at: new Date()
          }
        });
      }

      updated.push({ _id: doc._id, title: doc.title });
    } catch (e) {
      failed.push({ _id: doc._id, errMsg: e.message || String(e) });
    }
  }

  return {
    success: true,
    dryRun,
    stats: { candidates: list.length, updated: updated.length, skipped: skipped.length, failed: failed.length },
    sample: { updated: updated.slice(0, 3), skipped: skipped.slice(0, 3), failed: failed.slice(0, 3) }
  };
};

