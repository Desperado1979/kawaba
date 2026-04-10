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
 * @param {{ referer?: string, timeoutMs?: number, acceptHeader?: string }} [opts]
 */
async function fetchHtml(url, opts = {}) {
  const referer = opts.referer || defaultReferer(url);
  /* 云函数总时长有限；单次请求不宜过长，避免 6 串行详情把整段跑满 60s+ */
  const timeout = opts.timeoutMs ?? 10000;

  const isFeed = Boolean(opts.acceptHeader && /rss|atom|\/xml/i.test(opts.acceptHeader));
  const baseHeaders = {
    "User-Agent": CHROME_UA,
    Accept:
      opts.acceptHeader ||
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    ...(referer ? { Referer: referer } : {}),
  };
  const browserHints = isFeed
    ? {}
    : {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": referer ? "same-origin" : "none",
        "Upgrade-Insecure-Requests": "1",
      };

  const config = {
    timeout,
    headers: { ...baseHeaders, ...browserHints },
    responseType: "text",
    maxRedirects: 8,
    validateStatus: (s) => s >= 200 && s < 400,
  };

  const res = await axios.get(url, config);
  return res.data;
}

module.exports = { fetchHtml };
