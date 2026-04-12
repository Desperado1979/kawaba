const api = require("../../utils/api");
const util = require("../../utils/util");

Page({
  data: {
    categories: [
      { key: "all", name: "全部" },
      { key: "local", name: "本地新闻" },
      { key: "chinese", name: "华人动态" },
      { key: "world", name: "国际" },
      { key: "life", name: "生活资讯" }
    ],
    currentCategory: "all",
    newsList: [],
    page: 0,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadNews();
  },

  onPullDownRefresh() {
    this.setData({ page: 0, noMore: false, newsList: [] });
    this.loadNews().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.noMore) {
      this.loadNews();
    }
  },

  async loadNews() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await api.getNewsList(this.data.currentCategory, this.data.page);
      console.log("[loadNews] category:", this.data.currentCategory, "page:", this.data.page, "result count:", (res.data || []).length, "first:", res.data?.[0]?.title);
      const list = (res.data || []).map((item) => {
        const raw = item.created_at;
        const d =
          raw instanceof Date
            ? raw
            : typeof raw === "string" || typeof raw === "number"
              ? new Date(raw)
              : null;
        return {
          ...item,
          timeText: d && !Number.isNaN(d.getTime()) ? util.formatTime(d) : ""
        };
      });

      this.setData({
        newsList: this.data.page === 0 ? list : [...this.data.newsList, ...list],
        page: this.data.page + 1,
        noMore: list.length < api.PAGE_SIZE,
        loading: false,
        dataReady: list.length > 0
      });
    } catch (e) {
      console.error("加载新闻失败", e);
      this.setData({ loading: false });
      if (this.data.newsList.length === 0) {
        this.loadMockNews();
      }
    }
  },

  loadMockNews() {
    const mockNews = [
      { _id: "mock1", title: "瓦努阿图华人社区举办2026年新春联欢晚会", source: "Kavabar", category: "chinese", cover_image: "", view_count: 328, created_at: "2026-04-08T10:00:00Z" },
      { _id: "mock2", title: "维拉港新国际航线即将开通 直飞布里斯班仅需3小时", source: "Kavabar", category: "local", cover_image: "", view_count: 512, created_at: "2026-04-07T08:30:00Z" },
      { _id: "mock3", title: "瓦努阿图房产投资指南：2026年最新政策解读", source: "Kavabar", category: "life", cover_image: "", view_count: 245, created_at: "2026-04-06T14:20:00Z" },
      { _id: "mock4", title: "本地华人超市「万家福」新店开业 特价优惠持续两周", source: "Kavabar", category: "chinese", cover_image: "", view_count: 189, created_at: "2026-04-05T09:00:00Z" },
      { _id: "mock5", title: "瓦努阿图旅游旺季来临 酒店预订量同比增长40%", source: "Kavabar", category: "local", cover_image: "", view_count: 673, created_at: "2026-04-04T16:45:00Z" }
    ];
    this.setData({
      newsList: mockNews.map(item => ({ ...item, timeText: util.formatTime(item.created_at) })),
      noMore: true
    });
  },

  switchCategory(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentCategory) return;
    this.setData({ currentCategory: key, page: 0, newsList: [], noMore: false });
    this.loadNews();
  },

  goSearch() {
    wx.navigateTo({ url: "/pages/search/index" });
  },

  goCategory(e) {
    const { type, cat } = e.currentTarget.dataset;
    const app = getApp();
    if (type === "classifieds") {
      app.globalData.pendingClassifiedCat = cat;
      wx.switchTab({ url: "/pages/classifieds/index" });
    } else if (type === "yellowpage") {
      app.globalData.pendingYellowpageCat = cat;
      wx.switchTab({ url: "/pages/yellowpage/index" });
    }
  },

  goYellowPage() {
    wx.switchTab({ url: "/pages/yellowpage/index" });
  },

  goSearchProducts() {
    wx.navigateTo({ url: "/pages/search/index?focus=products" });
  },

  goPublish() {
    wx.navigateTo({ url: "/pages/publish/index" });
  },

  goMyClassifieds() {
    wx.navigateTo({ url: "/pages/my-classifieds/index" });
  },

  goNewsDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/news-detail/index?id=${id}` });
  },

  onShareAppMessage() {
    return {
      title: "Kavabar 瓦努阿图华人社区",
      path: "/pages/index/index"
    };
  },

  onShareTimeline() {
    return {
      title: "Kavabar 瓦努阿图华人社区"
    };
  }
});
