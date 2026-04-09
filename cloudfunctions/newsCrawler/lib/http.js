const axios = require("axios");

async function fetchHtml(url) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KavabarBot/1.0; +https://github.com/Desperado1979/kawaba)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en,en-US;q=0.9",
    },
    responseType: "text",
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return res.data;
}

module.exports = { fetchHtml };

