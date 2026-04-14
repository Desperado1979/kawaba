const api = require("../../utils/api");

Page({
  data: {
    isLogin: false,
    userInfo: {},
    versionTapCount: 0,
    versionTapTimer: null,
    stats: {
      published: 0,
      favorites: 0,
      views: 0
    }
  },

  onShow() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        isLogin: true,
        userInfo: app.globalData.userInfo
      });
    }
    api.ensureSiteContact().catch(() => {});
  },

  onLogin() {
    wx.getUserProfile({
      desc: "用于在「我的」页展示您的头像与昵称，便于识别账号；不用于营销",
      success: (res) => {
        const userInfo = {
          nickname: res.userInfo.nickName,
          avatar: res.userInfo.avatarUrl
        };
        const app = getApp();
        app.globalData.userInfo = userInfo;
        app.globalData.isLogin = true;
        this.setData({ isLogin: true, userInfo });
      },
      fail: () => {
        wx.showToast({ title: "登录取消", icon: "none" });
      }
    });
  },

  goMyPublish() {
    wx.navigateTo({ url: "/pages/my-classifieds/index" });
  },

  goMyFavorites() {
    if (!this.data.isLogin) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    wx.showToast({ title: "功能开发中", icon: "none" });
  },

  goMyViews() {
    wx.showToast({ title: "功能开发中", icon: "none" });
  },

  async goFeedback() {
    const c = await api.ensureSiteContact();
    let content = `如有建议或问题，请发邮件至：\n${c.contact_email}`;
    if (c.contact_phone) content += `\n电话：${c.contact_phone}`;
    if (c.contact_note) content += `\n\n${c.contact_note}`;
    content += "\n\n也可在下方使用「联系客服」（若平台已恢复该能力）。";
    wx.showModal({ title: "意见反馈", content, showCancel: false });
  },

  async goAbout() {
    const c = await api.ensureSiteContact();
    let content =
      "Kavabar 瓦努阿图华人社区\n\n资讯、分类信息与商家黄页等内容由运营方在后台统一维护与审核发布；小程序内不提供用户自行发布、编辑或上传图文/音视频等功能。\n\n";
    content += `如需刊登或更正信息，请联系：\n${c.contact_email}`;
    if (c.contact_phone) content += `\n电话：${c.contact_phone}`;
    if (c.contact_note) content += `\n\n${c.contact_note}`;
    content += "\n\n版本：1.0.0";
    wx.showModal({ title: "关于 Kavabar", content, showCancel: false });
  },

  goPrivacyPolicy() {
    wx.navigateTo({ url: "/pages/privacy/index" });
  },

  onVersionTap() {
    // 3秒内连续点击8次触发管理页入口
    const next = this.data.versionTapCount + 1;
    this.setData({ versionTapCount: next });

    if (this.data.versionTapTimer) clearTimeout(this.data.versionTapTimer);
    const timer = setTimeout(() => {
      this.setData({ versionTapCount: 0, versionTapTimer: null });
    }, 3000);
    this.setData({ versionTapTimer: timer });

    if (next >= 8) {
      this.setData({ versionTapCount: 0 });
      wx.navigateTo({ url: "/pages/admin/index" });
    }
  },

  onShareAppMessage() {
    return {
      title: "Kavabar 瓦努阿图华人社区",
      path: "/pages/index/index"
    };
  },

  onShareTimeline() {
    return { title: "Kavabar 瓦努阿图华人社区" };
  }
});
