const api = require("../../utils/api");

Page({
  data: {
    id: "",
    biz: null
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const res = await api.getBusinessDetail(this.data.id);
      const biz = {
        ...res.data,
        stars: this.getStars(res.data.rating)
      };
      this.setData({ biz });
      wx.setNavigationBarTitle({ title: biz.name || "商家详情" });
    } catch (e) {
      console.error("加载商家详情失败", e);
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  getStars(rating) {
    if (!rating) return [];
    return Array(Math.round(rating)).fill("★");
  },

  callPhone() {
    if (this.data.biz?.phone) {
      wx.makePhoneCall({
        phoneNumber: this.data.biz.phone,
        fail: () => {}
      });
    }
  },

  openMap() {
    wx.openLocation({
      latitude: -17.7333,
      longitude: 168.3167,
      name: this.data.biz?.name || "",
      address: this.data.biz?.address || "",
      fail: () => {
        wx.showToast({ title: "无法打开地图", icon: "none" });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: "Kavabar 黄页商家",
      path: "/pages/yellowpage/index"
    };
  },

  onShareTimeline() {
    return { title: "Kavabar 黄页商家" };
  }
});
