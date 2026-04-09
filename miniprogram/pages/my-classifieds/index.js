const api = require("../../utils/api");
const util = require("../../utils/util");

const CATEGORY_MAP = {
  rent: "租房",
  job: "招聘",
  secondhand: "二手交易",
  service: "生活服务"
};

function statusText(status) {
  if (status === 1) return "已上架";
  if (status === 0) return "待审核";
  if (status === -1) return "已下架";
  return "未知";
}

Page({
  data: {
    list: [],
    page: 0,
    loading: false,
    noMore: false,
    deviceId: ""
  },

  onLoad() {
    const deviceId = util.getOrCreateDeviceId();
    this.setData({ deviceId });
    this.loadList(true);
  },

  onShow() {
    // refresh after edit
    if (this.data.deviceId) this.loadList(true);
  },

  onPullDownRefresh() {
    this.loadList(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.noMore) this.loadList(false);
  },

  async loadList(reset) {
    if (this.data.loading) return;
    const page = reset ? 0 : this.data.page;
    this.setData({ loading: true });
    try {
      const res = await api.getMyClassifieds(this.data.deviceId, page);
      const items = (res.data || []).map((item) => ({
        ...item,
        categoryName: CATEGORY_MAP[item.category] || item.category,
        timeText: util.formatTime(item.created_at),
        statusText: statusText(item.status)
      }));

      this.setData({
        list: reset ? items : [...this.data.list, ...items],
        page: page + 1,
        noMore: items.length < api.PAGE_SIZE,
        loading: false
      });
    } catch (e) {
      console.error("加载我的发布失败", e);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/classified-detail/index?id=${id}` });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/edit-classified/index?id=${id}` });
  },

  onUnpublish(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "下架确认",
      content: "下架后将不再在列表展示，确认下架？",
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: "处理中..." });
        try {
          await api.updateClassified(id, { status: -1, updated_at: new Date() });
          wx.hideLoading();
          wx.showToast({ title: "已下架", icon: "success" });
          this.loadList(true);
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: "下架失败", icon: "none" });
        }
      }
    });
  }
});

