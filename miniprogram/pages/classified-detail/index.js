const api = require("../../utils/api");
const util = require("../../utils/util");

const CATEGORY_MAP = {
  rent: "租房",
  job: "招聘",
  secondhand: "二手交易",
  service: "生活服务"
};

Page({
  data: {
    id: "",
    item: null
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const res = await api.getClassifiedDetail(this.data.id);
      const item = {
        ...res.data,
        categoryName: CATEGORY_MAP[res.data.category] || res.data.category,
        timeText: util.formatTime(res.data.created_at),
        priceText: util.formatPrice(res.data.price)
      };
      this.setData({ item });
    } catch (e) {
      console.error("加载详情失败", e);
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  callContact() {
    if (this.data.item?.contact) {
      wx.makePhoneCall({
        phoneNumber: this.data.item.contact,
        fail: () => {}
      });
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.item?.title || "分类信息",
      path: `/pages/classified-detail/index?id=${this.data.id}`
    };
  },

  onShareTimeline() {
    return { title: this.data.item?.title || "Kavabar 分类信息" };
  }
});
