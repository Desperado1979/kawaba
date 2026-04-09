const api = require("../../utils/api");

const CATEGORIES = [
  { key: "food", name: "餐饮美食", emoji: "🍜", bgColor: "#FFF3E0" },
  { key: "market", name: "超市百货", emoji: "🛒", bgColor: "#E8F5E9" },
  { key: "travel", name: "旅游出行", emoji: "✈️", bgColor: "#E3F2FD" },
  { key: "legal", name: "法律移民", emoji: "⚖️", bgColor: "#F3E5F5" },
  { key: "education", name: "教育培训", emoji: "📚", bgColor: "#FFF8E1" },
  { key: "medical", name: "医疗健康", emoji: "🏥", bgColor: "#FFEBEE" },
  { key: "car", name: "汽车服务", emoji: "🚗", bgColor: "#E0F7FA" },
  { key: "realestate", name: "房产中介", emoji: "🏠", bgColor: "#F1F8E9" },
  { key: "finance", name: "金融保险", emoji: "💰", bgColor: "#FFF9C4" },
  { key: "beauty", name: "美容美发", emoji: "💇", bgColor: "#FCE4EC" },
  { key: "repair", name: "维修装修", emoji: "🔧", bgColor: "#ECEFF1" },
  { key: "other", name: "更多", emoji: "📋", bgColor: "#F5F5F5" }
];

Page({
  data: {
    categories: CATEGORIES,
    selectedCategory: "",
    selectedCategoryName: "",
    list: [],
    page: 0,
    loading: false,
    noMore: false
  },

  onPullDownRefresh() {
    if (this.data.selectedCategory) {
      this.setData({ page: 0, list: [] });
      this.loadList().then(() => wx.stopPullDownRefresh());
    } else {
      wx.stopPullDownRefresh();
    }
  },

  selectCategory(e) {
    const key = e.currentTarget.dataset.key;
    const cat = CATEGORIES.find(c => c.key === key);
    this.setData({
      selectedCategory: key,
      selectedCategoryName: cat ? cat.name : key,
      page: 0,
      list: [],
      noMore: false
    });
    this.loadList();
  },

  backToGrid() {
    this.setData({
      selectedCategory: "",
      selectedCategoryName: "",
      list: [],
      page: 0
    });
  },

  async loadList() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await api.getBusinessList(this.data.selectedCategory, this.data.page);
      const items = (res.data || []).map(item => ({
        ...item,
        stars: this.getStars(item.rating)
      }));

      this.setData({
        list: this.data.page === 0 ? items : [...this.data.list, ...items],
        page: this.data.page + 1,
        noMore: items.length < api.PAGE_SIZE,
        loading: false
      });
    } catch (e) {
      console.error("加载商家列表失败", e);
      this.setData({ loading: false });
      if (this.data.list.length === 0) {
        this.loadMockData();
      }
    }
  },

  loadMockData() {
    const mock = [
      { _id: "b1", name: "万家福华人超市", category: "market", address: "Rue de Paris, Port Vila", phone: "+678 22888", rating: 4.5, cover_image: "" },
      { _id: "b2", name: "金龙中餐厅", category: "food", address: "Lini Highway, Port Vila", phone: "+678 23666", rating: 4.8, cover_image: "" },
      { _id: "b3", name: "南太平洋旅行社", category: "travel", address: "Kumul Highway, Port Vila", phone: "+678 25888", rating: 4.2, cover_image: "" },
      { _id: "b4", name: "维拉港法律事务所", category: "legal", address: "Main Street, Port Vila", phone: "+678 22100", rating: 4.6, cover_image: "" }
    ];
    const items = mock
      .filter(b => this.data.selectedCategory === "all" || b.category === this.data.selectedCategory)
      .map(item => ({ ...item, stars: this.getStars(item.rating) }));
    this.setData({ list: items, noMore: true });
  },

  getStars(rating) {
    if (!rating) return [];
    return Array(Math.round(rating)).fill("★");
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/business-detail/index?id=${id}` });
  },

  goSearch() {
    wx.navigateTo({ url: "/pages/search/index?type=business" });
  },

  goBusinessSubmit() {
    wx.navigateTo({ url: "/pages/business-submit/index" });
  }
});
