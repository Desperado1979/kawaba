const api = require("../../utils/api");
const util = require("../../utils/util");

const CATEGORY_MAP = {
  lost: "寻物启事",
  rent: "租房",
  job: "招聘",
  business_transfer: "生意转让",
  property: "土地物业",
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
  hardware: "五金建材",
  other: "更多"
};

const CLASSIFIED_CAT_OPTIONS = Object.keys(CATEGORY_MAP).map((key) => ({
  key,
  name: CATEGORY_MAP[key]
}));

const BIZ_CAT_OPTIONS = [
  { key: "food", name: "餐饮美食" },
  { key: "market", name: "超市百货" },
  { key: "travel", name: "旅游出行" },
  { key: "legal", name: "法律移民" },
  { key: "education", name: "教育培训" },
  { key: "medical", name: "医疗健康" },
  { key: "car", name: "汽车服务" },
  { key: "realestate", name: "房产中介" },
  { key: "finance", name: "金融保险" },
  { key: "beauty", name: "美容美发" },
  { key: "repair", name: "维修装修" },
  { key: "hardware", name: "五金建材" },
  { key: "other", name: "更多" }
];

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
    noMore: false,
    formEmail: "",
    formPhone: "",
    formNote: "",
    classifiedCatOptions: CLASSIFIED_CAT_OPTIONS,
    bizCatOptions: BIZ_CAT_OPTIONS,
    cfCatIndex: 0,
    cfStatusLabels: ["上架", "待审"],
    cfStatusIndex: 0,
    cfTitle: "",
    cfDesc: "",
    cfPrice: "",
    cfContact: "",
    cfLocation: "",
    bizCatIndex: 0,
    bizName: "",
    bizAddress: "",
    bizPhone: "",
    bizDesc: "",
    bizCover: "",
    bizProducts: "",
    bizRating: ""
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
    if (tab === "settings" || tab === "publish") {
      this.setData({ tab, items: [], page: 0, noMore: true, loading: false });
      if (tab === "settings") this.loadSettingsForm();
      return;
    }
    this.setData({ tab, items: [], page: 0, noMore: false });
    this.loadList(true);
  },

  async loadSettingsForm() {
    try {
      const c = await api.getSiteContact();
      this.setData({
        formEmail: c.contact_email,
        formPhone: c.contact_phone,
        formNote: c.contact_note
      });
    } catch (e) {
      wx.showToast({ title: "读取配置失败", icon: "none" });
    }
  },

  onFormEmail(e) {
    this.setData({ formEmail: e.detail.value });
  },

  onFormPhone(e) {
    this.setData({ formPhone: e.detail.value });
  },

  onFormNote(e) {
    this.setData({ formNote: e.detail.value });
  },

  async onSaveSiteContact() {
    if (!this.data.formEmail.trim()) {
      wx.showToast({ title: "请填写对外邮箱", icon: "none" });
      return;
    }
    wx.showLoading({ title: "保存中..." });
    try {
      await api.saveSiteContact({
        contact_email: this.data.formEmail,
        contact_phone: this.data.formPhone,
        contact_note: this.data.formNote
      });
      const fresh = await api.getSiteContact();
      getApp().globalData.siteContact = fresh;
      wx.hideLoading();
      wx.showToast({ title: "已保存", icon: "success" });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: "保存失败，检查云库权限", icon: "none" });
    }
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
  },

  onCfCatChange(e) {
    this.setData({ cfCatIndex: Number(e.detail.value) });
  },

  onCfStatusChange(e) {
    this.setData({ cfStatusIndex: Number(e.detail.value) });
  },

  onCfTitle(e) {
    this.setData({ cfTitle: e.detail.value });
  },

  onCfDesc(e) {
    this.setData({ cfDesc: e.detail.value });
  },

  onCfPrice(e) {
    this.setData({ cfPrice: e.detail.value });
  },

  onCfContact(e) {
    this.setData({ cfContact: e.detail.value });
  },

  onCfLocation(e) {
    this.setData({ cfLocation: e.detail.value });
  },

  onBizCatChange(e) {
    this.setData({ bizCatIndex: Number(e.detail.value) });
  },

  onBizName(e) {
    this.setData({ bizName: e.detail.value });
  },

  onBizAddress(e) {
    this.setData({ bizAddress: e.detail.value });
  },

  onBizPhone(e) {
    this.setData({ bizPhone: e.detail.value });
  },

  onBizDesc(e) {
    this.setData({ bizDesc: e.detail.value });
  },

  onBizCover(e) {
    this.setData({ bizCover: e.detail.value });
  },

  onBizProducts(e) {
    this.setData({ bizProducts: e.detail.value });
  },

  onBizRating(e) {
    this.setData({ bizRating: e.detail.value });
  },

  async onSubmitClassified() {
    const opts = this.data.classifiedCatOptions;
    const idx = this.data.cfCatIndex;
    const category = opts[idx] && opts[idx].key;
    const status = this.data.cfStatusIndex === 1 ? 0 : 1;
    wx.showLoading({ title: "发布中..." });
    try {
      await api.adminAddClassified({
        title: this.data.cfTitle,
        description: this.data.cfDesc,
        category,
        price: this.data.cfPrice,
        contact: this.data.cfContact,
        location: this.data.cfLocation,
        status
      });
      wx.hideLoading();
      wx.showToast({ title: "已发布", icon: "success" });
      this.setData({
        cfTitle: "",
        cfDesc: "",
        cfPrice: "",
        cfContact: "",
        cfLocation: "",
        cfCatIndex: 0,
        cfStatusIndex: 0
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || "发布失败", icon: "none" });
    }
  },

  async onSubmitBusiness() {
    const opts = this.data.bizCatOptions;
    const idx = this.data.bizCatIndex;
    const category = opts[idx] && opts[idx].key;
    wx.showLoading({ title: "发布中..." });
    try {
      await api.adminAddBusiness({
        name: this.data.bizName,
        category,
        address: this.data.bizAddress,
        phone: this.data.bizPhone,
        description: this.data.bizDesc,
        cover_image: this.data.bizCover,
        products: this.data.bizProducts,
        rating: this.data.bizRating
      });
      wx.hideLoading();
      wx.showToast({ title: "已入库", icon: "success" });
      this.setData({
        bizName: "",
        bizAddress: "",
        bizPhone: "",
        bizDesc: "",
        bizCover: "",
        bizProducts: "",
        bizRating: "",
        bizCatIndex: 0
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || "发布失败", icon: "none" });
    }
  }
});

