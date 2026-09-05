/* 在线简历编辑器 — 零依赖纯静态实现
 * 数据模型兼容 visiky/resume 的 resume.json 结构。
 * 支持两种编辑方式：左侧表单、以及「直接编辑预览」（所见即所得）。 */
(function () {
  "use strict";

  var STORAGE_KEY = "resume-maker-v1"; // 旧版匿名键（仅用于迁移）
  var ACCOUNTS_KEY = "resume_accounts_v1";
  var SESSION_KEY = "resume_session_v1";
  function dataKey(user) { return "resume_data_v1__" + (user || ""); }
  function getAccounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveAccounts(a) {
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); } catch (e) {}
  }
  function currentUser() { return localStorage.getItem(SESSION_KEY) || ""; }
  function setSession(u) {
    try { u ? localStorage.setItem(SESSION_KEY, u) : localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  /* ---------- 默认示例数据 ---------- */
  var DEFAULT_DATA = {
    titleNameMap: {
      educationList: "教育背景",
      workExpList: "工作经历",
      projectList: "项目经验",
      skillList: "个人技能",
      awardList: "更多信息",
      workList: "个人作品",
      aboutme: "个人评价"
    },
    avatar: { src: "", hidden: false },
    profile: {
      name: "你的名字",
      contacts: [
        { label: "手机", value: "138xxxx8888" },
        { label: "邮箱", value: "you@example.com" },
        { label: "GitHub", value: "https://github.com/yourname" },
        { label: "知乎", value: "" },
        { label: "工作年限", value: "3 年" }
      ]
    },
    educationList: [
      {
        edu_time: ["2016.09", "2020.06"],
        school: "某某大学",
        major: "计算机科学与技术",
        academic_degree: "本科"
      }
    ],
    workExpList: [
      {
        company_name: "某某科技有限公司",
        department_name: "研发部",
        work_time: ["2020.07", null],
        work_desc: "1. 负责核心业务系统开发\n2. 参与架构设计与性能优化"
      }
    ],
    projectList: [
      {
        project_name: "示例项目",
        project_role: "后端负责人",
        project_time: "2021.01 - 2022.06",
        project_desc: "项目简介：支撑日均百万级请求的核心服务。",
        project_content: "1. 主导模块设计\n2. 提升系统稳定性与吞吐"
      }
    ],
    skillList: [
      { name: "编程语言", items: ["JavaScript", "TypeScript", "Go", "Python"] },
      { name: "前端框架 / 库", items: ["React", "Vue", "Node.js"] },
      { name: "数据库 / 中间件", items: ["MySQL", "Redis", "Kafka"] }
    ],
    awardList: [{ award_info: "年度优秀员工", award_time: "2022" }],
    workList: [],
    aboutme: { aboutme_desc: "🌱 3 年开发经验，专注 Web 全栈，爱好开源。" },
    theme: { color: "#2f5785", tagColor: "#8bc34a" }
  };

  /* ---------- 编辑器表单配置 ---------- */
  var FORM = [
    { type: "object", key: "avatar", fields: [
      { k: "src", t: "头像图片链接", type: "text" },
      { k: "hidden", t: "隐藏头像", type: "bool" }
    ]},
    { type: "list", key: "educationList", itemT: "教育经历", fields: [
      { k: "edu_time", t: "时间（起 / 止）", type: "range" },
      { k: "school", t: "学校", type: "text" },
      { k: "major", t: "专业", type: "text" },
      { k: "academic_degree", t: "学历", type: "text" }
    ]},
    { type: "list", key: "workExpList", itemT: "工作经历", fields: [
      { k: "company_name", t: "公司", type: "text" },
      { k: "department_name", t: "部门", type: "text" },
      { k: "work_time", t: "时间（起 / 止）", type: "range" },
      { k: "work_desc", t: "描述（每行一条）", type: "textarea" }
    ]},
    { type: "list", key: "projectList", itemT: "项目", fields: [
      { k: "project_name", t: "项目名称", type: "text" },
      { k: "project_role", t: "角色", type: "text" },
      { k: "project_time", t: "时间", type: "text" },
      { k: "project_desc", t: "简介", type: "textarea" },
      { k: "project_content", t: "内容（每行一条）", type: "textarea" }
    ]},
    // skillList 单独处理（每行一个技能 -> 字符串数组）
    { type: "list", key: "awardList", itemT: "奖项 / 其他", fields: [
      { k: "award_info", t: "内容", type: "text" },
      { k: "award_time", t: "时间", type: "text" }
    ]},
    { type: "list", key: "workList", itemT: "作品", fields: [
      { k: "work_name", t: "名称", type: "text" },
      { k: "work_desc", t: "描述", type: "text" },
      { k: "work_link", t: "链接", type: "text" }
    ]},
    { type: "object", key: "aboutme", fields: [
      { k: "aboutme_desc", t: "个人评价（每行一条）", type: "textarea" }
    ]},
    { type: "object", key: "titleNameMap", fields: [
      { k: "educationList", t: "教育背景标题", type: "text" },
      { k: "workExpList", t: "工作经历标题", type: "text" },
      { k: "projectList", t: "项目经验标题", type: "text" },
      { k: "skillList", t: "个人技能标题", type: "text" },
      { k: "awardList", t: "更多信息标题", type: "text" },
      { k: "workList", t: "个人作品标题", type: "text" },
      { k: "aboutme", t: "个人评价标题", type: "text" }
    ]},
    { type: "object", key: "theme", fields: [
      { k: "color", t: "主题色", type: "color" },
      { k: "tagColor", t: "标签色", type: "color" }
    ]}
  ];

  /* ---------- 可增减的大模块 ---------- */
  var MAJOR_SECTIONS = [
    { key: "educationList", label: "教育背景" },
    { key: "workExpList", label: "工作经历" },
    { key: "projectList", label: "项目经验" },
    { key: "skillList", label: "个人技能" },
    { key: "awardList", label: "更多信息" },
    { key: "workList", label: "个人作品" },
    { key: "aboutme", label: "个人评价" }
  ];
  var DEFAULT_SECTIONS = ["educationList", "workExpList", "projectList", "skillList", "awardList", "workList", "aboutme"];
  var DEFAULT_SIDEBAR = ["skillList", "awardList"];
  // 自定义模块（新增模块）内部结构格式：
  // more=更多信息（内容+时间） / edu=教育背景 / project=项目经验 / skills=个人技能（分组标签，单独渲染）
  var CUSTOM_FORMATS = {
    more: [
      { k: "info", t: "内容", type: "text" },
      { k: "time", t: "时间", type: "text" }
    ],
    edu: [
      { k: "edu_time", t: "时间（起 / 止）", type: "range" },
      { k: "school", t: "学校", type: "text" },
      { k: "major", t: "专业", type: "text" },
      { k: "academic_degree", t: "学历", type: "text" }
    ],
    project: [
      { k: "project_name", t: "项目名称", type: "text" },
      { k: "project_role", t: "角色", type: "text" },
      { k: "project_time", t: "时间", type: "text" },
      { k: "project_desc", t: "简介", type: "textarea" },
      { k: "project_content", t: "内容（每行一条）", type: "textarea" }
    ]
  };
  var CUSTOM_FIELDS = CUSTOM_FORMATS.more; // 兼容旧引用

  var UI = {
    zh: {
      profile: "基本信息", avatar: "头像", educationList: "教育背景",
      workExpList: "工作经历", projectList: "项目经验", skillList: "个人技能",
      awardList: "奖项 / 其他", workList: "个人作品", aboutme: "个人评价",
      titleNameMap: "模块标题", theme: "主题", sectionManager: "模块管理"
    },
    en: {
      profile: "Basic Info", avatar: "Avatar", educationList: "Education",
      workExpList: "Work Experience", projectList: "Projects",
      skillList: "Skills", awardList: "Awards / More", workList: "Works",
      aboutme: "About Me", titleNameMap: "Section Titles", theme: "Theme",
      sectionManager: "Sections"
    }
  };

  /* ---------- 状态 ---------- */
  var state = { data: clone(DEFAULT_DATA), template: "tpl-1", lang: "zh", inline: false, sections: clone(DEFAULT_SECTIONS), sidebar: clone(DEFAULT_SIDEBAR) };

  /* ---------- 工具函数 ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // 将技能数据统一为分组结构 [{ name, items:[...] }]，兼容旧版扁平字符串数组
  function normSkills(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(function (g) {
      if (typeof g === "string") return { name: "", items: [g] };
      if (g && Array.isArray(g.items)) return { name: g.name || "", items: g.items.map(function (x) { return x == null ? "" : String(x); }) };
      if (g && Array.isArray(g.skills)) return { name: g.name || "", items: g.skills.map(function (x) { return x == null ? "" : String(x); }) };
      if (g && Array.isArray(g.skill)) return { name: g.name || "", items: g.skill.map(function (x) { return x == null ? "" : String(x); }) };
      return { name: "", items: [] };
    });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ml(s) { return esc(s).replace(/\n/g, "<br>"); }
  function fmtRange(arr) {
    var a = arr || [];
    var s = a[0] || "";
    var e = a[1];
    if (!s) return "";
    return e ? s + " - " + e : s + " - 至今";
  }
  function T(key, fb) {
    return (state.data.titleNameMap && state.data.titleNameMap[key]) || fb;
  }
  function themeVars() {
    var th = state.data.theme || {};
    return "--theme-color:" + (th.color || "#2f5785") +
      ";--tag-color:" + (th.tagColor || "#8bc34a");
  }
  function bind(path) { return ' data-bind="' + path + '"'; }
  function isTimeField(f) { return f === "edu_time" || f === "work_time"; }
  function parseTime(str) {
    str = String(str == null ? "" : str).trim();
    if (!str) return ["", ""];
    var start, end;
    var i = str.indexOf(" - ");
    if (i >= 0) { start = str.slice(0, i).trim(); end = str.slice(i + 3).trim(); }
    else {
      var j = str.indexOf("-");
      if (j >= 0) { start = str.slice(0, j).trim(); end = str.slice(j + 1).trim(); }
      else { start = str; end = ""; }
    }
    if (end === "至今" || end === "present" || end === "Present") end = null;
    return [start, end];
  }

  /* ---------- 数据写入 ---------- */
  function setPath(sec, idx, field, sub, value) {
    var d = state.data;
    if (idx === null) {
      if (!d[sec] || typeof d[sec] !== "object") d[sec] = {};
      d[sec][field] = value;
      return;
    }
    if (!Array.isArray(d[sec])) d[sec] = [];
    if (!d[sec][idx]) d[sec][idx] = {};
    if (sub !== null && sub !== undefined) {
      if (!Array.isArray(d[sec][idx][field])) d[sec][idx][field] = [];
      d[sec][idx][field][sub] = value;
    } else {
      d[sec][idx][field] = value;
    }
  }

  // 行内编辑：按 data-bind 路径写回数据
  function setByPath(path, value) {
    var p = path.split(".");
    // 分组技能路径：<key>.<gi>.items.<si> 或 <key>.<gi>.name
    if (p[2] === "items") {
      var sk = p[0], gj = Number(p[1]), sj = Number(p[3]);
      var arr = state.data[sk];
      if (!Array.isArray(arr)) state.data[sk] = [];
      if (!arr[gj]) arr[gj] = { name: "", items: [] };
      if (!Array.isArray(arr[gj].items)) arr[gj].items = [];
      arr[gj].items[sj] = value;
      return;
    }
    if (p.length === 3 && p[2] === "name") {
      var nk = p[0], nj = Number(p[1]);
      if (!Array.isArray(state.data[nk])) state.data[nk] = [];
      if (!state.data[nk][nj]) state.data[nk][nj] = { name: "", items: [] };
      state.data[nk][nj].name = value;
      return;
    }
    if (p.length === 2) {
      var sec = p[0], field = p[1];
      if (!state.data[sec] || typeof state.data[sec] !== "object") state.data[sec] = {};
      state.data[sec][field] = isTimeField(field) ? parseTime(value) : value;
      return;
    }
    if (p.length === 3) {
      var s3 = p[0], idx = Number(p[1]), f3 = p[2];
      if (!Array.isArray(state.data[s3])) state.data[s3] = [];
      if (!state.data[s3][idx]) state.data[s3][idx] = {};
      state.data[s3][idx][f3] = isTimeField(f3) ? parseTime(value) : value;
      return;
    }
    if (p.length === 4) {
      var o4 = p[0], k4 = p[1], i4 = Number(p[2]), f4 = p[3];
      if (!state.data[o4]) state.data[o4] = {};
      if (!Array.isArray(state.data[o4][k4])) state.data[o4][k4] = [];
      if (!state.data[o4][k4][i4]) state.data[o4][k4][i4] = {};
      state.data[o4][k4][i4][f4] = value;
      return;
    }
  }

  function addItem(sec) {
    var cfg = FORM.find(function (s) { return s.key === sec; });
    var fields = cfg ? cfg.fields : (CUSTOM_FORMATS[customFormat(sec)] || CUSTOM_FIELDS);
    var obj = emptyObjFrom(fields);
    if (!Array.isArray(state.data[sec])) state.data[sec] = [];
    state.data[sec].push(obj);
    buildEditor(); renderPreview(); save();
  }
  function delItem(sec, idx) {
    if (Array.isArray(state.data[sec])) state.data[sec].splice(idx, 1);
    buildEditor(); renderPreview(); save();
  }
  function isMajorSection(key) {
    return MAJOR_SECTIONS.some(function (s) { return s.key === key; });
  }
  function addSection(key) {
    if (state.sections.indexOf(key) >= 0) return;
    state.sections.push(key);
    if (state.data[key] === undefined || state.data[key] === null) {
      state.data[key] = clone(DEFAULT_DATA[key] || (key === "aboutme" ? { aboutme_desc: "" } : []));
    }
    buildEditor(); renderPreview(); save();
  }
  function removeSection(key) {
    var i = state.sections.indexOf(key);
    if (i >= 0) state.sections.splice(i, 1);
    buildEditor(); renderPreview(); save();
  }
  function customSectionsList() {
    var all = state.sections.concat(state.sidebar || []).filter(function (k) {
      return typeof k === "string" && k.indexOf("custom_") === 0;
    });
    return all.filter(function (k, i) { return all.indexOf(k) === i; }).map(function (k) { return { key: k }; });
  }
  function emptyObjFrom(fields) {
    var obj = {};
    (fields || []).forEach(function (f) { obj[f.k] = (f.type === "range") ? ["", ""] : ""; });
    return obj;
  }
  function addCustomSection(name, toSidebar, format) {
    var key = "custom_" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
    state.data.titleNameMap = state.data.titleNameMap || {};
    state.data.titleNameMap[key] = name;
    // format: "more"（更多信息）/ "edu"（教育背景）/ "project"（项目经验）/ "about"（个人评价）/ "skills"（个人技能分组）
    if (format === "skills") {
      state.data[key] = [{ name: "", items: [] }];
    } else if (format === "about") {
      state.data[key] = { aboutme_desc: "" }; // 个人评价为对象结构（非数组）
    } else if (format === "edu" || format === "project") {
      state.data[key] = [emptyObjFrom(CUSTOM_FORMATS[format])];
    } else {
      format = "more";
      state.data[key] = [emptyObjFrom(CUSTOM_FORMATS.more)];
    }
    // 格式持久化：避免条目删空后格式信息丢失
    state.data._formats = state.data._formats || {};
    state.data._formats[key] = format;
    if (toSidebar) { if (state.sidebar.indexOf(key) < 0) state.sidebar.push(key); }
    else { if (state.sections.indexOf(key) < 0) state.sections.push(key); }
    buildEditor(); renderPreview(); save();
  }
  function addSidebarSection(key) {
    if (state.sidebar.indexOf(key) >= 0) return;
    state.sidebar.push(key);
    if (state.data[key] === undefined || state.data[key] === null) {
      state.data[key] = (key === "aboutme") ? { aboutme_desc: "" } : [];
    }
    buildEditor(); renderPreview(); save();
  }
  function removeSidebarSection(key) {
    var i = state.sidebar.indexOf(key);
    if (i >= 0) state.sidebar.splice(i, 1);
    buildEditor(); renderPreview(); save();
  }

  /* ---------- 编辑器渲染 ---------- */
  function fieldHTML(sec, idx, f, val) {
    var idxAttr = (idx === null || idx === undefined) ? "" : String(idx);
    var common = 'data-sec="' + sec + '" data-idx="' + idxAttr + '" data-field="' + f.k + '"';
    if (f.type === "textarea") {
      return '<div class="f"><label class="f-label">' + f.t + '</label>' +
        '<textarea ' + common + ' rows="4">' + esc(val || "") + '</textarea></div>';
    }
    if (f.type === "bool") {
      return '<div class="f row"><label class="f-label">' + f.t + '</label>' +
        '<input type="checkbox" ' + common + (val ? " checked" : "") + "></div>";
    }
    if (f.type === "color") {
      return '<div class="f row"><label class="f-label">' + f.t + '</label>' +
        '<input type="color" ' + common + ' value="' + esc(val || "#2f5785") + '"></div>';
    }
    if (f.type === "range") {
      var a = Array.isArray(val) ? val : ["", ""];
      return '<div class="f"><label class="f-label">' + f.t + '</label>' +
        '<div class="range">' +
        '<input type="text" placeholder="开始" data-sub="0" ' + common + ' value="' + esc(a[0] || "") + '">' +
        '<input type="text" placeholder="结束" data-sub="1" ' + common + ' value="' + esc(a[1] || "") + '">' +
        "</div></div>";
    }
    return '<div class="f"><label class="f-label">' + f.t + '</label>' +
      '<input type="text" ' + common + ' value="' + esc(val || "") + '"></div>';
  }

  // 分组技能编辑器（可复用于「个人技能」主模块与「个人技能格式」自定义模块）
  function buildSkillGroupEditor(secKey, titleText) {
    var groups = normSkills(state.data[secKey]);
    state.data[secKey] = groups; // 就地规范化，确保后续读写结构一致
    var isMain = (secKey === "skillList");
    var titleInput = isMain ? "" :
      '<div class="card-sub-edit"><label class="f-label">模块标题</label>' +
      '<input type="text" data-sec="titleNameMap" data-field="' + secKey + '" value="' + esc(titleText) + '"></div>';
    var groupsHtml = groups.map(function (g, gi) {
      var itemsHtml = (g.items || []).map(function (it, si) {
        return '<div class="item-sub"><input type="text" data-sec="' + secKey +
          '" data-skill-group="' + gi + '" data-skill-item="' + si + '" value="' + esc(it) + '">' +
          '<button class="btn-mini danger" data-act="skill-item-del" data-sec="' + secKey +
          '" data-gi="' + gi + '" data-si="' + si + '">×</button></div>';
      }).join("");
      return '<div class="item"><div class="item-h">分组 #' + (gi + 1) +
        ' <button class="btn-mini danger" data-act="skill-group-del" data-sec="' + secKey + '" data-gi="' + gi + '">删除分组</button></div>' +
        '<div class="f"><label class="f-label">分组名（可留空，留空则只显示技能标签）</label>' +
        '<input type="text" data-sec="' + secKey + '" data-skill-group="' + gi + '" data-skill-name="1" value="' + esc(g.name || "") + '"></div>' +
        '<div class="f"><label class="f-label">技能项（可逐条增删，也可在预览中直接编辑）</label>' +
        '<div class="item-sub-list">' + itemsHtml + '</div>' +
        '<button class="btn-mini" data-act="skill-item-add" data-sec="' + secKey + '" data-gi="' + gi + '">+ 添加技能</button></div></div>';
    }).join("");
    return '<div class="card"><h3 class="card-h">' + esc(titleText) +
      ' <button class="btn-mini" data-act="skill-group-add" data-sec="' + secKey + '">+ 添加分组</button></h3>' +
      (isMain ? '<div class="card-sub-edit">分组与技能项均可增删改；支持在预览中直接编辑。</div>' : "") +
      titleInput + groupsHtml + "</div>";
  }

  // 头像卡片：支持本地上传（自动缩放为小图）、移除、隐藏，也兼容直接粘贴图片 URL
  function buildAvatarEditor() {
    var L = UI[state.lang];
    var a = state.data.avatar || {};
    var name0 = ((state.data.profile && state.data.profile.name) || "?").slice(0, 1);
    var preview = a.src
      ? '<img class="av-prev" id="avPrev" src="' + esc(a.src) + '" alt="">'
      : '<div class="av-prev ph" id="avPrev">' + esc(name0) + "</div>";
    return '<div class="card"><h3 class="card-h">' + L.avatar + "</h3>" +
      '<div class="av-edit"><div class="av-prev-wrap">' + preview + "</div>" +
      '<div class="av-actions">' +
        '<button class="btn-mini" data-act="avup">上传照片</button>' +
        '<button class="btn-mini danger" data-act="avrm"' + (a.src ? "" : " disabled") + ">移除照片</button>" +
        '<label class="f-label">隐藏头像</label>' +
        '<input type="checkbox" data-sec="avatar" data-field="hidden"' + (a.hidden ? " checked" : "") + ">" +
      "</div></div>" +
      '<div class="f"><label class="f-label">头像图片链接（也可直接粘贴 URL）</label>' +
      '<input type="text" data-sec="avatar" data-field="src" value="' + esc(a.src || "") + '"></div>' +
      "</div>";
  }

  // 基本信息卡片：姓名固定，联系方式可增删改
  function buildProfileEditor() {
    var L = UI[state.lang];
    var p = state.data.profile || {};
    var contacts = Array.isArray(p.contacts) ? p.contacts : [];
    var html = '<div class="card card-profile"><h3 class="card-h">' + (L.profile || "基本信息") +
      '<span class="card-sub">可增删改联系方式</span></h3>';
    html += '<div class="f"><label class="f-label">姓名（标题大字号）</label>' +
      '<input type="text" data-sec="profile" data-field="name" value="' + esc(p.name || "") + '"></div>';
    contacts.forEach(function (c, idx) {
      html += '<div class="item"><div class="item-h">联系方式 #' + (idx + 1) +
        ' <button class="btn-mini danger" data-act="contact-del" data-idx="' + idx + '">删除</button></div>';
      html += '<div class="f"><label class="f-label">标签</label>' +
        '<input type="text" data-sec="profile" data-field="contacts" data-sub="label" data-idx="' + idx + '" value="' + esc(c.label || "") + '"></div>';
      html += '<div class="f"><label class="f-label">内容</label>' +
        '<input type="text" data-sec="profile" data-field="contacts" data-sub="value" data-idx="' + idx + '" value="' + esc(c.value || "") + '"></div>';
    });
    html += '<button class="btn-mini" data-act="contact-add">+ 添加联系方式</button>';
    html += '</div>';
    return html;
  }

  // 自定义模块编辑器：按格式（更多信息 / 教育背景 / 项目经验 / 个人评价）渲染对应字段
  function buildCustomEditor(key) {
    var L = UI[state.lang];
    var title = T(key, key);
    var fmt = customFormat(key);
    // 个人评价格式：对象结构，渲染单个多行文本域（无条目增删）
    if (fmt === "about") {
      var a = state.data[key] || {};
      return '<div class="card"><h3 class="card-h">' + esc(title) + "</h3>" +
        '<div class="card-sub-edit"><label class="f-label">模块标题（也可直接编辑预览中的标题）</label>' +
        '<input type="text" data-sec="titleNameMap" data-field="' + key + '" value="' + esc(title) + '"></div>' +
        '<div class="f"><label class="f-label">评价内容（每行一条）</label>' +
        '<textarea data-sec="' + key + '" data-field="aboutme_desc" rows="4">' + esc((a && a.aboutme_desc) || "") + "</textarea></div></div>";
    }
    var fields = CUSTOM_FORMATS[fmt] || CUSTOM_FORMATS.more;
    var arr = Array.isArray(state.data[key]) ? state.data[key] : [];
    var html = '<div class="card"><h3 class="card-h">' + esc(title) +
      ' <button class="btn-mini" data-act="add" data-sec="' + key + '">+ 添加</button></h3>';
    html += '<div class="card-sub-edit"><label class="f-label">模块标题（也可直接编辑预览中的标题）</label>' +
      '<input type="text" data-sec="titleNameMap" data-field="' + key + '" value="' + esc(title) + '"></div>';
    arr.forEach(function (item, idx) {
      html += '<div class="item"><div class="item-h">' + esc(title) + ' #' + (idx + 1) +
        ' <button class="btn-mini danger" data-act="del" data-sec="' + key + '" data-idx="' + idx + '">删除</button></div>';
      fields.forEach(function (f) {
        html += fieldHTML(key, idx, f, item ? item[f.k] : (f.type === "range" ? ["", ""] : ""));
      });
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  // 读取本地图片文件 -> 缩放为小图 -> dataURL（控制体积，便于存入 localStorage）
  function readAvatarFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 360;
        var w = img.width, h = img.height;
        var scale = Math.min(1, max / Math.max(w || 1, h || 1));
        var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
        var url;
        try {
          var canvas = document.createElement("canvas");
          canvas.width = cw; canvas.height = ch;
          canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
          url = canvas.toDataURL("image/jpeg", 0.85);
        } catch (e) { url = reader.result; }
        state.data.avatar = state.data.avatar || {};
        state.data.avatar.src = url;
        state.data.avatar.hidden = false;
        buildEditor(); renderPreview(); save();
      };
      img.onerror = function () { alert("图片读取失败，请换一张试试"); };
      img.src = reader.result;
    };
    reader.onerror = function () { alert("文件读取失败"); };
    reader.readAsDataURL(file);
  }

  function buildSectionManager() {
    var L = UI[state.lang];
    var html = '<div class="card"><h3 class="card-h">' + (L.sectionManager || "模块管理") +
      '<span class="card-sub">增减简历大模块</span></h3><div class="sec-manager">';

    // 主区域模块
    html += '<div class="sec-group-title">主区域模块<span class="card-sub">长按拖动可调整顺序</span></div>';
    html += '<div class="sec-active" data-drag-group="main">';
    state.sections.forEach(function (key) {
      var sec = MAJOR_SECTIONS.find(function (s) { return s.key === key; });
      var label = sec ? sec.label : T(key, key);
      html += '<span class="sec-chip" data-drag-sec="' + key + '" title="长按拖动调整顺序">' + esc(label) +
        '<button class="sec-del" data-act="sec-remove" data-sec-key="' + key + '">×</button></span>';
    });
    html += '</div>';
    var inactive = MAJOR_SECTIONS.filter(function (s) { return state.sections.indexOf(s.key) < 0; });
    html += '<div class="sec-add-row"><select id="secAddSelect">';
    html += '<option value="">— 添加预设模块 —</option>';
    inactive.forEach(function (s) { html += '<option value="' + s.key + '">' + esc(s.label) + '</option>'; });
    html += '</select><button class="btn-mini" data-act="sec-add">+ 添加</button></div>';
    html += '<div class="sec-add-row"><input type="text" id="secCustomName" placeholder="自定义模块名（如：证书/爱好）">' +
      '<select id="secCustomFormat" title="模块内部结构格式"><option value="more">更多信息格式</option><option value="edu">教育背景格式</option><option value="project">项目经验格式</option><option value="about">个人评价格式</option><option value="skills">个人技能格式</option></select>' +
      '<button class="btn-mini" data-act="sec-add-custom">+ 自定义模块</button></div>';

    // 侧边栏模块（仅侧边栏模板生效）
    html += '<div class="sec-group-title">侧边栏模块（侧边栏模板生效）<span class="card-sub">长按拖动可调整顺序</span></div>';
    html += '<div class="sec-active" data-drag-group="side">';
    (state.sidebar || []).forEach(function (key) {
      var sec = MAJOR_SECTIONS.find(function (s) { return s.key === key; });
      var label = sec ? sec.label : T(key, key);
      html += '<span class="sec-chip" data-drag-sec="' + key + '" title="长按拖动调整顺序">' + esc(label) +
        '<button class="sec-del" data-act="side-remove" data-sec-key="' + key + '">×</button></span>';
    });
    html += '</div>';
    var sideOptions = MAJOR_SECTIONS.concat(customSectionsList()).filter(function (s) {
      return state.sidebar.indexOf(s.key) < 0;
    });
    html += '<div class="sec-add-row"><select id="sideAddSelect">';
    html += '<option value="">— 添加侧栏模块 —</option>';
    sideOptions.forEach(function (s) { html += '<option value="' + s.key + '">' + esc(s.label || T(s.key, s.key)) + '</option>'; });
    html += '</select><button class="btn-mini" data-act="side-add">+ 添加</button></div>';
    html += '<div class="sec-add-row"><input type="text" id="sideCustomName" placeholder="自定义侧栏模块名">' +
      '<select id="sideCustomFormat" title="模块内部结构格式"><option value="more">更多信息格式</option><option value="edu">教育背景格式</option><option value="project">项目经验格式</option><option value="about">个人评价格式</option><option value="skills">个人技能格式</option></select>' +
      '<button class="btn-mini" data-act="side-add-custom">+ 自定义模块</button></div>';

    html += '</div></div>';
    return html;
  }

  /* ---------- 模块管理：长按拖动排序（Pointer 事件，鼠标/触屏通用） ---------- */
  var chipDrag = null; // { key, group, srcEl, timer, active, startX, startY }

  function onChipPointerDown(e) {
    if (chipDrag) return;
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("[data-act]")) return; // 删除按钮等不触发拖动
    var chip = t.closest("[data-drag-sec]");
    if (!chip || !chip.closest) return;
    var container = chip.closest("[data-drag-group]");
    if (!container) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    chipDrag = {
      key: chip.dataset ? chip.dataset.dragSec : chip.getAttribute("data-drag-sec"),
      group: container.dataset ? container.dataset.dragGroup : container.getAttribute("data-drag-group"),
      srcEl: chip, timer: null, active: false,
      startX: e.clientX, startY: e.clientY
    };
    chipDrag.timer = setTimeout(function () {
      if (!chipDrag) return;
      chipDrag.active = true;
      if (chipDrag.srcEl.classList) chipDrag.srcEl.classList.add("dragging");
    }, 260);
  }

  function onChipPointerMove(e) {
    if (!chipDrag) return;
    if (!chipDrag.active) {
      // 长按生效前移动过多 → 视为普通点击/滚动，取消
      var dx = e.clientX - chipDrag.startX, dy = e.clientY - chipDrag.startY;
      if (dx * dx + dy * dy > 144) { clearTimeout(chipDrag.timer); chipDrag = null; }
      return;
    }
    if (e.cancelable && e.preventDefault) e.preventDefault();
    var el = document.elementFromPoint ? document.elementFromPoint(e.clientX, e.clientY) : null;
    var chip = el && el.closest ? el.closest("[data-drag-sec]") : null;
    if (!chip || chip === chipDrag.srcEl) return;
    var container = chip.closest("[data-drag-group]");
    if (!container) return;
    var group = container.dataset ? container.dataset.dragGroup : container.getAttribute("data-drag-group");
    if (group !== chipDrag.group) return; // 只允许同组内排序
    var rect = chip.getBoundingClientRect ? chip.getBoundingClientRect() : { left: 0, width: 0 };
    var after = e.clientX > rect.left + rect.width / 2;
    var parent = chip.parentNode;
    if (!parent) return;
    if (after) parent.insertBefore(chipDrag.srcEl, chip.nextSibling);
    else parent.insertBefore(chipDrag.srcEl, chip);
  }

  function onChipPointerUp() {
    if (!chipDrag) return;
    clearTimeout(chipDrag.timer);
    var d = chipDrag;
    chipDrag = null;
    if (d.srcEl && d.srcEl.classList) d.srcEl.classList.remove("dragging");
    if (!d.active || !d.srcEl || !d.srcEl.parentNode) return;
    // 读取拖动后的 DOM 顺序写回状态
    var chips = d.srcEl.parentNode.querySelectorAll("[data-drag-sec]");
    var order = [];
    Array.prototype.forEach.call(chips, function (c) {
      order.push(c.dataset ? c.dataset.dragSec : c.getAttribute("data-drag-sec"));
    });
    var arr = (d.group === "side") ? state.sidebar : state.sections;
    if (!order.length || order.length !== arr.length) { buildEditor(); return; }
    var changed = order.some(function (k, i) { return arr[i] !== k; });
    if (changed) {
      if (d.group === "side") state.sidebar = order;
      else state.sections = order;
      buildEditor(); renderPreview(); save();
    } else {
      buildEditor(); // 未变化也重建，清理样式
    }
  }

  function buildEditor() {
    var L = UI[state.lang];
    var html = buildSectionManager();
    html += buildProfileEditor();
    // 个人技能：分组编辑器（分组与技能项均可增删改），不在 FORM 列表中
    if (state.sections.indexOf("skillList") >= 0) html += buildSkillGroupEditor("skillList", L.skillList);
    FORM.forEach(function (sec) {
      if (isMajorSection(sec.key) && state.sections.indexOf(sec.key) < 0) return;
      if (sec.key === "skillList") return; // 个人技能已在上方单独渲染
      if (sec.key === "avatar") { html += buildAvatarEditor(); return; }
      if (sec.type === "object") {
        html += '<div class="card"><h3 class="card-h">' + (L[sec.key] || sec.key) + "</h3>";
        var obj = state.data[sec] || {};
        sec.fields.forEach(function (f) { html += fieldHTML(sec.key, null, f, obj[f.k]); });
        html += "</div>";
      } else if (sec.type === "list") {
        var arr = Array.isArray(state.data[sec.key]) ? state.data[sec.key] : [];
        html += '<div class="card"><h3 class="card-h">' + (L[sec.key] || sec.key) +
          ' <button class="btn-mini" data-act="add" data-sec="' + sec.key + '">+ 添加</button></h3>';
        arr.forEach(function (item, idx) {
          html += '<div class="item"><div class="item-h">' + sec.itemT + " #" + (idx + 1) +
            ' <button class="btn-mini danger" data-act="del" data-sec="' + sec.key +
            '" data-idx="' + idx + '">删除</button></div>';
          sec.fields.forEach(function (f) { html += fieldHTML(sec.key, idx, f, item ? item[f.k] : ""); });
          html += "</div>";
        });
        html += "</div>";
      }
    });
    // 自定义模块（主区域 + 仅侧栏，去重）
    var customKeys = state.sections.concat(state.sidebar || []).filter(function (k) {
      return typeof k === "string" && k.indexOf("custom_") === 0;
    }).filter(function (k, i, a) { return a.indexOf(k) === i; });
    customKeys.forEach(function (key) {
      if (customFormat(key) === "skills") html += buildSkillGroupEditor(key, T(key, key));
      else html += buildCustomEditor(key);
    });
    document.getElementById("editor").innerHTML = html;
  }

  /* ---------- 编辑器事件 ---------- */
  function onEditorInput(e) {
    var t = e.target;
    // 分组技能：<sec>.<gi>.items.<si>（技能项）或 <sec>.<gi>.name（分组名）
    if (t.dataset.skillGroup !== undefined && t.dataset.skillGroup !== null && t.dataset.skillGroup !== "") {
      var sgk = t.dataset.sec;
      var gi2 = Number(t.dataset.skillGroup);
      if (!Array.isArray(state.data[sgk])) state.data[sgk] = [];
      if (!state.data[sgk][gi2]) state.data[sgk][gi2] = { name: "", items: [] };
      if (t.dataset.skillName) {
        state.data[sgk][gi2].name = t.value;
      } else {
        var si2 = Number(t.dataset.skillItem);
        if (!Array.isArray(state.data[sgk][gi2].items)) state.data[sgk][gi2].items = [];
        state.data[sgk][gi2].items[si2] = t.value;
      }
      afterDataChange();
      return;
    }
    var sec = t.dataset.sec;
    // 基本信息-联系方式：profile.contacts[idx].label|value
    if (sec === "profile" && t.dataset.field === "contacts") {
      var ci = Number(t.dataset.idx);
      var csub = t.dataset.sub; // label | value
      var cval = (t.type === "checkbox") ? t.checked : t.value;
      if (!state.data.profile) state.data.profile = {};
      if (!Array.isArray(state.data.profile.contacts)) state.data.profile.contacts = [];
      if (!state.data.profile.contacts[ci]) state.data.profile.contacts[ci] = {};
      state.data.profile.contacts[ci][csub] = cval;
      afterDataChange();
      return;
    }
    if (!sec) return;
    var idx = (t.dataset.idx === "" || t.dataset.idx === undefined || t.dataset.idx === null)
      ? null : Number(t.dataset.idx);
    var field = t.dataset.field;
    var sub = (t.dataset.sub !== undefined && t.dataset.sub !== null && t.dataset.sub !== "")
      ? Number(t.dataset.sub) : null;
    var val = (t.type === "checkbox") ? t.checked : t.value;
    setPath(sec, idx, field, sub, val);
    afterDataChange();
  }

  function onEditorClick(e) {
    var b = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!b) return;
    if (b.dataset.act === "add") addItem(b.dataset.sec);
    else if (b.dataset.act === "del") delItem(b.dataset.sec, Number(b.dataset.idx));
    else if (b.dataset.act === "skill-item-add") {
      var sik = b.dataset.sec, sg = Number(b.dataset.gi);
      if (!Array.isArray(state.data[sik])) state.data[sik] = [];
      if (!state.data[sik][sg]) state.data[sik][sg] = { name: "", items: [] };
      if (!Array.isArray(state.data[sik][sg].items)) state.data[sik][sg].items = [];
      state.data[sik][sg].items.push("");
      buildEditor(); renderPreview(); save();
    }
    else if (b.dataset.act === "skill-item-del") {
      var dik = b.dataset.sec, dg = Number(b.dataset.gi), dsi = Number(b.dataset.si);
      if (Array.isArray(state.data[dik]) && state.data[dik][dg] && Array.isArray(state.data[dik][dg].items)) {
        state.data[dik][dg].items.splice(dsi, 1);
      }
      buildEditor(); renderPreview(); save();
    }
    else if (b.dataset.act === "skill-group-add") {
      var gak = b.dataset.sec;
      if (!Array.isArray(state.data[gak])) state.data[gak] = [];
      state.data[gak].push({ name: "", items: [] });
      buildEditor(); renderPreview(); save();
    }
    else if (b.dataset.act === "skill-group-del") {
      var gdk = b.dataset.sec, gd = Number(b.dataset.gi);
      if (Array.isArray(state.data[gdk]) && state.data[gdk][gd]) state.data[gdk].splice(gd, 1);
      buildEditor(); renderPreview(); save();
    }
    else if (b.dataset.act === "sec-add") {
      var sel = document.getElementById("secAddSelect");
      if (sel && sel.value) addSection(sel.value);
    }
    else if (b.dataset.act === "sec-remove") removeSection(b.dataset.secKey);
    else if (b.dataset.act === "sec-add-custom") {
      var nm = (document.getElementById("secCustomName").value || "").trim();
      if (!nm) { alert("请输入自定义模块名称"); return; }
      var fmt = (document.getElementById("secCustomFormat") || {}).value || "more";
      addCustomSection(nm, false, fmt);
    }
    else if (b.dataset.act === "side-add") {
      var ssel = document.getElementById("sideAddSelect");
      if (ssel && ssel.value) addSidebarSection(ssel.value);
    }
    else if (b.dataset.act === "side-remove") removeSidebarSection(b.dataset.secKey);
    else if (b.dataset.act === "side-add-custom") {
      var snm = (document.getElementById("sideCustomName").value || "").trim();
      if (!snm) { alert("请输入自定义侧栏模块名称"); return; }
      var sfmt = (document.getElementById("sideCustomFormat") || {}).value || "more";
      addCustomSection(snm, true, sfmt);
    }
    else if (b.dataset.act === "contact-add") {
      if (!state.data.profile) state.data.profile = {};
      if (!Array.isArray(state.data.profile.contacts)) state.data.profile.contacts = [];
      state.data.profile.contacts.push({ label: "", value: "" });
      buildEditor(); renderPreview(); save();
    }
    else if (b.dataset.act === "contact-del") {
      var di = Number(b.dataset.idx);
      if (Array.isArray(state.data.profile.contacts) && state.data.profile.contacts[di]) {
        state.data.profile.contacts.splice(di, 1);
      }
      buildEditor(); renderPreview(); save();
    }
    else if (b.dataset.act === "avup") { var af = document.getElementById("avatarFile"); if (af) af.click(); }
    else if (b.dataset.act === "avrm") {
      state.data.avatar = state.data.avatar || {};
      state.data.avatar.src = ""; state.data.avatar.hidden = true;
      buildEditor(); renderPreview(); save();
    }
  }

  function afterDataChange() {
    renderPreview();
    save();
  }

  /* ---------- 预览渲染 ---------- */
  function contactsItems() {
    var p = state.data.profile || {};
    var list = Array.isArray(p.contacts) ? p.contacts : [];
    return list.map(function (c, i) { return { item: c, i: i }; })
      .filter(function (o) { return o.item && o.item.value; });
  }
  function contactsHTML(mode) {
    var items = contactsItems();
    if (mode === "chip") {
      return items.map(function (o) {
        return '<span class="chip"' + bind("profile.contacts." + o.i + ".value") + ">" + esc(o.item.value) + "</span>";
      }).join("");
    }
    return items.map(function (o) {
      return '<div class="side-contact"><span class="sc-k"' + bind("profile.contacts." + o.i + ".label") + ">" + esc(o.item.label) + "</span>" +
        '<span class="sc-v"' + bind("profile.contacts." + o.i + ".value") + ">" + esc(o.item.value) + "</span></div>";
    }).join("");
  }

  function avatarHTML(cls) {
    var a = state.data.avatar || {};
    if (a.hidden) return "";
    var c = cls ? " " + cls : "";
    if (a.src) return '<img class="r-avatar' + c + '" src="' + esc(a.src) + '" alt="">';
    var name = (state.data.profile && state.data.profile.name) || "?";
    return '<div class="r-avatar r-avatar-ph' + c + '">' + esc(name.slice(0, 1)) + "</div>";
  }

  function headerHTML() {
    var p = state.data.profile || {};
    return avatarHTML() +
      '<div class="r-head-info"><div class="r-name"' + bind("profile.name") + ">" + esc(p.name || "") +
      '</div><div class="r-contact">' + contactsHTML("chip") + "</div></div>";
  }

  function block(key, fb, inner) {
    if (!inner) return "";
    return '<section class="r-section"><h2 class="r-sec-title"' + bind("titleNameMap." + key) +
      ">" + esc(T(key, fb)) + "</h2>" + inner + "</section>";
  }

  function eduInner() {
    var list = state.data.educationList || [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (e, i) {
      var time = fmtRange(e.edu_time);
      var parts = [];
      if (e.major) parts.push('<span' + bind("educationList." + i + ".major") + ">" + esc(e.major) + "</span>");
      if (e.academic_degree) parts.push('<span' + bind("educationList." + i + ".academic_degree") + ">" + esc(e.academic_degree) + "</span>");
      return "<li>" +
        '<div class="r-row"><span class="r-strong"' + bind("educationList." + i + ".school") + ">" + esc(e.school || "") + "</span>" +
        (time ? '<span class="r-time"' + bind("educationList." + i + ".edu_time") + ">" + esc(time) + "</span>" : "") + "</div>" +
        (parts.length ? '<div class="r-sub">' + parts.join(" · ") + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  function workInner() {
    var list = state.data.workExpList || [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (w, i) {
      var time = fmtRange(w.work_time);
      var dep = w.department_name ? ' <span class="r-dim">· ' + esc(w.department_name) + "</span>" : "";
      return "<li>" +
        '<div class="r-row"><span class="r-strong"' + bind("workExpList." + i + ".company_name") + ">" + esc(w.company_name || "") + dep + "</span>" +
        (time ? '<span class="r-time"' + bind("workExpList." + i + ".work_time") + ">" + esc(time) + "</span>" : "") + "</div>" +
        (w.work_desc ? '<div class="r-desc"' + bind("workExpList." + i + ".work_desc") + ">" + ml(w.work_desc) + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  function projectInner() {
    var list = state.data.projectList || [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (p, i) {
      return "<li>" +
        '<div class="r-row"><span class="r-strong"' + bind("projectList." + i + ".project_name") + ">" + esc(p.project_name || "") + "</span>" +
        (p.project_time ? '<span class="r-time"' + bind("projectList." + i + ".project_time") + ">" + esc(p.project_time) + "</span>" : "") + "</div>" +
        (p.project_role ? '<div class="r-sub"' + bind("projectList." + i + ".project_role") + ">" + esc(p.project_role) + "</div>" : "") +
        (p.project_desc ? '<div class="r-desc"' + bind("projectList." + i + ".project_desc") + ">" + ml(p.project_desc) + "</div>" : "") +
        (p.project_content ? '<div class="r-desc"' + bind("projectList." + i + ".project_content") + ">" + ml(p.project_content) + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  // 渲染分组技能：<key> 为数据键（skillList 或自定义技能模块键），用于行内编辑绑定路径
  // 布局：所有分组放入同一个流式容器，标签一行放满再换行；分组名作为行内小标签穿插其中
  function skillGroupInner(key, list) {
    var groups = normSkills(list);
    if (!groups.length) return "";
    var parts = [];
    groups.forEach(function (g, gi) {
      if (g.name) {
        parts.push('<span class="skill-g-label" ' + bind(key + "." + gi + ".name") + ">" + esc(g.name) + "</span>");
      }
      (g.items || []).forEach(function (s, si) {
        if (s == null || !String(s).trim()) return;
        parts.push('<span class="tag"' + bind(key + "." + gi + ".items." + si) + ">" + esc(s) + "</span>");
      });
    });
    if (!parts.length) return "";
    return '<div class="tags">' + parts.join("") + "</div>";
  }
  function skillInner() {
    var html = skillGroupInner("skillList", state.data.skillList || []);
    if (!html) return "";
    return html;
  }

  function awardInner() {
    var list = state.data.awardList || [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (a, i) {
      return "<li>" +
        '<div class="r-row"><span' + bind("awardList." + i + ".award_info") + ">" + esc(a.award_info || "") + "</span>" +
        (a.award_time ? '<span class="r-time"' + bind("awardList." + i + ".award_time") + ">" + esc(a.award_time) + "</span>" : "") + "</div></li>";
    }).join("") + "</ul>";
  }

  // 判断自定义模块的内部结构格式：优先读 _formats 持久化记录，回退到首条数据形状推断（兼容旧数据）
  function customFormat(key) {
    var known = ["more", "edu", "project", "about", "skills"];
    var f = state.data._formats && state.data._formats[key];
    if (known.indexOf(f) >= 0) return f;
    var v = state.data[key];
    // 个人评价为对象结构（非数组）
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return (v.aboutme_desc !== undefined) ? "about" : "more";
    }
    var arr = Array.isArray(v) ? v : [];
    if (!arr.length) return "more";
    var it = arr[0];
    if (it && (it.school !== undefined || it.edu_time !== undefined || it.academic_degree !== undefined)) return "edu";
    if (it && (it.project_name !== undefined || it.project_role !== undefined || it.project_desc !== undefined || it.project_content !== undefined)) return "project";
    if (it && (it.info !== undefined || it.time !== undefined || it.award_info !== undefined)) return "more";
    return "skills";
  }
  // 旧数据回填格式记录（load / importJSON 后调用）
  function syncCustomFormats() {
    Object.keys(state.data).forEach(function (k) {
      if (k.indexOf("custom_") !== 0) return;
      state.data._formats = state.data._formats || {};
      if (!state.data._formats[k]) state.data._formats[k] = customFormat(k);
    });
  }

  // 自定义模块（与「更多信息」同结构：[{ info, time }]）
  function customInner(key) {
    var list = Array.isArray(state.data[key]) ? state.data[key] : [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (a, i) {
      return "<li>" +
        '<div class="r-row"><span' + bind(key + "." + i + ".info") + ">" + esc(a.info || "") + "</span>" +
        (a.time ? '<span class="r-time"' + bind(key + "." + i + ".time") + ">" + esc(a.time) + "</span>" : "") + "</div></li>";
    }).join("") + "</ul>";
  }

  // 自定义模块「教育背景格式」渲染（与 educationList 同版式，键参数化）
  function customEduInner(key) {
    var list = Array.isArray(state.data[key]) ? state.data[key] : [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (e, i) {
      var time = fmtRange(e.edu_time);
      var parts = [];
      if (e.major) parts.push('<span' + bind(key + "." + i + ".major") + ">" + esc(e.major) + "</span>");
      if (e.academic_degree) parts.push('<span' + bind(key + "." + i + ".academic_degree") + ">" + esc(e.academic_degree) + "</span>");
      return "<li>" +
        '<div class="r-row"><span class="r-strong"' + bind(key + "." + i + ".school") + ">" + esc(e.school || "") + "</span>" +
        (time ? '<span class="r-time"' + bind(key + "." + i + ".edu_time") + ">" + esc(time) + "</span>" : "") + "</div>" +
        (parts.length ? '<div class="r-sub">' + parts.join(" · ") + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  // 自定义模块「项目经验格式」渲染（与 projectList 同版式，键参数化）
  function customProjectInner(key) {
    var list = Array.isArray(state.data[key]) ? state.data[key] : [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (p, i) {
      return "<li>" +
        '<div class="r-row"><span class="r-strong"' + bind(key + "." + i + ".project_name") + ">" + esc(p.project_name || "") + "</span>" +
        (p.project_time ? '<span class="r-time"' + bind(key + "." + i + ".project_time") + ">" + esc(p.project_time) + "</span>" : "") + "</div>" +
        (p.project_role ? '<div class="r-sub"' + bind(key + "." + i + ".project_role") + ">" + esc(p.project_role) + "</div>" : "") +
        (p.project_desc ? '<div class="r-desc"' + bind(key + "." + i + ".project_desc") + ">" + ml(p.project_desc) + "</div>" : "") +
        (p.project_content ? '<div class="r-desc"' + bind(key + "." + i + ".project_content") + ">" + ml(p.project_content) + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  // 自定义模块「个人评价格式」渲染（与 aboutme 同版式，键参数化；对象结构 { aboutme_desc }）
  function customAboutInner(key) {
    var a = state.data[key] || {};
    var txt = a.aboutme_desc || "";
    if (!String(txt).trim()) return "";
    return '<div class="r-about"' + bind(key + ".aboutme_desc") + ">" + ml(txt) + "</div>";
  }

  // 自定义模块预览统一入口：按格式分派
  function customInnerFor(key) {
    var f = customFormat(key);
    if (f === "skills") return skillGroupInner(key, state.data[key] || []);
    if (f === "edu") return customEduInner(key);
    if (f === "project") return customProjectInner(key);
    if (f === "about") return customAboutInner(key);
    return customInner(key);
  }

  function workListInner() {
    var list = state.data.workList || [];
    if (!list.length) return "";
    return '<ul class="r-list">' + list.map(function (w, i) {
      var link = w.work_link ? ' <a class="r-link" href="' + esc(w.work_link) +
        '" target="_blank"' + bind("workList." + i + ".work_link") + ">" + esc(w.work_link) + "</a>" : "";
      return "<li>" +
        '<div class="r-row"><span class="r-strong"' + bind("workList." + i + ".work_name") + ">" + esc(w.work_name || "") + "</span>" + link + "</div>" +
        (w.work_desc ? '<div class="r-desc"' + bind("workList." + i + ".work_desc") + ">" + esc(w.work_desc) + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  function aboutInner() {
    var a = state.data.aboutme || {};
    return a.aboutme_desc ? '<div class="r-about"' + bind("aboutme.aboutme_desc") + ">" + ml(a.aboutme_desc) + "</div>" : "";
  }

  function renderPreview() {
    var d = state.data;
    function titleFor(key) {
      var preset = MAJOR_SECTIONS.find(function (s) { return s.key === key; });
      return preset ? preset.label : T(key, key);
    }
    function innerFor(key) {
      switch (key) {
        case "educationList": return eduInner();
        case "workExpList": return workInner();
        case "projectList": return projectInner();
        case "skillList": return skillInner();
        case "awardList": return awardInner();
        case "workList": return workListInner();
        case "aboutme": return aboutInner();
        default: return customInnerFor(key);
      }
    }
    function blockFor(key) {
      return block(key, titleFor(key), innerFor(key));
    }
    var html = "";
    if (state.template === "tpl-3") {
      var sideBlocks = (state.sidebar || []).map(blockFor).join("");
      var mainKeys = (state.sections || []).filter(function (k) {
        return (state.sidebar || []).indexOf(k) < 0;
      });
      var mainBlocks = mainKeys.map(blockFor).join("");
      html = '<div class="resume tpl-3" style="' + themeVars() + '">' +
        '<aside class="r-side">' + avatarHTML("side") +
        '<div class="side-name"' + bind("profile.name") + ">" + esc((d.profile || {}).name || "") + "</div>" +
        '<div class="side-contacts">' + contactsHTML("list") + "</div>" +
        sideBlocks + "</aside>" +
        '<div class="r-main">' + mainBlocks + "</div></div>";
    } else {
      var blocks = (state.sections || []).map(blockFor).join("");
      html = '<div class="resume ' + state.template + '" style="' + themeVars() + '">' +
        '<div class="r-header">' + headerHTML() + "</div>" + blocks + "</div>";
    }
    document.getElementById("preview").innerHTML = html;
    applyInline();
  }

  // 行内编辑：开启时把带 data-bind 的元素设为可编辑
  function applyInline() {
    var prev = document.getElementById("preview");
    if (!prev) return;
    if (state.inline) {
      prev.classList.add("inline-on");
      var nodes = prev.querySelectorAll("[data-bind]");
      for (var n = 0; n < nodes.length; n++) nodes[n].setAttribute("contenteditable", "true");
    } else {
      prev.classList.remove("inline-on");
      var ed = prev.querySelectorAll('[contenteditable="true"]');
      for (var k = 0; k < ed.length; k++) ed[k].removeAttribute("contenteditable");
    }
  }

  function onPreviewInput(e) {
    if (!state.inline) return;
    var el = e.target;
    var path = el && el.getAttribute ? el.getAttribute("data-bind") : null;
    if (!path) return;
    var val = (el.innerText != null) ? el.innerText : el.textContent;
    setByPath(path, val);
    save();
  }

  /* ---------- 持久化（按账号命名空间隔离） ---------- */
  function save() {
    var u = currentUser();
    if (!u) return; // 未登录不写入，避免覆盖他人数据
    try {
      localStorage.setItem(dataKey(u), JSON.stringify({
        data: state.data, template: state.template, lang: state.lang, inline: state.inline,
        sections: state.sections, sidebar: state.sidebar
      }));
      flashSaved();
    } catch (e) { /* 忽略存储异常 */ }
  }
  function flashSaved() {
    var h = document.getElementById("saveHint");
    if (!h) return;
    h.textContent = "已自动保存 " + new Date().toLocaleTimeString();
  }
  function load() {
    var u = currentUser();
    if (!u) return;
    var raw = localStorage.getItem(dataKey(u));
    if (!raw) { migrateOld(u); raw = localStorage.getItem(dataKey(u)); }
    if (!raw) return;
    try {
      var parsed = JSON.parse(raw);
      if (parsed.data) {
        var d = clone(DEFAULT_DATA);
        Object.keys(parsed.data).forEach(function (k) { d[k] = parsed.data[k]; });
        state.data = d;
        // 旧数据可能没有 contacts 数组，从扁平字段迁移
        if (state.data.profile && !Array.isArray(state.data.profile.contacts)) {
          var p = state.data.profile;
          state.data.profile.contacts = [
            p.mobile ? { label: "手机", value: p.mobile } : null,
            p.email ? { label: "邮箱", value: p.email } : null,
            p.github ? { label: "GitHub", value: p.github } : null,
            p.zhihu ? { label: "知乎", value: p.zhihu } : null,
            p.workExpYear ? { label: "工作年限", value: p.workExpYear } : null
          ].filter(Boolean);
        }
        // 旧版扁平字符串技能数组迁移为分组结构
        state.data.skillList = normSkills(state.data.skillList);
        // 为旧数据回填自定义模块格式记录
        syncCustomFormats();
      }
      if (parsed.template) state.template = parsed.template;
      if (parsed.lang) state.lang = parsed.lang;
      if (typeof parsed.inline === "boolean") state.inline = parsed.inline;
      if (Array.isArray(parsed.sections) && parsed.sections.length) state.sections = parsed.sections;
      else state.sections = clone(DEFAULT_SECTIONS);
      if (Array.isArray(parsed.sidebar) && parsed.sidebar.length) state.sidebar = parsed.sidebar;
      else state.sidebar = clone(DEFAULT_SIDEBAR);
    } catch (e) { /* 忽略损坏数据 */ }
  }
  // 首个账号注册时，把旧的匿名数据迁移进该账号，避免丢失
  function migrateOld(u) {
    var old = null;
    try { old = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (old) {
      try {
        var parsed = JSON.parse(old);
        parsed.sections = parsed.sections || clone(DEFAULT_SECTIONS);
        parsed.sidebar = parsed.sidebar || clone(DEFAULT_SIDEBAR);
        localStorage.setItem(dataKey(u), JSON.stringify(parsed));
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  }

  /* ---------- 工具栏动作 ---------- */
  function exportJSON() {
    var out = {};
    Object.keys(state.data).forEach(function (k) {
      if (k !== "_formats") out[k] = state.data[k]; // 内部格式记录不导出
    });
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "resume.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function importJSON(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        var d = clone(DEFAULT_DATA);
        Object.keys(obj).forEach(function (k) { d[k] = obj[k]; });
        d.skillList = normSkills(d.skillList);
        state.data = d;
        syncCustomFormats();
        state.sections = clone(DEFAULT_SECTIONS);
        state.sidebar = clone(DEFAULT_SIDEBAR);
        state.template = "tpl-1";
        state.inline = false;
        buildEditor(); renderPreview(); save(); syncToolbar();
      } catch (err) {
        alert("JSON 解析失败：" + err.message);
      }
    };
    reader.readAsText(file);
  }
  function resetAll() {
    if (!confirm("确定要重置为示例数据吗？当前内容将被覆盖。")) return;
    state.data = clone(DEFAULT_DATA);
    state.sections = clone(DEFAULT_SECTIONS);
    state.sidebar = clone(DEFAULT_SIDEBAR);
    buildEditor(); renderPreview(); save(); syncToolbar();
  }
  function syncToolbar() {
    document.getElementById("tplSelect").value = state.template;
    document.getElementById("langSelect").value = state.lang;
    var ib = document.getElementById("inlineBtn");
    if (ib) {
      ib.textContent = state.inline ? "完成编辑" : "直接编辑预览";
      ib.classList.toggle("active", state.inline);
    }
  }

  /* ---------- 账号 / 登录系统（纯前端，数据按账号隔离） ---------- */
  function sha256(str) {
    try {
      if (globalThis.crypto && globalThis.crypto.subtle && globalThis.crypto.subtle.digest) {
        return globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
          .then(function (buf) {
            return Array.prototype.map.call(new Uint8Array(buf), function (b) {
              return ("0" + b.toString(16)).slice(-2);
            }).join("");
          });
      }
    } catch (e) {}
    // 非安全上下文兜底（仅本地调试用，非加密强度）
    var h = 0; for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return Promise.resolve("fb_" + h.toString(16));
  }
  function randomSalt() {
    try {
      var a = new Uint8Array(8); globalThis.crypto.getRandomValues(a);
      return Array.prototype.map.call(a, function (b) { return b.toString(16); }).join("");
    } catch (e) { return String(Math.random()).slice(2); }
  }
  function showLogin() {
    var ov = document.getElementById("loginOverlay");
    if (ov) ov.classList.remove("hidden");
    var app = document.getElementById("appRoot");
    if (app) app.classList.add("locked");
    var ua = document.getElementById("userArea");
    if (ua) ua.classList.add("hidden");
  }
  function hideLogin() {
    var ov = document.getElementById("loginOverlay");
    if (ov) ov.classList.add("hidden");
    var app = document.getElementById("appRoot");
    if (app) app.classList.remove("locked");
    var ua = document.getElementById("userArea");
    if (ua) {
      ua.classList.remove("hidden");
      var lbl = document.getElementById("userLabel");
      if (lbl) lbl.textContent = currentUser();
    }
  }
  function enterApp(user) {
    setSession(user);
    load();
    buildEditor(); renderPreview(); syncToolbar();
    hideLogin();
  }
  function logout() {
    setSession("");
    var ed = document.getElementById("editor"); if (ed) ed.innerHTML = "";
    var pv = document.getElementById("preview"); if (pv) pv.innerHTML = "";
    showLogin();
  }
  function setLoginError(msg) {
    var e = document.getElementById("loginError");
    if (e) e.textContent = msg || "";
  }
  function setMode(register) {
    var ov = document.getElementById("loginOverlay");
    if (ov) ov.classList.toggle("mode-register", !!register);
    var title = document.getElementById("loginTitle");
    var submit = document.getElementById("loginSubmit");
    var toggle = document.getElementById("loginRegister");
    if (title) title.textContent = register ? "注册新账号" : "登录简历编辑器";
    if (submit) submit.textContent = register ? "注册并进入" : "登录";
    if (toggle) toggle.textContent = register ? "已有账号？去登录" : "注册新账号";
    setLoginError("");
  }
  async function doRegister() {
    var user = (document.getElementById("loginUser").value || "").trim();
    var pw = document.getElementById("loginPw").value || "";
    if (!user) { setLoginError("请输入用户名"); return; }
    if (/\s/.test(user)) { setLoginError("用户名不能包含空格"); return; }
    if (pw.length < 4) { setLoginError("密码至少 4 位"); return; }
    var acc = getAccounts();
    if (acc[user]) { setLoginError("该用户名已存在，请直接登录"); return; }
    var firstAccount = Object.keys(acc).length === 0;
    var salt = randomSalt();
    var hash = await sha256(pw + salt);
    acc[user] = { salt: salt, pw: hash };
    saveAccounts(acc);
    if (firstAccount) migrateOld(user);
    enterApp(user);
  }
  async function doLogin() {
    var user = (document.getElementById("loginUser").value || "").trim();
    var pw = document.getElementById("loginPw").value || "";
    var acc = getAccounts();
    if (!acc[user]) { setLoginError("用户名不存在，请先注册"); return; }
    var hash = await sha256(pw + acc[user].salt);
    if (hash !== acc[user].pw) { setLoginError("密码错误"); return; }
    enterApp(user);
  }

  /* ---------- 赞助系统（非强制弹窗） ---------- */
  var SPONSOR = {
    enabled: true,
    // 支付宝收款码图片
    qr: "assets/img/alipay-qr.jpg",
    title: "如果这个工具帮到了你 💛",
    text: "制作简历免费、无广告。如果愿意，可以请作者喝杯咖啡～ 赞助完全自愿，不影响任何功能。"
  };
  function openSponsor() {
    if (!SPONSOR.enabled) return;
    var m = document.getElementById("sponsorModal");
    var img = document.getElementById("sponsorImg");
    var t = document.getElementById("sponsorTitle");
    if (t) t.textContent = SPONSOR.title;
    if (img) img.src = SPONSOR.qr;
    if (m) m.classList.remove("hidden");
  }
  function closeSponsor() {
    var m = document.getElementById("sponsorModal");
    if (m) m.classList.add("hidden");
  }

  /* ---------- 初始化 ---------- */
  function init() {
    var editor = document.getElementById("editor");
    editor.addEventListener("input", onEditorInput);
    editor.addEventListener("change", onEditorInput);
    editor.addEventListener("click", onEditorClick);
    editor.addEventListener("pointerdown", onChipPointerDown);
    document.addEventListener("pointermove", onChipPointerMove);
    document.addEventListener("pointerup", onChipPointerUp);
    document.addEventListener("pointercancel", onChipPointerUp);

    var preview = document.getElementById("preview");
    preview.addEventListener("input", onPreviewInput);
    preview.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains("r-avatar")) {
        var af = document.getElementById("avatarFile");
        if (af) af.click();
      }
    });

    var avatarFile = document.getElementById("avatarFile");
    if (avatarFile) avatarFile.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) readAvatarFile(e.target.files[0]);
      e.target.value = "";
    });

    document.getElementById("tplSelect").addEventListener("change", function (e) {
      state.template = e.target.value; renderPreview(); save();
    });
    document.getElementById("langSelect").addEventListener("change", function (e) {
      state.lang = e.target.value; buildEditor(); renderPreview(); save();
    });
    document.getElementById("inlineBtn").addEventListener("click", function () {
      state.inline = !state.inline;
      applyInline();
      this.textContent = state.inline ? "完成编辑" : "直接编辑预览";
      this.classList.toggle("active", state.inline);
      save();
    });
    document.getElementById("exportBtn").addEventListener("click", exportJSON);
    document.getElementById("printBtn").addEventListener("click", function () {
      window.print();
      if (SPONSOR.enabled && !sessionStorage.getItem("sponsorShown")) {
        sessionStorage.setItem("sponsorShown", "1");
        openSponsor();
      }
    });
    document.getElementById("resetBtn").addEventListener("click", resetAll);
    document.getElementById("importBtn").addEventListener("click", function () {
      document.getElementById("importFile").click();
    });
    document.getElementById("importFile").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
      e.target.value = "";
    });

    // 登录系统事件
    var submit = document.getElementById("loginSubmit");
    if (submit) submit.addEventListener("click", function () {
      var reg = document.getElementById("loginOverlay").classList.contains("mode-register");
      if (reg) doRegister(); else doLogin();
    });
    var reg = document.getElementById("loginRegister");
    if (reg) reg.addEventListener("click", function () {
      var isReg = document.getElementById("loginOverlay").classList.contains("mode-register");
      setMode(!isReg);
    });
    var lo = document.getElementById("logoutBtn");
    if (lo) lo.addEventListener("click", logout);
    var sb = document.getElementById("sponsorBtn");
    if (sb) sb.addEventListener("click", openSponsor);
    var sc = document.getElementById("sponsorClose");
    if (sc) sc.addEventListener("click", closeSponsor);
    var sc2 = document.getElementById("sponsorClose2");
    if (sc2) sc2.addEventListener("click", closeSponsor);
    var sd = document.getElementById("sponsorDone");
    if (sd) sd.addEventListener("click", closeSponsor);

    // 进入判断：已登录且账号存在则直接进入，否则显示登录遮罩
    var u = currentUser();
    if (u && getAccounts()[u]) { enterApp(u); }
    else { showLogin(); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
