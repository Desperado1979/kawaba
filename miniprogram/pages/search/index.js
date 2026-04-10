const api = require("../../utils/api");

Page({
  data: {
    keyword: "",
    newsResults: [],
    classifiedResults: [],
    bizResults: [],
    hasSearched: false,
    loading: false,
    hotKeywords: ["租房", "招聘", "中餐", "签证", "机票", "超市", "搬家", "维拉港"]
  },

  onLoad(options) {},

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  clearKeyword() {
    this.setData({ keyword: "", hasSearched: false, newsResults: [], classifiedResults: [], bizResults: [] });
  },

  doSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) return;
    this.setData({ hasSearched: true, newsResults: [], classifiedResults: [], bizResults: [], loading: true });
    this.performSearch(keyword);
  },

  async performSearch(keyword) {
    const db = wx.cloud.database();
    const regex = db.RegExp({ regexp: keyword, options: "i" });

    try {
      const [newsRes, classRes, bizRes] = await Promise.all([
        db.collection("news")
          .where({ title: regex })
          .orderBy("created_at", "desc")
          .limit(10)
          .get()
          .catch(() => ({ data: [] })),
        db.collection("classifieds")
          .where({ title: regex })
          .orderBy("created_at", "desc")
          .limit(10)
          .get()
          .catch(() => ({ data: [] })),
        db.collection("businesses")
          .where({ name: regex })
          .limit(10)
          .get()
          .catch(() => ({ data: [] }))
      ]);

      this.setData({
        newsResults: newsRes.data || [],
        classifiedResults: classRes.data || [],
        bizResults: bizRes.data || [],
        loading: false
      });
    } catch (e) {
      console.error("搜索失败", e);
      this.setData({ loading: false });
    }
  },

  tapHotKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.doSearch();
  },

  goNewsDetail(e) {
    wx.navigateTo({ url: `/pages/news-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  goClassifiedDetail(e) {
    wx.navigateTo({ url: `/pages/classified-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  goBizDetail(e) {
    wx.navigateTo({ url: `/pages/business-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  goBack() {
    wx.navigateBack();
  }
});
