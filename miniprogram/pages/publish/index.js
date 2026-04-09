const api = require("../../utils/api");
const util = require("../../utils/util");

const CATEGORY_OPTIONS = [
  { key: "rent", name: "租房" },
  { key: "job", name: "招聘" },
  { key: "secondhand", name: "二手交易" },
  { key: "service", name: "生活服务" }
];

Page({
  data: {
    categoryOptions: CATEGORY_OPTIONS,
    selectedCategory: "",
    selectedCategoryName: "",
    title: "",
    description: "",
    price: "",
    location: "",
    contact: "",
    images: [],
    submitting: false
  },

  onCategoryChange(e) {
    const idx = e.detail.value;
    const cat = CATEGORY_OPTIONS[idx];
    this.setData({
      selectedCategory: cat.key,
      selectedCategoryName: cat.name
    });
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },
  onPriceInput(e) { this.setData({ price: e.detail.value }); },
  onLocationInput(e) { this.setData({ location: e.detail.value }); },
  onContactInput(e) { this.setData({ contact: e.detail.value }); },

  chooseImage() {
    const remaining = 3 - this.data.images.length;
    wx.chooseMedia({
      count: remaining,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          images: [...this.data.images, ...newImages]
        });
      }
    });
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(idx, 1);
    this.setData({ images });
  },

  async onSubmit() {
    if (!this.data.selectedCategory) {
      wx.showToast({ title: "请选择分类", icon: "none" });
      return;
    }
    if (!this.data.title.trim()) {
      wx.showToast({ title: "请输入标题", icon: "none" });
      return;
    }
    if (!this.data.contact.trim()) {
      wx.showToast({ title: "请输入联系电话", icon: "none" });
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });
    wx.showLoading({ title: "发布中..." });

    try {
      const deviceId = util.getOrCreateDeviceId();
      let uploadedImages = [];
      for (const img of this.data.images) {
        const cloudPath = `classifieds/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: img
        });
        uploadedImages.push(uploadRes.fileID);
      }

      await api.publishClassified({
        title: this.data.title.trim(),
        description: this.data.description.trim(),
        category: this.data.selectedCategory,
        price: this.data.price ? Number(this.data.price) : null,
        location: this.data.location.trim(),
        contact: this.data.contact.trim(),
        images: uploadedImages,
        device_id: deviceId,
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      });

      wx.hideLoading();
      wx.showToast({ title: "发布成功", icon: "success" });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (e) {
      console.error("发布失败", e);
      wx.hideLoading();
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
      this.setData({ submitting: false });
    }
  }
});
