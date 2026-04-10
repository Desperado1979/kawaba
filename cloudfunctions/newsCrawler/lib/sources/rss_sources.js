const { fetchFeedAsItems } = require("../rss_feed");

/** HTML 页在腾讯云出口常被 403/超时；RSS 体量小、多为官方聚合，更适合云函数。 */

function crawlRnzPacificRss() {
  return fetchFeedAsItems(
    "https://www.rnz.co.nz/rss/pacific.xml",
    "RNZ Pacific",
    "https://www.rnz.co.nz/",
    12
  );
}

function crawlBbcAsiaRss() {
  return fetchFeedAsItems(
    "https://feeds.bbci.co.uk/news/world/asia/rss.xml",
    "BBC News Asia",
    "https://www.bbc.co.uk/news/world/asia",
    12
  );
}

function crawlGoogleVanuatuRss() {
  const q = encodeURIComponent("Vanuatu");
  return fetchFeedAsItems(
    `https://news.google.com/rss/search?q=${q}&hl=en&gl=AU&ceid=AU:en`,
    "Google News",
    "https://news.google.com/",
    10
  );
}

module.exports = { crawlRnzPacificRss, crawlBbcAsiaRss, crawlGoogleVanuatuRss };
