const api = require("../../utils/api");
const util = require("../../utils/util");

Page({
  data: {
    banners: [
      { id: 1, image: "/images/banner-placeholder.jpg", title: "欢迎来到 Kawaba 瓦努阿图华人社区" },
      { id: 2, image: "/images/banner-placeholder.jpg", title: "瓦努阿图本地生活资讯" },
      { id: 3, image: "/images/banner-placeholder.jpg", title: "华人商家黄页服务" }
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
    noMore: false
  },

  onLoad() {
    this.loadNews();
  },

  onPullDownRefresh() {
    this.setData({ page: 0, noMore: false, newsList: [] });
    this.loadNews().then(() => wx.stopPullDownRefresh());
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
      const list = (res.data || []).map(item => ({
        ...item,
        timeText: util.formatTime(item.created_at)
      }));

      this.setData({
        newsList: this.data.page === 0 ? list : [...this.data.newsList, ...list],
        page: this.data.page + 1,
        noMore: list.length < api.PAGE_SIZE,
        loading: false
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
      {
        _id: "mock1",
        title: "瓦努阿图华人社区举办2026年新春联欢晚会",
        source: "Kawaba",
        category: "chinese",
        cover_image: "",
        view_count: 328,
        created_at: "2026-04-08T10:00:00Z"
      },
      {
        _id: "mock2",
        title: "维拉港新国际航线即将开通 直飞布里斯班仅需3小时",
        source: "Kawaba",
        category: "local",
        cover_image: "",
        view_count: 512,
        created_at: "2026-04-07T08:30:00Z"
      },
      {
        _id: "mock3",
        title: "瓦努阿图房产投资指南：2026年最新政策解读",
        source: "Kawaba",
        category: "life",
        cover_image: "",
        view_count: 245,
        created_at: "2026-04-06T14:20:00Z"
      },
      {
        _id: "mock4",
        title: "本地华人超市「万家福」新店开业 特价优惠持续两周",
        source: "Kawaba",
        category: "chinese",
        cover_image: "",
        view_count: 189,
        created_at: "2026-04-05T09:00:00Z"
      },
      {
        _id: "mock5",
        title: "瓦努阿图旅游旺季来临 酒店预订量同比增长40%",
        source: "Kawaba",
        category: "local",
        cover_image: "",
        view_count: 673,
        created_at: "2026-04-04T16:45:00Z"
      }
    ];
    const list = mockNews.map(item => ({
      ...item,
      timeText: util.formatTime(item.created_at)
    }));
    this.setData({ newsList: list, noMore: true });
  },

  switchCategory(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentCategory) return;
    this.setData({
      currentCategory: key,
      page: 0,
      newsList: [],
      noMore: false
    });
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
    if (item.url) {
      wx.navigateTo({ url: item.url });
    }
  }
});
