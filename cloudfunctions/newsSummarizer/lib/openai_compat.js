const axios = require("axios");

/**
 * OpenAI-compatible Chat Completions API (works with DeepSeek, OpenAI, etc.)
 *
 * Env:
 * - AI_API_BASE: e.g. https://api.deepseek.com/v1  or  https://api.openai.com/v1
 * - AI_API_KEY: required
 * - AI_MODEL:   e.g. deepseek-chat  or  gpt-4o-mini
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

  const prompt = [
    "你是新闻编辑。请根据下列标题与材料，写出一段 100-180 个中文字符的中文摘要。",
    "材料可能是英文短讯或中文正文：英文则理解后简练概括；中文则精炼压缩，不照搬全文。",
    "要求：客观中立；不添加材料中没有的事实；不要“据悉/传闻”等空话。",
    `标题：${title || ""}`,
    `材料：${body}`,
    "输出：仅一段中文摘要，不要引号或前后缀。"
  ].join("\n");

  const res = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
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

  const out = res.data?.choices?.[0]?.message?.content || "";
  const text = String(out).trim().replace(/\s+/g, " ");
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + "…";
}

module.exports = { summarizeToChinese };
