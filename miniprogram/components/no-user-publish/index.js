const api = require("../../utils/api");

Component({
  properties: {
    topic: {
      type: String,
      value: "本类"
    },
    body: {
      type: String,
      value: ""
    }
  },
  data: {
    contactEmail: "",
    contactPhone: "",
    contactNote: ""
  },
  lifetimes: {
    attached() {
      this.syncContact();
    }
  },
  pageLifetimes: {
    show() {
      this.syncContact();
    }
  },
  methods: {
    async syncContact() {
      try {
        await api.ensureSiteContact();
        const c = getApp().globalData.siteContact || {};
        this.setData({
          contactEmail: c.contact_email || api.DEFAULT_SITE_CONTACT.contact_email,
          contactPhone: c.contact_phone || "",
          contactNote: c.contact_note || ""
        });
      } catch (e) {
        this.setData({
          contactEmail: api.DEFAULT_SITE_CONTACT.contact_email,
          contactPhone: "",
          contactNote: ""
        });
      }
    },
    openPrivacy() {
      wx.navigateTo({ url: "/pages/privacy/index" });
    }
  }
});
