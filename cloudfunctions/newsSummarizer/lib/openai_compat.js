const axios = require("axios");

/**
 * OpenAI-compatible Chat Completions API (works with DeepSeek, OpenAI, etc.)
 *
 * Env:
 * - AI_API_BASE: e.g. https://api.deepseek.com/v1  or  https://api.openai.com/v1
 * - AI_API_KEY: required
 * - AI_MODEL:   e.g. deepseek-chat  or  gpt-4o-mini
 *
 * Returns { titleZh, excerptZh } — one API call for both.
 */
async function summarizeToChinese({ title, sourceText, excerptEn, maxChars = 180 }) {
  const body = (sourceText || excerptEn || "").trim();
  const baseURL = (process.env.AI_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    const err = new Error("Missing env AI_API_KEY");
    err.code = "MISSING_AI_API_KEY";
    throw err;
  }

  const isChinese = /[\u4e00-\u9fff]/.test(title || "");

  const prompt = isChinese
    ? [
        "\u4f60\u662f\u65b0\u95fb\u7f16\u8f91\u3002\u8bf7\u6839\u636e\u4e0b\u5217\u6807\u9898\u4e0e\u6750\u6599\uff0c\u5199\u51fa\u4e2d\u6587\u6807\u9898\u548c\u6458\u8981\u3002",
        "\u4e2d\u6587\u6750\u6599\u5219\u7cbe\u70bc\u538b\u7f29\uff0c\u4e0d\u7167\u642c\u5168\u6587\u3002",
        "\u8981\u6c42\uff1a\u5ba2\u89c2\u4e2d\u7acb\uff1b\u4e0d\u6dfb\u52a0\u6750\u6599\u4e2d\u6ca1\u6709\u7684\u4e8b\u5b9e\u3002",
        `\u6807\u9898\uff1a${title || ""}`,
        `\u6750\u6599\uff1a${body}`,
        "\u4e25\u683c\u6309\u4ee5\u4e0b\u683c\u5f0f\u8f93\u51fa\u4e24\u884c\uff08\u4e0d\u8981\u52a0\u5f15\u53f7\u6216\u591a\u4f59\u6587\u5b57\uff09\uff1a",
        "TITLE_ZH: \uff08\u539f\u6807\u9898\u7cbe\u7b80\u7248\uff0c\u53bb\u6389\u65e5\u671f\u62ec\u53f7\uff0c20\u5b57\u4ee5\u5185\uff09",
        "SUMMARY: \uff08100-180\u5b57\u4e2d\u6587\u6458\u8981\uff09"
      ].join("\n")
    : [
        "\u4f60\u662f\u65b0\u95fb\u7f16\u8f91\u3002\u8bf7\u6839\u636e\u4e0b\u5217\u5916\u6587\u6807\u9898\u4e0e\u6750\u6599\uff0c\u7ffb\u8bd1\u6807\u9898\u5e76\u5199\u51fa\u4e2d\u6587\u6458\u8981\u3002",
        "\u6750\u6599\u53ef\u80fd\u662f\u82f1\u6587\u6216\u6bd4\u65af\u62c9\u9a6c\u8bed\uff08Bislama\uff09\uff0c\u7406\u89e3\u540e\u7528\u4e2d\u6587\u6982\u62ec\u3002",
        "\u8981\u6c42\uff1a\u5ba2\u89c2\u4e2d\u7acb\uff1b\u4e0d\u6dfb\u52a0\u6750\u6599\u4e2d\u6ca1\u6709\u7684\u4e8b\u5b9e\u3002",
        `\u6807\u9898\uff1a${title || ""}`,
        `\u6750\u6599\uff1a${body}`,
        "\u4e25\u683c\u6309\u4ee5\u4e0b\u683c\u5f0f\u8f93\u51fa\u4e24\u884c\uff08\u4e0d\u8981\u52a0\u5f15\u53f7\u6216\u591a\u4f59\u6587\u5b57\uff09\uff1a",
        "TITLE_ZH: \uff08\u4e2d\u6587\u7ffb\u8bd1\u6807\u9898\uff0c\u7b80\u6d01\u51c6\u786e\uff0c20\u5b57\u4ee5\u5185\uff09",
        "SUMMARY: \uff08100-180\u5b57\u4e2d\u6587\u6458\u8981\uff09"
      ].join("\n");

  const res = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3
    },
    {
      timeout: 12000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  const out = String(res.data?.choices?.[0]?.message?.content || "").trim();
  if (!out) return { titleZh: "", excerptZh: "" };

  const titleMatch = out.match(/TITLE_ZH:\s*(.+)/);
  const summaryMatch = out.match(/SUMMARY:\s*([\s\S]+)/);

  let titleZh = titleMatch ? titleMatch[1].trim() : "";
  let excerptZh = summaryMatch ? summaryMatch[1].trim().replace(/\s+/g, " ") : "";

  if (!excerptZh && !titleZh) {
    excerptZh = out.replace(/\s+/g, " ");
  }

  if (excerptZh.length > maxChars) {
    excerptZh = excerptZh.slice(0, maxChars - 1) + "\u2026";
  }
  if (titleZh.length > 30) {
    titleZh = titleZh.slice(0, 29) + "\u2026";
  }

  return { titleZh, excerptZh };
}

module.exports = { summarizeToChinese };
