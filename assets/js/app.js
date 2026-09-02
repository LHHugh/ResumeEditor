/* 在线简历编辑器 — 零依赖纯静态实现
 * 数据模型兼容 visiky/resume 的 resume.json 结构。
 * 支持两种编辑方式：左侧表单、以及「直接编辑预览」（所见即所得）。 */
(function () {
  "use strict";

  var STORAGE_KEY = "resume-maker-v1";

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
      email: "you@example.com",
      mobile: "138xxxx8888",
      github: "https://github.com/yourname",
      zhihu: "",
      workExpYear: "3 年"
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
    skillList: ["JavaScript", "React", "Node.js", "Python", "MySQL"],
    awardList: [{ award_info: "年度优秀员工", award_time: "2022" }],
    workList: [],
    aboutme: { aboutme_desc: "🌱 3 年开发经验，专注 Web 全栈，爱好开源。" },
    theme: { color: "#2f5785", tagColor: "#8bc34a" }
  };

  /* ---------- 编辑器表单配置 ---------- */
  var FORM = [
    { type: "object", key: "profile", fields: [
      { k: "name", t: "姓名", type: "text" },
      { k: "email", t: "邮箱", type: "text" },
      { k: "mobile", t: "手机", type: "text" },
      { k: "github", t: "GitHub", type: "text" },
      { k: "zhihu", t: "知乎", type: "text" },
      { k: "workExpYear", t: "工作年限", type: "text" }
    ]},
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

  var UI = {
    zh: {
      profile: "基本信息", avatar: "头像", educationList: "教育背景",
      workExpList: "工作经历", projectList: "项目经验", skillList: "个人技能",
      awardList: "奖项 / 其他", workList: "个人作品", aboutme: "个人评价",
      titleNameMap: "模块标题", theme: "主题"
    },
    en: {
      profile: "Basic Info", avatar: "Avatar", educationList: "Education",
      workExpList: "Work Experience", projectList: "Projects",
      skillList: "Skills", awardList: "Awards / More", workList: "Works",
      aboutme: "About Me", titleNameMap: "Section Titles", theme: "Theme"
    }
  };

  /* ---------- 状态 ---------- */
  var state = { data: clone(DEFAULT_DATA), template: "tpl-1", lang: "zh", inline: false };

  /* ---------- 工具函数 ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
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
    if (p[0] === "skillList" && p.length === 3) {
      var i = Number(p[1]);
      if (!Array.isArray(state.data.skillList)) state.data.skillList = [];
      state.data.skillList[i] = value;
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
  }

  function addItem(sec) {
    var cfg = FORM.find(function (s) { return s.key === sec; });
    var obj = {};
    cfg.fields.forEach(function (f) { obj[f.k] = (f.type === "range") ? ["", ""] : ""; });
    if (!Array.isArray(state.data[sec])) state.data[sec] = [];
    state.data[sec].push(obj);
    buildEditor(); renderPreview(); save();
  }
  function delItem(sec, idx) {
    if (Array.isArray(state.data[sec])) state.data[sec].splice(idx, 1);
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

  function buildSkillEditor() {
    var L = UI[state.lang];
    var arr = Array.isArray(state.data.skillList) ? state.data.skillList : [];
    var text = arr.join("\n");
    return '<div class="card"><h3 class="card-h">' + L.skillList + "</h3>" +
      '<div class="f"><label class="f-label">每行一个技能</label>' +
      '<textarea data-sec="skillList" data-skill="1" rows="5">' + esc(text) + "</textarea></div></div>";
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

  function buildEditor() {
    var L = UI[state.lang];
    var html = "";
    FORM.forEach(function (sec) {
      if (sec.key === "skillList") { html += buildSkillEditor(); return; }
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
    document.getElementById("editor").innerHTML = html;
  }

  /* ---------- 编辑器事件 ---------- */
  function onEditorInput(e) {
    var t = e.target;
    if (t.dataset.skill) {
      var lines = t.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      state.data.skillList = lines;
      afterDataChange();
      return;
    }
    var sec = t.dataset.sec;
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
    var defs = [["mobile", "手机"], ["email", "邮箱"], ["github", "GitHub"], ["zhihu", "知乎"], ["workExpYear", "工作年限"]];
    var arr = [];
    defs.forEach(function (d) { if (p[d[0]]) arr.push({ key: d[0], label: d[1], value: p[d[0]] }); });
    return arr;
  }
  function contactsHTML(mode) {
    var items = contactsItems();
    if (mode === "chip") {
      return items.map(function (it) {
        return '<span class="chip"' + bind("profile." + it.key) + ">" + esc(it.value) + "</span>";
      }).join("");
    }
    return items.map(function (it) {
      return '<div class="side-contact"><span class="sc-k">' + esc(it.label) + "</span>" +
        '<span class="sc-v"' + bind("profile." + it.key) + ">" + esc(it.value) + "</span></div>";
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

  function skillInner() {
    var list = state.data.skillList || [];
    if (!list.length) return "";
    var tags = list.map(function (s, i) {
      var t = (typeof s === "object") ? (s.skill || s.skill_name || "") : s;
      return '<span class="tag"' + bind("skillList." + i) + ">" + esc(t) + "</span>";
    }).join("");
    return '<div class="tags">' + tags + "</div>";
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
    var eduB = block("educationList", "教育背景", eduInner());
    var workB = block("workExpList", "工作经历", workInner());
    var projB = block("projectList", "项目经验", projectInner());
    var skillB = block("skillList", "个人技能", skillInner());
    var awardB = block("awardList", "更多信息", awardInner());
    var workListB = block("workList", "个人作品", workListInner());
    var aboutB = block("aboutme", "个人评价", aboutInner());
    var html = "";
    if (state.template === "tpl-3") {
      html = '<div class="resume tpl-3" style="' + themeVars() + '">' +
        '<aside class="r-side">' + avatarHTML("side") +
        '<div class="side-name"' + bind("profile.name") + ">" + esc((d.profile || {}).name || "") + "</div>" +
        '<div class="side-contacts">' + contactsHTML("list") + "</div>" +
        skillB + awardB + "</aside>" +
        '<div class="r-main">' + eduB + workB + projB + aboutB + workListB + "</div></div>";
    } else {
      html = '<div class="resume ' + state.template + '" style="' + themeVars() + '">' +
        '<div class="r-header">' + headerHTML() + "</div>" +
        eduB + workB + projB + skillB + awardB + workListB + aboutB + "</div>";
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

  /* ---------- 持久化 ---------- */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: state.data, template: state.template, lang: state.lang, inline: state.inline
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
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed.data) {
        var d = clone(DEFAULT_DATA);
        Object.keys(parsed.data).forEach(function (k) { d[k] = parsed.data[k]; });
        state.data = d;
      }
      if (parsed.template) state.template = parsed.template;
      if (parsed.lang) state.lang = parsed.lang;
      if (typeof parsed.inline === "boolean") state.inline = parsed.inline;
    } catch (e) { /* 忽略损坏数据 */ }
  }

  /* ---------- 工具栏动作 ---------- */
  function exportJSON() {
    var blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
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
        state.data = d;
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

  /* ---------- 初始化 ---------- */
  function init() {
    load();
    buildEditor();
    renderPreview();
    syncToolbar();
    save();

    var editor = document.getElementById("editor");
    editor.addEventListener("input", onEditorInput);
    editor.addEventListener("change", onEditorInput);
    editor.addEventListener("click", onEditorClick);

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
    document.getElementById("printBtn").addEventListener("click", function () { window.print(); });
    document.getElementById("resetBtn").addEventListener("click", resetAll);
    document.getElementById("importBtn").addEventListener("click", function () {
      document.getElementById("importFile").click();
    });
    document.getElementById("importFile").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
      e.target.value = "";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
