const api = require("../../utils/api");

const KEYWORD_TO_CATEGORY = {
  "租房": "rent", "出租": "rent", "房屋": "rent", "公寓": "rent",
  "招聘": "job", "求职": "job", "工作": "job", "兼职": "job",
  "二手": "secondhand", "转让": "secondhand", "出售": "secondhand",
  "服务": "service", "搬家": "service", "维修": "service", "清洁": "service",
  "餐饮": "food", "中餐": "food", "饭店": "food", "餐厅": "food",
  "超市": "market", "百货": "market",
  "旅游": "travel", "机票": "travel", "签证": "travel",
  "法律": "legal", "移民": "legal", "律师": "legal",
  "医疗": "medical", "诊所": "medical", "医生": "medical",
  "汽车": "car", "修车": "car",
  "房产": "realestate", "买房": "realestate"
};

const CLASSIFIED_CATS = new Set(["rent", "job", "secondhand", "service"]);

function matchCategory(keyword) {
  for (const [k, cat] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (keyword.includes(k)) return cat;
  }
  return null;
}

Page({
  data: {
    keyword: "",
    newsResults: [],
    classifiedResults: [],
    bizResults: [],
    hasSearched: false,
    loading: false,
    hotKeywords: ["租房", "招聘", "中餐", "签证", "机票", "超市", "搬家", "二手"]
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
    const _ = db.command;
    const regex = db.RegExp({ regexp: keyword, options: "i" });
    const cat = matchCategory(keyword);

    const classifiedConditions = [{ title: regex }, { description: regex }];
    if (cat && CLASSIFIED_CATS.has(cat)) {
      classifiedConditions.push({ category: cat });
    }

    const bizConditions = [{ name: regex }, { description: regex }];
    if (cat && !CLASSIFIED_CATS.has(cat)) {
      bizConditions.push({ category: cat });
    }

    try {
      const [newsRes, classRes, bizRes] = await Promise.all([
        db.collection("news")
          .where(_.or([{ title: regex }, { title_zh: regex }]))
          .orderBy("created_at", "desc")
          .limit(10)
          .get()
          .catch(() => ({ data: [] })),
        db.collection("classifieds")
          .where(_.or(classifiedConditions))
          .orderBy("created_at", "desc")
          .limit(10)
          .get()
          .catch(() => ({ data: [] })),
        db.collection("businesses")
          .where(_.or(bizConditions))
          .limit(10)
          .get()
          .catch(() => ({ data: [] }))
      ]);

      const seen = new Set();
      const dedup = (arr) => arr.filter(i => seen.has(i._id) ? false : (seen.add(i._id), true));

      this.setData({
        newsResults: dedup(newsRes.data || []),
        classifiedResults: dedup(classRes.data || []),
        bizResults: dedup(bizRes.data || []),
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
