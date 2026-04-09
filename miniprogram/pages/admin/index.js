const api = require("../../utils/api");
const util = require("../../utils/util");

const CATEGORY_MAP = {
  rent: "租房",
  job: "招聘",
  secondhand: "二手交易",
  service: "生活服务",
  food: "餐饮美食",
  market: "超市百货",
  travel: "旅游出行",
  legal: "法律移民",
  education: "教育培训",
  medical: "医疗健康",
  car: "汽车服务",
  realestate: "房产中介",
  finance: "金融保险",
  beauty: "美容美发",
  repair: "维修装修",
  other: "更多"
};

function statusText(status) {
  if (status === 1) return "上架";
  if (status === 0) return "待审";
  if (status === -1) return "下架";
  return "未知";
}

Page({
  data: {
    isAuthed: false,
    adminKey: "",
    tab: "classifieds",
    statusFilter: -999,
    items: [],
    page: 0,
    loading: false,
    noMore: false
  },

  onLoad() {
    const cached = wx.getStorageSync("kavabar_admin_authed");
    if (cached) this.setData({ isAuthed: true });
  },

  onPullDownRefresh() {
    if (!this.data.isAuthed) return wx.stopPullDownRefresh();
    this.loadList(true).finally(() => wx.stopPullDownRefresh());
  },

  onKeyInput(e) {
    this.setData({ adminKey: e.detail.value });
  },

  onLogin() {
    const app = getApp();
    const expect = app.globalData.adminKey;
    if (!this.data.adminKey || this.data.adminKey !== expect) {
      wx.showToast({ title: "密码错误", icon: "none" });
      return;
    }
    wx.setStorageSync("kavabar_admin_authed", true);
    this.setData({ isAuthed: true });
    this.loadList(true);
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab, items: [], page: 0, noMore: false });
    this.loadList(true);
  },

  setFilter(e) {
    const status = Number(e.currentTarget.dataset.status);
    this.setData({ statusFilter: status, items: [], page: 0, noMore: false });
    this.loadList(true);
  },

  loadMore() {
    if (!this.data.loading && !this.data.noMore) this.loadList(false);
  },

  async loadList(reset) {
    if (this.data.loading) return;
    const page = reset ? 0 : this.data.page;
    this.setData({ loading: true });
    try {
      const status = this.data.statusFilter;
      let res;
      if (this.data.tab === "classifieds") {
        res = await api.adminGetClassifieds(status, page);
      } else {
        res = await api.adminGetBusinessSubmissions(status, page);
      }

      const items = (res.data || []).map((it) => ({
        ...it,
        categoryName: CATEGORY_MAP[it.category] || it.category,
        timeText: util.formatTime(it.created_at),
        statusText: statusText(it.status)
      }));

      this.setData({
        items: reset ? items : [...this.data.items, ...items],
        page: page + 1,
        noMore: items.length < api.PAGE_SIZE,
        loading: false
      });
    } catch (e) {
      console.error("管理页加载失败", e);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  goClassifiedDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/classified-detail/index?id=${id}` });
  },

  async setStatus(e) {
    const id = e.currentTarget.dataset.id;
    const status = Number(e.currentTarget.dataset.status);
    wx.showLoading({ title: "更新中..." });
    try {
      await api.updateClassified(id, { status, updated_at: new Date() });
      wx.hideLoading();
      wx.showToast({ title: "已更新", icon: "success" });
      this.loadList(true);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: "更新失败", icon: "none" });
    }
  },

  approveBiz(e) {
    const id = e.currentTarget.dataset.id;
    this.onBizDecision(id, true);
  },

  rejectBiz(e) {
    const id = e.currentTarget.dataset.id;
    this.onBizDecision(id, false);
  },

  async onBizDecision(id, approve) {
    wx.showLoading({ title: approve ? "入库中..." : "处理中..." });
    try {
      if (approve) {
        await api.adminApproveBusinessSubmission(id);
      } else {
        await api.adminUpdateBusinessSubmission(id, { status: -1, updated_at: new Date() });
      }
      wx.hideLoading();
      wx.showToast({ title: "已处理", icon: "success" });
      this.loadList(true);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "处理失败", icon: "none" });
    }
  }
});

