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

/** Strip HTML / normalize whitespace for model input (seed news uses plain text; crawled uses HTML). */
function plainFromContent(raw) {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return s.length > 500 ? s.slice(0, 500) : s;
}

function resolveSourceText(doc) {
  const en = (doc.excerpt_en || "").trim();
  if (en) return en;
  return plainFromContent(doc.content || "");
}

const DEFAULT_BATCH = 2;
const MAX_BATCH = 20;

function clampBatchLimit(raw) {
  const n = raw === undefined || raw === null ? DEFAULT_BATCH : Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_BATCH;
  return Math.min(Math.floor(n), MAX_BATCH);
}

async function fetchCandidates(limit = DEFAULT_BATCH) {
  const needsZh = _.or([{ excerpt_zh: "" }, { excerpt_zh: _.exists(false) }]);
  const hasSource = _.or([
    _.and([{ excerpt_en: _.exists(true) }, { excerpt_en: _.neq("") }]),
    _.and([{ content: _.exists(true) }, { content: _.neq("") }])
  ]);
  const where = _.and([needsZh, hasSource]);

  return await db
    .collection("news")
    .where(where)
    .orderBy("created_at", "desc")
    .limit(limit)
    .get();
}

exports.main = async (event) => {
  const dryRun = Boolean(event?.dryRun);
  const batchLimit = clampBatchLimit(event?.limit);
  const candidates = await fetchCandidates(batchLimit);
  const list = candidates.data || [];

  const updated = [];
  const skipped = [];
  const failed = [];

  for (const doc of list) {
    const title = doc.title || "";
    const sourceText = resolveSourceText(doc);
    if (!sourceText) {
      skipped.push({ _id: doc._id, reason: "missing_source_text" });
      continue;
    }

    try {
      const zh = await summarizeToChinese({ title, sourceText, maxChars: 180 });
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
    batchLimit,
    stats: { candidates: list.length, updated: updated.length, skipped: skipped.length, failed: failed.length },
    sample: { updated: updated.slice(0, 3), skipped: skipped.slice(0, 3), failed: failed.slice(0, 3) },
    hint:
      "每条串行请求 AI。默认每轮 2 条；云函数超时仍建议调到 ≥60s。要加大批量可传 {\"limit\":6} 并同步提高超时。"
  };
};

