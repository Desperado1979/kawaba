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

  async initData() {
    const newsData = [
      { title: "瓦努阿图华人社区举办2026年新春联欢晚会 近300人参加", content: "4月5日晚，瓦努阿图华人华侨联合会在维拉港Grand Hotel举办2026年新春联欢晚会。中国驻瓦努阿图大使出席致辞，近300名华人华侨及当地友人参加。", category: "chinese", source: "Kavabar", cover_image: "", view_count: 328, is_top: true, created_at: new Date("2026-04-08T10:00:00Z") },
      { title: "维拉港新国际航线即将开通 直飞布里斯班仅需3小时", content: "Air Vanuatu 宣布将于2026年6月开通维拉港至布里斯班直飞航线，每周三班。单程票价约350澳元起。", category: "local", source: "Vanuatu Daily Post", cover_image: "", view_count: 512, is_top: true, created_at: new Date("2026-04-07T08:30:00Z") },
      { title: "瓦努阿图房产投资指南：2026年最新政策解读", content: "瓦努阿图政府近期更新了外国人购房政策。外国人可购买最长75年土地租赁权，审批流程缩短至3个月。", category: "life", source: "Kavabar", cover_image: "", view_count: 245, is_top: false, created_at: new Date("2026-04-06T14:20:00Z") },
      { title: "本地华人超市「万家福」新店开业 特价优惠持续两周", content: "位于维拉港Nambatu区的万家福华人超市新店于4月1日正式开业。新店面积较原店扩大一倍。", category: "chinese", source: "Kavabar", cover_image: "", view_count: 189, is_top: false, created_at: new Date("2026-04-05T09:00:00Z") },
      { title: "瓦努阿图旅游旺季来临 酒店预订量同比增长40%", content: "随着南半球秋季到来，瓦努阿图迎来旅游旺季。4-9月期间酒店预订量较去年同期增长40%。", category: "local", source: "Vanuatu Tourism Office", cover_image: "", view_count: 673, is_top: false, created_at: new Date("2026-04-04T16:45:00Z") },
      { title: "瓦努阿图中文学校招生 本学期开设少儿和成人班", content: "瓦努阿图中文学校2026年第二学期招生开始。开设少儿启蒙班、进阶班和成人会话班。", category: "chinese", source: "Kavabar", cover_image: "", view_count: 156, is_top: false, created_at: new Date("2026-04-03T11:00:00Z") },
      { title: "热带气旋预警：4月中旬可能有强风暴影响瓦努阿图", content: "瓦努阿图气象局发布预警，一个热带低压正在珊瑚海形成，预计4月中旬可能影响中南部岛屿。", category: "local", source: "Vanuatu Meteorology", cover_image: "", view_count: 891, is_top: false, created_at: new Date("2026-04-02T07:15:00Z") },
      { title: "维拉港新开中医诊所 提供针灸推拿等传统疗法", content: "由来自广州的李医生开设的「南洋中医馆」于上月在维拉港市中心正式营业。", category: "life", source: "Kavabar", cover_image: "", view_count: 203, is_top: false, created_at: new Date("2026-04-01T13:30:00Z") },
      { title: "瓦努阿图公民身份项目2026年新规 投资门槛调整", content: "瓦努阿图政府宣布自2026年7月1日起调整公民身份投资计划，单人申请门槛调至15万美元。", category: "life", source: "Kavabar", cover_image: "", view_count: 467, is_top: false, created_at: new Date("2026-03-30T10:00:00Z") },
      { title: "Santo岛华人种植园喜获丰收 有机蔬菜供应维拉港", content: "位于Santo岛的华人有机蔬菜种植园今年产量较去年增长30%，主要品种包括白菜、芥兰、番茄等。", category: "chinese", source: "Kavabar", cover_image: "", view_count: 134, is_top: false, created_at: new Date("2026-03-28T15:00:00Z") }
    ];
    const classifiedsData = [
      { title: "维拉港市中心两室一厅公寓出租 近中国城", description: "步行5分钟到中国城，家具家电齐全，24小时热水。", category: "rent", price: 85000, contact: "+678 5551001", location: "维拉港市中心", images: [], status: 1, created_at: new Date("2026-04-08T12:00:00Z") },
      { title: "Nambatu区独栋小别墅整租 带花园", description: "三室两厅两卫，带围墙花园约200平米，已装中式灶台。", category: "rent", price: 150000, contact: "+678 5551002", location: "Nambatu, Port Vila", images: [], status: 1, created_at: new Date("2026-04-07T10:00:00Z") },
      { title: "招聘中餐厨师 待遇优厚 包食宿", description: "金龙中餐厅诚聘中餐厨师，要求3年以上经验，月薪15-20万VUV。", category: "job", price: null, contact: "+678 5552001", location: "维拉港", images: [], status: 1, created_at: new Date("2026-04-07T09:00:00Z") },
      { title: "诚聘门店销售员 会中英文优先", description: "华人百货店招聘销售员2名，底薪8万VUV+提成。", category: "job", price: null, contact: "+678 5552002", location: "维拉港", images: [], status: 1, created_at: new Date("2026-04-06T14:00:00Z") },
      { title: "九成新丰田Hilux皮卡出售 低公里数", description: "2023款4WD柴油版，行驶仅28000公里，车况极佳。", category: "secondhand", price: 3200000, contact: "+678 5553001", location: "维拉港", images: [], status: 1, created_at: new Date("2026-04-06T15:30:00Z") },
      { title: "全套餐厅设备低价转让", description: "8套餐桌椅、商用冰柜2台、燃气灶2组等，8成新以上。", category: "secondhand", price: 800000, contact: "+678 5553002", location: "维拉港", images: [], status: 1, created_at: new Date("2026-04-05T11:00:00Z") },
      { title: "专业搬家服务 全岛覆盖 价格实惠", description: "自有3吨货车，维拉港市内搬家起步价1.5万VUV。", category: "service", price: null, contact: "+678 5554001", location: "全岛", images: [], status: 1, created_at: new Date("2026-04-05T08:00:00Z") },
      { title: "中英文翻译服务 文件翻译 陪同口译", description: "商务文件、法律合同、移民资料翻译，8年经验。", category: "service", price: null, contact: "+678 5554002", location: "维拉港", images: [], status: 1, created_at: new Date("2026-04-04T09:30:00Z") }
    ];
    const businessesData = [
      { name: "金龙中餐厅", category: "food", address: "Lini Highway, Port Vila", phone: "+678 23666", description: "主营粤菜和川菜，招牌糖醋鱼、宫保鸡丁。", cover_image: "", rating: 4.8, created_at: new Date("2026-01-15") },
      { name: "福满楼酒家", category: "food", address: "Rue de Paris, Port Vila", phone: "+678 24888", description: "中式火锅和烧烤，适合家庭聚餐。", cover_image: "", rating: 4.5, created_at: new Date("2026-01-20") },
      { name: "万家福华人超市", category: "market", address: "Nambatu, Port Vila", phone: "+678 22888", description: "瓦努阿图最大华人超市，各类中国食品日用品。", cover_image: "", rating: 4.5, created_at: new Date("2026-02-01") },
      { name: "百汇百货商店", category: "market", address: "Kumul Highway, Port Vila", phone: "+678 22999", description: "电子产品、家居用品、五金工具、服装鞋帽。", cover_image: "", rating: 4.2, created_at: new Date("2026-02-10") },
      { name: "南太平洋旅行社", category: "travel", address: "Kumul Highway, Port Vila", phone: "+678 25888", description: "本地游和国际机票，Tanna火山、Santo蓝洞。", cover_image: "", rating: 4.2, created_at: new Date("2026-02-15") },
      { name: "维拉港法律事务所", category: "legal", address: "Main Street, Port Vila", phone: "+678 22100", description: "移民法、商业法、房产交易，有中文律师。", cover_image: "", rating: 4.6, created_at: new Date("2026-02-20") },
      { name: "太平洋移民咨询", category: "legal", address: "Rue Higginson, Port Vila", phone: "+678 28800", description: "投资移民和公民身份申请，成功案例超500例。", cover_image: "", rating: 4.4, created_at: new Date("2026-03-01") },
      { name: "瓦努阿图中文学校", category: "education", address: "华人活动中心, Port Vila", phone: "+678 5551234", description: "少儿启蒙班、进阶班和成人会话班。", cover_image: "", rating: 4.7, created_at: new Date("2026-03-05") },
      { name: "南洋中医馆", category: "medical", address: "Rue Carnot, Port Vila", phone: "+678 5559876", description: "中医内科、针灸、推拿、拔罐，20年经验。", cover_image: "", rating: 4.9, created_at: new Date("2026-03-10") },
      { name: "ProMedical维拉诊所", category: "medical", address: "Lini Highway, Port Vila", phone: "+678 22567", description: "全科诊疗、体检、疫苗接种，急诊24小时。", cover_image: "", rating: 4.3, created_at: new Date("2026-03-15") },
      { name: "Toyota维拉港授权服务中心", category: "car", address: "Teouma Road, Port Vila", phone: "+678 26789", description: "新车销售、保养维修、零配件供应。", cover_image: "", rating: 4.4, created_at: new Date("2026-03-20") },
      { name: "瓦努阿图置业顾问", category: "realestate", address: "Rue de Paris, Port Vila", phone: "+678 29900", description: "住宅商业地产买卖租赁，中英文双语顾问。", cover_image: "", rating: 4.5, created_at: new Date("2026-03-25") }
    ];

    const results = { news: 0, classifieds: 0, businesses: 0 };
    const errors = [];

    for (const item of newsData) {
      try { await db.collection("news").add({ data: item }); results.news++; } catch (e) { errors.push("news: " + e.message); }
    }
    for (const item of classifiedsData) {
      try { await db.collection("classifieds").add({ data: item }); results.classifieds++; } catch (e) { errors.push("classifieds: " + e.message); }
    }
    for (const item of businessesData) {
      try { await db.collection("businesses").add({ data: item }); results.businesses++; } catch (e) { errors.push("businesses: " + e.message); }
    }

    return { success: errors.length === 0, results, errors: errors.slice(0, 3) };
  },

  cleanupDemoNews() {
    return wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "cleanupDemoNews" }
    });
  },

  getNewsList(category, page = 0) {
    // 须先 where 再 orderBy；先前写法在非「全部」时可能报错，触发首页 loadMockNews 假数据。
    let query = db.collection("news");
    if (category && category !== "all") {
      if (category === "local") {
        query = query.where({ category: "local" });
      } else {
        query = query.where({ category });
      }
    }
    return query
      .orderBy("created_at", "desc")
      .skip(page * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .get();
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

  getMyClassifieds(deviceId, page = 0) {
    return db.collection("classifieds")
      .where({ device_id: deviceId })
      .orderBy("created_at", "desc")
      .skip(page * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .get();
  },

  updateClassified(id, data) {
    return db.collection("classifieds").doc(id).update({ data });
  },

  adminGetClassifieds(status, page = 0) {
    let query = db.collection("classifieds").orderBy("created_at", "desc");
    if (status !== -999) query = query.where({ status });
    return query.skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
  },

  // business submissions (admin + user)
  submitBusiness(data) {
    return db.collection("business_submissions").add({ data });
  },

  adminGetBusinessSubmissions(status, page = 0) {
    let query = db.collection("business_submissions").orderBy("created_at", "desc");
    if (status !== -999) query = query.where({ status });
    return query.skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
  },

  adminUpdateBusinessSubmission(id, data) {
    return db.collection("business_submissions").doc(id).update({ data });
  },

  async adminApproveBusinessSubmission(id) {
    const subRes = await db.collection("business_submissions").doc(id).get();
    const sub = subRes.data;
    if (!sub) throw new Error("submission not found");

    await db.collection("businesses").add({
      data: {
        name: sub.name,
        category: sub.category,
        address: sub.address,
        phone: sub.phone || sub.contact || "",
        description: sub.description || "",
        cover_image: sub.cover_image || "",
        rating: 0,
        created_at: new Date()
      }
    });

    await db.collection("business_submissions").doc(id).update({
      data: { status: 1, updated_at: new Date() }
    });
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
