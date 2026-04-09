function formatTime(date) {
  if (typeof date === "string") {
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return minutes + "分钟前";
  if (hours < 24) return hours + "小时前";
  if (days < 7) return days + "天前";

  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatPrice(price) {
  if (!price && price !== 0) return "面议";
  return "VUV " + Number(price).toLocaleString();
}

function getOrCreateDeviceId() {
  const key = "kavabar_device_id";
  try {
    const existing = wx.getStorageSync(key);
    if (existing) return existing;
  } catch (_) {}

  const id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    wx.setStorageSync(key, id);
  } catch (_) {}
  return id;
}

module.exports = {
  formatTime,
  formatPrice,
  getOrCreateDeviceId
};
