const api = require("../../utils/api");

Page({
  data: {
    keyword: "",
    searchType: "news",
    results: [],
    hasSearched: false,
    loading: false,
    hotKeywords: ["租房", "招聘", "中餐", "签证", "机票", "超市", "搬家", "维拉港"]
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ searchType: options.type === "business" ? "businesses" : options.type });
    }
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  clearKeyword() {
    this.setData({ keyword: "", hasSearched: false, results: [] });
  },

  doSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) return;
    this.setData({ hasSearched: true, results: [], loading: true });
    this.performSearch(keyword);
  },

  async performSearch(keyword) {
    try {
      const collection = this.data.searchType;
      const field = collection === "businesses" ? "name" : "title";
      const db = wx.cloud.database();
      const res = await db.collection(collection)
        .where({
          [field]: db.RegExp({ regexp: keyword, options: "i" })
        })
        .limit(20)
        .get();

      this.setData({ results: res.data || [], loading: false });
    } catch (e) {
      console.error("搜索失败", e);
      this.setData({ loading: false });
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ searchType: type, results: [], loading: true });
    this.performSearch(this.data.keyword.trim());
  },

  tapHotKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.doSearch();
  },

  goDetail(e) {
    const item = e.currentTarget.dataset.item;
    const type = this.data.searchType;
    if (type === "news") {
      wx.navigateTo({ url: `/pages/news-detail/index?id=${item._id}` });
    } else if (type === "classifieds") {
      wx.navigateTo({ url: `/pages/classified-detail/index?id=${item._id}` });
    } else {
      wx.navigateTo({ url: `/pages/business-detail/index?id=${item._id}` });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
