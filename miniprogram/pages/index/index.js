const api = require("../../utils/api");
const util = require("../../utils/util");

Page({
  data: {
    banners: [
      { id: 1, image: "/images/banner-placeholder.jpg", title: "欢迎来到 Kavabar 瓦努阿图华人社区" }
    ],
    categories: [
      { key: "all", name: "全部" },
      { key: "local", name: "本地新闻" },
      { key: "chinese", name: "华人动态" },
      { key: "life", name: "生活资讯" }
    ],
    currentCategory: "all",
    newsList: [],
    page: 0,
    loading: false,
    noMore: false,
    dataReady: false
  },

  onLoad() {
    this.loadBanners();
    this.loadNews();
  },

  onPullDownRefresh() {
    this.setData({ page: 0, noMore: false, newsList: [] });
    Promise.all([this.loadBanners(), this.loadNews()])
      .finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.noMore) {
      this.loadNews();
    }
  },

  async loadBanners() {
    try {
      const res = await api.getTopNews();
      if (res.data && res.data.length > 0) {
        const banners = res.data.map((item, idx) => ({
          id: item._id,
          image: item.cover_image || "/images/banner-placeholder.jpg",
          title: item.title,
          newsId: item._id
        }));
        this.setData({ banners, dataReady: true });
      }
    } catch (e) {
      console.log("Banner 使用默认数据");
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

  goNewsDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/news-detail/index?id=${id}` });
  },

  onBannerTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.newsId) {
      wx.navigateTo({ url: `/pages/news-detail/index?id=${item.newsId}` });
    }
  },

  async onInitData() {
    wx.showLoading({ title: "正在写入数据..." });
    try {
      const res = await api.initData();
      wx.hideLoading();
      const msg = `新闻${res.results.news}条 分类${res.results.classifieds}条 商家${res.results.businesses}条`;
      if (res.errors && res.errors.length > 0) {
        wx.showModal({
          title: "部分失败",
          content: msg + "\n错误: " + res.errors[0] + "\n\n请先在云开发控制台手动创建集合: news, classifieds, businesses, users",
          showCancel: false
        });
      } else {
        wx.showModal({
          title: "初始化成功",
          content: msg,
          showCancel: false,
          success: () => {
            this.setData({ page: 0, newsList: [], noMore: false, dataReady: true });
            this.loadBanners();
            this.loadNews();
          }
        });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showModal({
        title: "初始化失败",
        content: (e.message || JSON.stringify(e)) + "\n\n请先在云开发控制台手动创建4个集合:\nnews\nclassifieds\nbusinesses\nusers",
        showCancel: false
      });
    }
  }

  ,

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
  },

  async onCleanupDemoNews() {
    wx.showModal({
      title: "清理示例新闻",
      content: "将删除示例/演示新闻（source=Kavabar 且无来源链接）。此操作不可撤销，确认继续？",
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: "清理中..." });
        try {
          const res = await api.cleanupDemoNews();
          wx.hideLoading();
          wx.showToast({ title: `已删除${res.result?.removed || 0}条`, icon: "none" });
          this.setData({ page: 0, newsList: [], noMore: false });
          this.loadBanners();
          this.loadNews();
        } catch (e) {
          wx.hideLoading();
          wx.showModal({ title: "清理失败", content: e.message || "请确认云函数已上传", showCancel: false });
        }
      }
    });
  }
});
