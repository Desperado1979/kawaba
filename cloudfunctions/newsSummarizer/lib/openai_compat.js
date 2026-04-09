const axios = require("axios");

/**
 * OpenAI-compatible Responses API wrapper.
 *
 * Env:
 * - AI_API_BASE: default https://api.openai.com/v1
 * - AI_API_KEY: required
 * - AI_MODEL:   default gpt-4.1-mini (change as you like)
 */
async function summarizeToChinese({ title, excerptEn, maxChars = 180 }) {
  const baseURL = process.env.AI_API_BASE || "https://api.openai.com/v1";
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4.1-mini";
  if (!apiKey) {
    const err = new Error("Missing env AI_API_KEY");
    err.code = "MISSING_AI_API_KEY";
    throw err;
  }

  const prompt = [
    "你是新闻编辑。请根据英文摘要生成中文摘要。",
    "要求：100-180个中文字符；客观中立；不要添加来源里没有的事实；不要出现“据悉/传闻”。",
    `标题：${title || ""}`,
    `英文摘要：${excerptEn || ""}`,
    "输出：仅返回中文摘要一段，不要加引号，不要加前后缀。"
  ].join("\n");

  const res = await axios.post(
    `${baseURL}/responses`,
    {
      model,
      input: prompt,
      max_output_tokens: 200
    },
    {
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  const out =
    res.data?.output_text ||
    res.data?.output?.[0]?.content?.[0]?.text ||
    "";

  const text = String(out).trim().replace(/\s+/g, " ");
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + "…";
}

module.exports = { summarizeToChinese };

