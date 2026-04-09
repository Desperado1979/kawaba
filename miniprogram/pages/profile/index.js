Page({
  data: {
    isLogin: false,
    userInfo: {},
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
  },

  onLogin() {
    wx.getUserProfile({
      desc: "用于展示用户信息",
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
    if (!this.data.isLogin) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    wx.showToast({ title: "功能开发中", icon: "none" });
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

  goFeedback() {
    wx.showModal({
      title: "意见反馈",
      content: "如有建议或问题，请联系我们：\nkawaba@community.vu",
      showCancel: false
    });
  },

  goAbout() {
    wx.showModal({
      title: "关于 Kawaba",
      content: "Kawaba 瓦努阿图华人社区\n\n致力于为瓦努阿图华人提供本地新闻资讯、分类信息、商家黄页等服务。\n\n版本：1.0.0",
      showCancel: false
    });
  }
});
