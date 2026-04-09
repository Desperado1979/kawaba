const api = require("../../utils/api");
const util = require("../../utils/util");

Page({
  data: {
    id: "",
    loaded: false,
    title: "",
    description: "",
    price: "",
    location: "",
    contact: "",
    deviceId: ""
  },

  onLoad(options) {
    const deviceId = util.getOrCreateDeviceId();
    this.setData({ id: options.id, deviceId });
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const res = await api.getClassifiedDetail(this.data.id);
      const item = res.data;
      if (item.device_id && item.device_id !== this.data.deviceId) {
        wx.showModal({
          title: "无权限",
          content: "该信息不是由本机发布，无法编辑。",
          showCancel: false,
          success: () => wx.navigateBack()
        });
        return;
      }

      this.setData({
        loaded: true,
        title: item.title || "",
        description: item.description || "",
        price: item.price || "",
        location: item.location || "",
        contact: item.contact || ""
      });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1200);
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },
  onPriceInput(e) { this.setData({ price: e.detail.value }); },
  onLocationInput(e) { this.setData({ location: e.detail.value }); },
  onContactInput(e) { this.setData({ contact: e.detail.value }); },

  async onSave() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: "请输入标题", icon: "none" });
      return;
    }
    if (!this.data.contact.trim()) {
      wx.showToast({ title: "请输入联系电话", icon: "none" });
      return;
    }

    wx.showLoading({ title: "保存中..." });
    try {
      await api.updateClassified(this.data.id, {
        title: this.data.title.trim(),
        description: this.data.description.trim(),
        price: this.data.price ? Number(this.data.price) : null,
        location: this.data.location.trim(),
        contact: this.data.contact.trim(),
        updated_at: new Date()
      });
      wx.hideLoading();
      wx.showToast({ title: "已保存", icon: "success" });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    }
  }
});

