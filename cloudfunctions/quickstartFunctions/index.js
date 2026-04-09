const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// ==================== 原有功能 ====================

const getOpenId = async () => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

const getMiniProgramCode = async () => {
  const resp = await cloud.openapi.wxacode.get({ path: "pages/index/index" });
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: resp.buffer,
  });
  return upload.fileID;
};

// ==================== Kavabar 数据初始化 ====================

const NEWS_DATA = [
  {
    title: "瓦努阿图华人社区举办2026年新春联欢晚会 近300人参加",
    content: "4月5日晚，瓦努阿图华人华侨联合会在维拉港Grand Hotel举办2026年新春联欢晚会。中国驻瓦努阿图大使出席致辞，近300名华人华侨及当地友人参加。晚会节目精彩纷呈，包括舞龙舞狮、民族歌舞、诗朗诵等。联合会会长表示，将继续加强华人社区凝聚力，促进中瓦两国人民友谊。",
    category: "chinese",
    source: "Kavabar",
    cover_image: "",
    view_count: 328,
    is_top: true,
    created_at: new Date("2026-04-08T10:00:00Z")
  },
  {
    title: "维拉港新国际航线即将开通 直飞布里斯班仅需3小时",
    content: "Air Vanuatu 宣布将于2026年6月开通维拉港至布里斯班直飞航线，每周三班。单程票价约350澳元起。这是继悉尼、奥克兰航线后又一重要国际航线，将进一步便利瓦努阿图与澳大利亚之间的人员往来和贸易交流。旅行社表示已收到大量咨询。",
    category: "local",
    source: "Vanuatu Daily Post",
    cover_image: "",
    view_count: 512,
    is_top: true,
    created_at: new Date("2026-04-07T08:30:00Z")
  },
  {
    title: "瓦努阿图房产投资指南：2026年最新政策解读",
    content: "瓦努阿图政府近期更新了外国人购房政策。根据新规，外国人可以购买最长75年的土地租赁权，审批流程从原来的6个月缩短至3个月。维拉港核心地段公寓价格约15-30万美元，海景别墅50-120万美元。投资瓦努阿图房产还可申请永久居留权，成为许多华人关注的热点。",
    category: "life",
    source: "Kavabar",
    cover_image: "",
    view_count: 245,
    is_top: false,
    created_at: new Date("2026-04-06T14:20:00Z")
  },
  {
    title: "本地华人超市「万家福」新店开业 特价优惠持续两周",
    content: "位于维拉港Nambatu区的万家福华人超市新店于4月1日正式开业。新店面积较原店扩大一倍，新增生鲜蔬果区和中式熟食档口。开业期间全场商品享8.5折优惠，部分商品买一送一。店主表示将持续引进更多中国食品，满足华人社区日常需求。",
    category: "chinese",
    source: "Kavabar",
    cover_image: "",
    view_count: 189,
    is_top: false,
    created_at: new Date("2026-04-05T09:00:00Z")
  },
  {
    title: "瓦努阿图旅游旺季来临 酒店预订量同比增长40%",
    content: "随着南半球秋季到来，瓦努阿图迎来旅游旺季。据瓦努阿图旅游局统计，4-9月期间酒店预订量较去年同期增长40%。维拉港主要酒店入住率已超80%。火山岛Tanna和潜水胜地Santo是最受欢迎的目的地。当地旅行社建议游客提前两周以上预订住宿。",
    category: "local",
    source: "Vanuatu Tourism Office",
    cover_image: "",
    view_count: 673,
    is_top: false,
    created_at: new Date("2026-04-04T16:45:00Z")
  },
  {
    title: "瓦努阿图中文学校招生 本学期开设少儿和成人班",
    content: "瓦努阿图中文学校2026年第二学期招生开始。本学期开设少儿启蒙班（4-7岁）、少儿进阶班（8-12岁）和成人日常会话班三个班级。每周六上午9:00-12:00在维拉港华人活动中心上课。学费每学期200美元，华人子女优惠价150美元。报名请联系张老师：+678 5551234。",
    category: "chinese",
    source: "Kavabar",
    cover_image: "",
    view_count: 156,
    is_top: false,
    created_at: new Date("2026-04-03T11:00:00Z")
  },
  {
    title: "热带气旋预警：4月中旬可能有强风暴影响瓦努阿图",
    content: "瓦努阿图气象局发布预警，一个热带低压正在珊瑚海形成，预计4月中旬可能发展为热带气旋并影响瓦努阿图中南部岛屿。气象局建议居民提前储备饮用水和食物，加固房屋，关注官方更新。中国大使馆也提醒在瓦华人注意安全，做好防灾准备。",
    category: "local",
    source: "Vanuatu Meteorology",
    cover_image: "",
    view_count: 891,
    is_top: false,
    created_at: new Date("2026-04-02T07:15:00Z")
  },
  {
    title: "维拉港新开中医诊所 提供针灸推拿等传统疗法",
    content: "由来自广州的李医生开设的「南洋中医馆」于上月在维拉港市中心正式营业。诊所提供中医内科、针灸、推拿、拔罐等传统中医服务。李医生拥有20年临床经验，曾在广东省中医院任职。诊所同时提供英语和比斯拉马语服务，方便当地患者就诊。预约电话：+678 5559876。",
    category: "life",
    source: "Kavabar",
    cover_image: "",
    view_count: 203,
    is_top: false,
    created_at: new Date("2026-04-01T13:30:00Z")
  },
  {
    title: "瓦努阿图公民身份项目2026年新规 投资门槛调整",
    content: "瓦努阿图政府宣布自2026年7月1日起调整公民身份投资计划（VCP）。单人申请投资门槛从13万美元调整为15万美元，家庭申请（含配偶和两名子女）从18万美元调整为20万美元。新规同时增加了背景调查深度。移民律师建议有意向的申请人在新规生效前提交申请。",
    category: "life",
    source: "Kavabar",
    cover_image: "",
    view_count: 467,
    is_top: false,
    created_at: new Date("2026-03-30T10:00:00Z")
  },
  {
    title: "Santo岛华人种植园喜获丰收 有机蔬菜供应维拉港市场",
    content: "位于Santo岛Luganville附近的华人有机蔬菜种植园今年迎来丰收。种植园主王先生介绍，今年产量较去年增长30%，主要品种包括白菜、芥兰、番茄、黄瓜等。部分蔬菜已开始供应维拉港超市和中餐馆。王先生计划明年扩大种植面积，同时培训当地员工参与种植管理。",
    category: "chinese",
    source: "Kavabar",
    cover_image: "",
    view_count: 134,
    is_top: false,
    created_at: new Date("2026-03-28T15:00:00Z")
  }
];

const CLASSIFIEDS_DATA = [
  {
    title: "维拉港市中心两室一厅公寓出租 近中国城 拎包入住",
    description: "位于维拉港市中心Rue Carnot，步行5分钟到中国城。两室一厅，带阳台，家具家电齐全。24小时热水，独立卫浴，安全停车位。适合华人家庭或情侣。租期一年起，押一付三。欢迎看房。",
    category: "rent",
    price: 85000,
    contact: "+678 5551001",
    location: "维拉港市中心",
    images: [],
    status: 1,
    created_at: new Date("2026-04-08T12:00:00Z")
  },
  {
    title: "Nambatu区独栋小别墅整租 带花园 适合家庭",
    description: "三室两厅两卫独栋别墅，带围墙花园约200平米。客厅宽敞，厨房已安装中式灶台。距离万家福超市步行10分钟，距国际学校车程5分钟。月租含基本物业管理，水电费另算。",
    category: "rent",
    price: 150000,
    contact: "+678 5551002",
    location: "Nambatu, Port Vila",
    images: [],
    status: 1,
    created_at: new Date("2026-04-07T10:00:00Z")
  },
  {
    title: "招聘中餐厨师 待遇优厚 包食宿",
    description: "金龙中餐厅诚聘中餐厨师一名。要求：3年以上中餐烹饪经验，擅长粤菜或川菜。待遇：月薪15-20万VUV（约1200-1600美元），包食宿，每月休息4天。提供工作签证协助。有意者请电话联系或发简历至邮箱。",
    category: "job",
    price: null,
    contact: "+678 5552001",
    location: "维拉港",
    images: [],
    status: 1,
    created_at: new Date("2026-04-07T09:00:00Z")
  },
  {
    title: "诚聘门店销售员 会中英文优先 待遇好",
    description: "维拉港华人百货店招聘销售员2名。要求：能基本沟通中文和英文（或比斯拉马语），性格开朗，吃苦耐劳。待遇：底薪8万VUV+销售提成，月休4天。有零售经验者优先。",
    category: "job",
    price: null,
    contact: "+678 5552002",
    location: "维拉港",
    images: [],
    status: 1,
    created_at: new Date("2026-04-06T14:00:00Z")
  },
  {
    title: "九成新丰田Hilux皮卡出售 低公里数 价格可议",
    description: "2023款丰田Hilux 4WD柴油版，行驶仅28000公里，车况极佳。定期在Toyota授权服务中心保养，全套保养记录。白色车身，真皮座椅，倒车雷达。因回国急售，价格可小议。",
    category: "secondhand",
    price: 3200000,
    contact: "+678 5553001",
    location: "维拉港",
    images: [],
    status: 1,
    created_at: new Date("2026-04-06T15:30:00Z")
  },
  {
    title: "全套餐厅设备低价转让 桌椅厨具冰柜等",
    description: "因店铺转型，现低价转让全套中餐厅设备：8套餐桌椅、商用冰柜2台、燃气灶2组、抽油烟机、餐具若干。设备使用不到一年，8成新以上。打包优惠，也可单独购买。自提，维拉港市区内可协助送货。",
    category: "secondhand",
    price: 800000,
    contact: "+678 5553002",
    location: "维拉港",
    images: [],
    status: 1,
    created_at: new Date("2026-04-05T11:00:00Z")
  },
  {
    title: "专业搬家服务 全岛覆盖 价格实惠",
    description: "提供维拉港及周边地区专业搬家服务。自有3吨货车，配备专业搬运工人。服务范围：家庭搬家、办公室搬迁、大件物品运输。维拉港市内搬家起步价1.5万VUV。提前一天预约，准时上门。",
    category: "service",
    price: null,
    contact: "+678 5554001",
    location: "全岛",
    images: [],
    status: 1,
    created_at: new Date("2026-04-05T08:00:00Z")
  },
  {
    title: "中英文翻译服务 文件翻译 陪同口译",
    description: "提供专业中英文/中法文翻译服务。服务包括：商务文件翻译、法律合同翻译、移民资料翻译、陪同口译（政府部门、银行、医院等）。翻译经验8年，熟悉瓦努阿图法律和商业用语。价格合理，质量保证。",
    category: "service",
    price: null,
    contact: "+678 5554002",
    location: "维拉港",
    images: [],
    status: 1,
    created_at: new Date("2026-04-04T09:30:00Z")
  }
];

const BUSINESSES_DATA = [
  {
    name: "金龙中餐厅",
    category: "food",
    address: "Lini Highway, Port Vila",
    phone: "+678 23666",
    description: "维拉港最受欢迎的中餐厅之一，主营粤菜和川菜。招牌菜包括糖醋鱼、宫保鸡丁、烧鸭。提供堂食和外卖服务。营业时间：11:00-14:00, 17:30-22:00。",
    cover_image: "",
    rating: 4.8,
    created_at: new Date("2026-01-15T00:00:00Z")
  },
  {
    name: "福满楼酒家",
    category: "food",
    address: "Rue de Paris, Port Vila",
    phone: "+678 24888",
    description: "经营中式火锅和烧烤，环境优雅，适合家庭聚餐和朋友聚会。特色推荐：海鲜火锅、烤全羊。可提前预订包间。",
    cover_image: "",
    rating: 4.5,
    created_at: new Date("2026-01-20T00:00:00Z")
  },
  {
    name: "万家福华人超市",
    category: "market",
    address: "Nambatu, Port Vila",
    phone: "+678 22888",
    description: "瓦努阿图最大的华人超市，提供各类中国食品、调料、日用品。新增生鲜蔬果区和中式熟食档口。每日新鲜到货，品种齐全。",
    cover_image: "",
    rating: 4.5,
    created_at: new Date("2026-02-01T00:00:00Z")
  },
  {
    name: "百汇百货商店",
    category: "market",
    address: "Kumul Highway, Port Vila",
    phone: "+678 22999",
    description: "综合百货商店，经营电子产品、家居用品、五金工具、服装鞋帽等。价格实惠，品种丰富。支持现金和银行卡支付。",
    cover_image: "",
    rating: 4.2,
    created_at: new Date("2026-02-10T00:00:00Z")
  },
  {
    name: "南太平洋旅行社",
    category: "travel",
    address: "Kumul Highway, Port Vila",
    phone: "+678 25888",
    description: "提供瓦努阿图本地游和国际机票服务。热门线路：Tanna火山一日游、Santo蓝洞潜水、Hideaway岛浮潜。也代办澳大利亚和新西兰签证。中英文服务。",
    cover_image: "",
    rating: 4.2,
    created_at: new Date("2026-02-15T00:00:00Z")
  },
  {
    name: "维拉港法律事务所",
    category: "legal",
    address: "Main Street, Port Vila",
    phone: "+678 22100",
    description: "专业法律服务，擅长移民法、商业法、房产交易。提供瓦努阿图公民身份申请、商业注册、土地租赁合同审查等服务。律所有中文律师，沟通无障碍。",
    cover_image: "",
    rating: 4.6,
    created_at: new Date("2026-02-20T00:00:00Z")
  },
  {
    name: "太平洋移民咨询",
    category: "legal",
    address: "Rue Higginson, Port Vila",
    phone: "+678 28800",
    description: "专注瓦努阿图投资移民和公民身份申请。提供一站式服务：资格评估、材料准备、政府对接、后续安置。成功案例超500例。免费初次咨询。",
    cover_image: "",
    rating: 4.4,
    created_at: new Date("2026-03-01T00:00:00Z")
  },
  {
    name: "瓦努阿图中文学校",
    category: "education",
    address: "华人活动中心, Port Vila",
    phone: "+678 5551234",
    description: "为在瓦华人子女提供中文教育。开设少儿启蒙班、进阶班和成人会话班。使用国内正规教材，配合本地化教学。每周六上午上课。",
    cover_image: "",
    rating: 4.7,
    created_at: new Date("2026-03-05T00:00:00Z")
  },
  {
    name: "南洋中医馆",
    category: "medical",
    address: "Rue Carnot, Port Vila",
    phone: "+678 5559876",
    description: "提供传统中医诊疗服务：中医内科、针灸、推拿、拔罐。李医生来自广州，20年临床经验。提供中文、英文和比斯拉马语服务。周一至周六营业。",
    cover_image: "",
    rating: 4.9,
    created_at: new Date("2026-03-10T00:00:00Z")
  },
  {
    name: "ProMedical维拉诊所",
    category: "medical",
    address: "Lini Highway, Port Vila",
    phone: "+678 22567",
    description: "综合性私人诊所，提供全科诊疗、体检、疫苗接种等服务。拥有现代化医疗设备。接受主要保险。急诊24小时开放。",
    cover_image: "",
    rating: 4.3,
    created_at: new Date("2026-03-15T00:00:00Z")
  },
  {
    name: "Toyota维拉港授权服务中心",
    category: "car",
    address: "Teouma Road, Port Vila",
    phone: "+678 26789",
    description: "Toyota官方授权服务中心，提供新车销售、保养维修、零配件供应。技师均经Toyota培训认证。提供免费车辆检测。营业时间：周一至周五 8:00-17:00，周六 8:00-12:00。",
    cover_image: "",
    rating: 4.4,
    created_at: new Date("2026-03-20T00:00:00Z")
  },
  {
    name: "瓦努阿图置业顾问",
    category: "realestate",
    address: "Rue de Paris, Port Vila",
    phone: "+678 29900",
    description: "专业房产中介服务，涵盖住宅和商业地产的买卖、租赁。熟悉外国人购房流程和政策。提供土地调查、价格评估、合同协助等一站式服务。中英文双语顾问。",
    cover_image: "",
    rating: 4.5,
    created_at: new Date("2026-03-25T00:00:00Z")
  }
];

const initData = async () => {
  const results = { news: 0, classifieds: 0, businesses: 0, users: 0 };

  const collections = ["news", "classifieds", "businesses", "users"];
  for (const name of collections) {
    try {
      await db.createCollection(name);
    } catch (e) {
      // collection already exists, skip
    }
  }

  for (const item of NEWS_DATA) {
    try { await db.collection("news").add({ data: item }); results.news++; } catch (e) {}
  }
  for (const item of CLASSIFIEDS_DATA) {
    try { await db.collection("classifieds").add({ data: item }); results.classifieds++; } catch (e) {}
  }
  for (const item of BUSINESSES_DATA) {
    try { await db.collection("businesses").add({ data: item }); results.businesses++; } catch (e) {}
  }

  return { success: true, message: "数据初始化完成", results };
};

// ==================== 云函数入口 ====================

exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "initData":
      return await initData();
    default:
      return { success: false, message: "未知的操作类型: " + event.type };
  }
};
