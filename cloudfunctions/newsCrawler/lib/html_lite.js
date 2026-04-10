/**
 * Tiny HTML helpers (no cheerio) — smaller cloud bundle, fewer deploy issues.
 */

function stripTags(s) {
  if (!s) return "";
  return s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function textFromHtml(html) {
  return decodeBasicEntities(stripTags(html)).replace(/\s+/g, " ").trim();
}

function decodeBasicEntities(s) {
  return String(s)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => {
      const c = Number(n);
      return Number.isFinite(c) && c > 0 && c < 0x110000 ? String.fromCharCode(c) : "";
    });
}

/** Yield { href, text } for each <a>...</a> (href + inner text, tags stripped). */
function* walkAnchors(html) {
  if (!html) return;
  const re = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = (m[1] || m[2] || m[3] || "").trim();
    const text = textFromHtml(m[4] || "");
    if (href) yield { href, text };
  }
}

/** First <p> block with enough visible text (skip empty / cookie banners). */
function firstParagraphText(html, minLen = 35) {
  if (!html) return "";
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const t = textFromHtml(m[1]);
    if (t.length >= minLen) return t;
  }
  return "";
}

module.exports = { walkAnchors, firstParagraphText, textFromHtml };
