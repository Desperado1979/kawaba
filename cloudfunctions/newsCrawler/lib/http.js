const axios = require("axios");

/** 常见站点会拦「Bot」UA 或要求 Referer；云函数出口 IP 也可能被 CDN 限制。 */
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function defaultReferer(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return "";
  }
}

/**
 * @param {string} url
 * @param {{ referer?: string, timeoutMs?: number }} [opts]
 */
async function fetchHtml(url, opts = {}) {
  const referer = opts.referer || defaultReferer(url);
  const timeout = opts.timeoutMs ?? 30000;

  const config = {
    timeout,
    headers: {
      "User-Agent": CHROME_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...(referer ? { Referer: referer } : {}),
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": referer ? "same-origin" : "none",
      "Upgrade-Insecure-Requests": "1",
    },
    responseType: "text",
    maxRedirects: 8,
    validateStatus: (s) => s >= 200 && s < 400,
  };

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await axios.get(url, config);
      return res.data;
    } catch (e) {
      lastErr = e;
      const msg = e.message || "";
      const isTimeout = msg.includes("timeout") || e.code === "ECONNABORTED";
      if (attempt === 0 && isTimeout) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

module.exports = { fetchHtml };
