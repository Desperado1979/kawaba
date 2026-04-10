const api = require("../../utils/api");
const util = require("../../utils/util");

const CATEGORY_MAP = {
  all: "全部",
  rent: "租房",
  job: "招聘",
  secondhand: "二手交易",
  service: "生活服务"
};

Page({
  data: {
    categories: [
      { key: "all", name: "全部", icon: "/images/icons/all.svg" },
      { key: "rent", name: "租房", icon: "/images/icons/rent.svg" },
      { key: "job", name: "招聘", icon: "/images/icons/job.svg" },
      { key: "secondhand", name: "二手", icon: "/images/icons/secondhand.svg" },
      { key: "service", name: "服务", icon: "/images/icons/service.svg" }
    ],
    currentCategory: "all",
    list: [],
    page: 0,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.setData({ page: 0, noMore: false, list: [] });
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  async loadList() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await api.getClassifiedsList(this.data.currentCategory, this.data.page);
      const items = (res.data || []).map(item => ({
        ...item,
        categoryName: CATEGORY_MAP[item.category] || item.category,
        timeText: util.formatTime(item.created_at),
        priceText: util.formatPrice(item.price)
      }));

      this.setData({
        list: this.data.page === 0 ? items : [...this.data.list, ...items],
        page: this.data.page + 1,
        noMore: items.length < api.PAGE_SIZE,
        loading: false
      });
    } catch (e) {
      console.error("加载分类信息失败", e);
      this.setData({ loading: false });
      if (this.data.list.length === 0) {
        this.loadMockData();
      }
    }
  },

  loadMore() {
    if (!this.data.loading && !this.data.noMore) {
      this.loadList();
    }
  },

  loadMockData() {
    const mock = [
      {
        _id: "c1",
        title: "维拉港市中心两室一厅公寓出租 近中国城",
        category: "rent",
        price: 85000,
        location: "维拉港",
        images: [],
        created_at: "2026-04-08T12:00:00Z"
      },
      {
        _id: "c2",
        title: "招聘中餐厨师 待遇优厚 包食宿",
        category: "job",
        price: null,
        location: "维拉港",
        images: [],
        created_at: "2026-04-07T09:00:00Z"
      },
      {
        _id: "c3",
        title: "九成新丰田皮卡出售 低公里数 价格可议",
        category: "secondhand",
        price: 1200000,
        location: "维拉港",
        images: [],
        created_at: "2026-04-06T15:30:00Z"
      },
      {
        _id: "c4",
        title: "专业搬家服务 全岛覆盖 价格实惠",
        category: "service",
        price: null,
        location: "全岛",
        images: [],
        created_at: "2026-04-05T11:00:00Z"
      }
    ];
    const items = mock.map(item => ({
      ...item,
      categoryName: CATEGORY_MAP[item.category],
      timeText: util.formatTime(item.created_at),
      priceText: util.formatPrice(item.price)
    }));
    this.setData({ list: items, noMore: true });
  },

  switchCategory(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentCategory) return;
    this.setData({
      currentCategory: key,
      page: 0,
      list: [],
      noMore: false
    });
    this.loadList();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/classified-detail/index?id=${id}` });
  },

  goPublish() {
    wx.navigateTo({ url: "/pages/publish/index" });
  },

  onShareAppMessage() {
    return {
      title: "Kavabar 分类信息 — 瓦努阿图华人社区",
      path: "/pages/classifieds/index"
    };
  },

  onShareTimeline() {
    return { title: "Kavabar 分类信息 — 瓦努阿图华人社区" };
  }
});
