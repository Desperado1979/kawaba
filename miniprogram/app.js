App({
  globalData: {
    env: "cloud1-4gpp2a4lba18afaf",
    userInfo: null,
    isLogin: false,
    // Admin gate for simple in-app moderation page.
    // Change this value before releasing publicly.
    adminKey: "kavabar-admin"
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      return;
    }
    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true
    });

    this.checkUpdate();
  },

  checkUpdate() {
    if (!wx.canIUse("getUpdateManager")) return;
    const mgr = wx.getUpdateManager();
    mgr.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        mgr.onUpdateReady(() => {
          wx.showModal({
            title: "发现新版本",
            content: "新版本已下载，是否立即重启？",
            success(r) {
              if (r.confirm) mgr.applyUpdate();
            }
          });
        });
        mgr.onUpdateFailed(() => {
          wx.showModal({
            title: "更新提示",
            content: "新版本下载失败，请删除小程序后重新打开",
            showCancel: false
          });
        });
      }
    });
  }
});
