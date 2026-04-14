const api = require("../../utils/api");

const KEYWORD_TO_CATEGORY = {
  "丢": "lost", "丢失": "lost", "寻物": "lost", "找手机": "lost", "捡到": "lost",
  "租房": "rent", "出租": "rent", "房屋": "rent", "公寓": "rent",
  "招聘": "job", "求职": "job", "工作": "job", "兼职": "job",
  "生意": "business_transfer", "店铺": "business_transfer", "盘店": "business_transfer",
  "土地": "property", "物业": "property", "地皮": "property", "买地": "property",
  "二手": "secondhand", "出售": "secondhand",
  "转让": "business_transfer",
  "服务": "service", "搬家": "service", "维修": "service", "清洁": "service",
  "餐饮": "food", "中餐": "food", "饭店": "food", "餐厅": "food",
  "超市": "market", "百货": "market",
  "旅游": "travel", "机票": "travel", "签证": "travel",
  "法律": "legal", "移民": "legal", "律师": "legal",
  "医疗": "medical", "诊所": "medical", "医生": "medical",
  "汽车": "car", "修车": "car", "配件": "car", "零件": "car",
  "房产": "realestate", "买房": "realestate",
  "五金": "hardware", "建材": "hardware", "瓷砖": "hardware", "水泥": "hardware", "钢材": "hardware",
  "洁具": "hardware", "卫浴": "hardware", "涂料": "hardware", "阀门": "hardware", "水暖": "hardware"
};

const CLASSIFIED_CATS = new Set(["lost", "rent", "job", "business_transfer", "property", "secondhand", "service"]);

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
    hotKeywords: ["丢手机", "租房", "招聘", "生意转让", "土地", "刹车片", "五金建材", "二手", "中餐"]
  },

  onLoad(options) {
    if (options.focus === "products") {
      this.setData({ keyword: "" });
    }
  },

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

    const bizConditions = [{ name: regex }, { description: regex }, { products: regex }];
    if (cat && !CLASSIFIED_CATS.has(cat)) {
      bizConditions.push({ category: cat });
    }

    try {
      const [newsRes, classRes, bizRes] = await Promise.all([
        db.collection("news")
          .where(
            _.and([{ translation_ready: _.neq(false) }, _.or([{ title: regex }, { title_zh: regex }])])
          )
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
