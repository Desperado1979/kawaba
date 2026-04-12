const api = require("../../utils/api");

const CATEGORY_OPTIONS = [
  { key: "food", name: "餐饮美食" },
  { key: "market", name: "超市百货" },
  { key: "travel", name: "旅游出行" },
  { key: "legal", name: "法律移民" },
  { key: "education", name: "教育培训" },
  { key: "medical", name: "医疗健康" },
  { key: "car", name: "汽车服务" },
  { key: "realestate", name: "房产中介" },
  { key: "other", name: "更多" }
];

Page({
  data: {
    categoryOptions: CATEGORY_OPTIONS,
    name: "",
    category: "",
    categoryName: "",
    address: "",
    phone: "",
    description: "",
    products: "",
    submitting: false
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onAddress(e) { this.setData({ address: e.detail.value }); },
  onPhone(e) { this.setData({ phone: e.detail.value }); },
  onDesc(e) { this.setData({ description: e.detail.value }); },
  onProducts(e) { this.setData({ products: e.detail.value }); },

  onCategoryChange(e) {
    const idx = Number(e.detail.value);
    const cat = CATEGORY_OPTIONS[idx];
    this.setData({ category: cat.key, categoryName: cat.name });
  },

  async onSubmit() {
    if (!this.data.name.trim()) return wx.showToast({ title: "请输入商家名称", icon: "none" });
    if (!this.data.category) return wx.showToast({ title: "请选择分类", icon: "none" });
    if (!this.data.phone.trim()) return wx.showToast({ title: "请输入联系电话", icon: "none" });
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: "提交中..." });
    try {
      await api.submitBusiness({
        name: this.data.name.trim(),
        category: this.data.category,
        address: this.data.address.trim(),
        phone: this.data.phone.trim(),
        description: this.data.description.trim(),
        products: this.data.products.trim(),
        status: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
      wx.hideLoading();
      wx.showModal({
        title: "提交成功",
        content: "已收到入驻申请，审核通过后将展示在黄页。",
        showCancel: false,
        success: () => wx.navigateBack()
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "提交失败", icon: "none" });
      this.setData({ submitting: false });
    }
  }
});

