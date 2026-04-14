const api = require("../../utils/api");
const util = require("../../utils/util");

const CATEGORY_MAP = {
  lost: "寻物启事",
  rent: "租房",
  job: "招聘",
  business_transfer: "生意转让",
  property: "土地物业",
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
        priceText: util.formatClassifiedPriceText(res.data.category, res.data.price)
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
      title: "Kavabar 分类信息",
      path: "/pages/classifieds/index"
    };
  },

  onShareTimeline() {
    return { title: "Kavabar 分类信息" };
  }
});
