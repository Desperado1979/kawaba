const crypto = require("crypto");

function md5(input) {
  return crypto.createHash("md5").update(String(input)).digest("hex");
}

function clampText(text, maxLen = 220) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + "…";
}

module.exports = {
  md5,
  clampText,
};

