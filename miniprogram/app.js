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
          mgr.applyUpdate();
        });
      }
    });
  }
});
