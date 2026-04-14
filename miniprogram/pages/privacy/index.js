const api = require("../../utils/api");

Page({
  data: {
    contactEmail: api.DEFAULT_SITE_CONTACT.contact_email
  },

  async onShow() {
    const c = await api.ensureSiteContact();
    this.setData({ contactEmail: c.contact_email || api.DEFAULT_SITE_CONTACT.contact_email });
  }
});
