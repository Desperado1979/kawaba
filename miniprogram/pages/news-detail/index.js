const api = require("../../utils/api");
const util = require("../../utils/util");

Page({
  data: {
    id: "",
    news: null,
    isFavorite: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const res = await api.getNewsDetail(this.data.id);
      const news = {
        ...res.data,
        timeText: util.formatTime(res.data.created_at)
      };
      this.setData({ news });
      wx.setNavigationBarTitle({ title: news.title || "新闻详情" });
      api.incrementViewCount(this.data.id).catch(() => {});
    } catch (e) {
      console.error("加载新闻详情失败", e);
      this.setData({
        news: {
          title: "新闻详情加载失败",
          content: "请检查网络连接后重试",
          timeText: "",
          source: "Kawaba"
        }
      });
    }
  },

  toggleFavorite() {
    this.setData({ isFavorite: !this.data.isFavorite });
    wx.showToast({
      title: this.data.isFavorite ? "已收藏" : "取消收藏",
      icon: "none"
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.news?.title || "Kawaba 新闻",
      path: `/pages/news-detail/index?id=${this.data.id}`
    };
  }
});
