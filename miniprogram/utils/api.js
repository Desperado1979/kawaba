const db = wx.cloud.database();
const _ = db.command;

const PAGE_SIZE = 10;

module.exports = {
  getTopNews() {
    return db.collection("news")
      .where({ is_top: true })
      .orderBy("created_at", "desc")
      .limit(5)
      .get();
  },

  initData() {
    return wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "initData" }
    });
  },

  getNewsList(category, page = 0) {
    let query = db.collection("news").orderBy("created_at", "desc");
    if (category && category !== "all") {
      query = query.where({ category });
    }
    return query.skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
  },

  getNewsDetail(id) {
    return db.collection("news").doc(id).get();
  },

  incrementViewCount(id) {
    return db.collection("news").doc(id).update({
      data: { view_count: _.inc(1) }
    });
  },

  getClassifiedsList(category, page = 0) {
    let query = db.collection("classifieds")
      .where({ status: 1 })
      .orderBy("created_at", "desc");
    if (category && category !== "all") {
      query = query.where({ category, status: 1 });
    }
    return query.skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
  },

  getClassifiedDetail(id) {
    return db.collection("classifieds").doc(id).get();
  },

  publishClassified(data) {
    return db.collection("classifieds").add({ data });
  },

  getBusinessList(category, page = 0) {
    let query = db.collection("businesses").orderBy("rating", "desc");
    if (category && category !== "all") {
      query = query.where({ category });
    }
    return query.skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
  },

  getBusinessDetail(id) {
    return db.collection("businesses").doc(id).get();
  },

  search(keyword, collection, page = 0) {
    return db.collection(collection)
      .where({
        title: db.RegExp({
          regexp: keyword,
          options: "i"
        })
      })
      .skip(page * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .get();
  },

  getUserInfo(openid) {
    return db.collection("users").where({ openid }).get();
  },

  updateUserInfo(openid, data) {
    return db.collection("users").where({ openid }).update({ data });
  },

  createUser(data) {
    return db.collection("users").add({ data });
  },

  PAGE_SIZE
};
