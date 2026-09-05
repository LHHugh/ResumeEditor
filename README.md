# 在线简历编辑器 · Resume Maker

> 零依赖、纯静态的在线简历模板网站。打开网页即可编辑，右侧实时预览，一键导出 PDF / JSON。
> 灵感来自 [visiky/resume](https://github.com/visiky/resume)，并在其数据结构基础上扩展了账号系统、模块管理与所见即所得编辑。

[![Static](https://img.shields.io/badge/build-static%20%2F%20no%20backend-2f5785)](https://pages.github.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-v1.4.1-blue)](CHANGELOG)

- 🌐 在线体验：在你自己的 GitHub Pages 部署后访问 `https://<用户名>.github.io/<仓库名>/`

---

## ✨ 核心特性

| 类别 | 说明 |
| --- | --- |
| **模板** | 三套精心设计的模板：默认模板 / 简易模板 / 侧边栏模板，支持主题色与标签色自定义 |
| **编辑方式** | 左侧表单编辑 + 右侧 A4 实时预览；另支持「直接编辑预览」所见即所得模式，与表单双向同步 |
| **头像** | 本地上传（自动缩放为小图、可粘贴 URL），圆角长方形展示，点击预览头像亦可上传 |
| **模块管理** | 大模块自由增减（教育 / 工作 / 项目 / 技能 / 更多信息 / 作品 / 评价）；**长按拖动调整主区域 / 侧边栏模块顺序**；自定义模块支持两种内部结构 |
| **个人技能** | 分组式管理：每个分组可命名，组内技能项逐条增删改，也可在预览中直接编辑 |
| **基本信息** | 姓名固定，联系方式（手机 / 邮箱 / 自定义标签）可自由增删改 |
| **侧边栏模块** | 侧边栏模板可单独增删模块，新增时可选「个人技能格式」或「更多信息格式」 |
| **账号系统** | 纯前端注册 / 登录，按账号命名空间隔离数据，互不覆盖，支持退出切换 |
| **数据持久化** | 自动保存到浏览器 `localStorage`，刷新不丢失；可导出 / 导入 `resume.json` |
| **导出** | 一键「打印 / PDF」，按 A4（210mm × 297mm）满幅输出，无默认白边 |
| **双语** | 中文 / 英文界面切换 |
| **赞助** | 非强制赞助弹窗（打印后弹一次，或随时点工具栏按钮），关闭不影响功能 |

---

## 🚀 快速开始（本地预览）

任选其一启动本地静态服务器：

```bash
# 方式一：Python
cd resume-site && python -m http.server 8000
# 浏览器打开 http://localhost:8000

# 方式二：Node
npx serve resume-site
```

> 直接双击 `index.html` 也能用（部分浏览器对本地文件读取有限制，建议用本地服务器）。

---

## 📦 部署到 GitHub Pages

本仓库为**纯静态站点**，无需任何构建步骤。

1. 在 GitHub 新建仓库（例如 `resume`）。
2. 将本目录推送到仓库 `main` 分支：

   ```bash
   cd resume-site
   git init
   git add -A
   git commit -m "init resume maker"
   git branch -M main
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -u origin main
   ```

3. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **Deploy from a branch**，
   分支选 **main**、目录选 **/ (root)**，保存。
4. 等待 1~2 分钟，访问 `https://<用户名>.github.io/<仓库名>/` 即可。

> 若使用**用户页**（仓库名为 `<用户名>.github.io`），站点地址为 `https://<用户名>.github.io/`。

---

## 👤 账号系统与数据隔离

纯静态站点无服务器 / 数据库，账号系统为**纯前端实现**：

- 注册 / 登录信息（用户名 + 加盐 SHA-256 密码哈希）保存于浏览器 `localStorage`；
- 每个账号的简历数据写入独立键 `resume_data_v1__<用户名>`，**不同账号互不覆盖**；
- 首次注册会自动把旧版（无账号时）的本地数据迁移进该账号，避免丢失。

> ⚠️ 数据保存在**当前浏览器 / 设备**，换设备不会自动同步。跨设备请使用「导出 JSON」备份并在新设备「导入」。
> 若需真正的「云端账号 + 跨设备同步 + 服务端校验」，需引入后端（如 Supabase / Firebase），不在本静态站范围内。

---

## 🧩 模块与格式说明

- **大模块增减**：在左侧「模块管理」通过 `+ 添加` 自由增删预设模块。
- **个人技能（分组式）**：`个人技能` 卡片中，技能按「分组」组织（如「编程语言」「前端框架」），
  每个分组可命名（留空则仅显示标签），组内每条技能可独立编辑 / 删除 / 新增。
- **自定义模块**：输入名称即可新增。新增时可选择内部结构：
  - **更多信息格式**：每条含「内容 + 时间」（适用于奖项、证书等）；
  - **个人技能格式**：分组式技能标签（适用于技能墙、工具清单等）。
- **侧边栏模块**：在侧边栏模板下，可在「模块管理 → 侧边栏模块」单独增删，同样支持上述两种格式。

### 数据模型（兼容 visiky/resume）

```
profile        { name, contacts:[ { label, value }, ... ] }
avatar         { src, hidden }
educationList  [ { edu_time:[起,止], school, major, academic_degree } ]
workExpList    [ { company_name, department_name, work_time:[起,止], work_desc } ]
projectList    [ { project_name, project_role, project_time, project_desc, project_content } ]
skillList      [ { name, items:[ "技能1", "技能2", ... ] }, ... ]   // 分组结构
awardList      [ { award_info, award_time } ]
workList       [ { work_name, work_desc, work_link } ]
aboutme        { aboutme_desc }
titleNameMap   { 各模块标题 }
theme          { color, tagColor }
```

> 时间字段用数组 `[开始, 结束]`，结束为 `null` 时显示「至今」；格式随意（如 `2020.07`）。

---

## 💛 赞助支持

如果这个工具帮到了你，欢迎请作者喝杯咖啡 ☕ —— 赞助完全自愿，不影响任何功能。

<div align="center">
  <img src="assets/img/alipay-qr.jpg" alt="支付宝赞助二维码" width="220">
  <p><sub>支付宝收款码 · 可在 <code>assets/js/app.js</code> 的 <code>SPONSOR.qr</code> 中替换为你自己的图片</sub></p>
</div>

替换二维码：将你的收款码放到 `assets/img/`，命名为 `alipay-qr.jpg`（或修改 `SPONSOR.qr` 路径）；
若不想显示赞助，将 `SPONSOR.enabled` 设为 `false` 即可。

---

## 📝 版本更新日志

详见 [CHANGELOG](CHANGELOG)。摘要：

| 版本 | 日期 | 主要变更 |
| --- | --- | --- |
| **v1.4.1** | 2026-09 | 模块管理支持**长按拖动排序**（主区域 / 侧边栏，鼠标与触屏通用），松手即保存 |
| **v1.4.0** | 2026-09 | 个人技能改为**分组式**，支持分组与技能项逐条增删改；侧边栏自定义模块支持「个人技能 / 更多信息」两种格式 |
| **v1.3.0** | 2026-09 | 基本信息联系方式可增删改；自定义模块可加入侧边栏 |
| **v1.2.0** | 2026-09 | 模块管理：大模块自由增减、自定义模块（更多信息格式）、侧边栏模块 |
| **v1.1.0** | 2026-09 | 账号系统（注册/登录、数据按账号隔离）、非强制赞助弹窗 |
| **v1.0.0** | 2026-09 | 三套模板、主题色、双语、行内编辑、本地头像上传（圆角长方形）、A4 满版打印 |

---

## 📂 目录结构

```
resume-site/
├── index.html              # 入口页面
├── assets/
│   ├── css/style.css       # 三套模板 + 主题变量 + 登录/弹窗/打印样式
│   ├── js/app.js           # 编辑器 / 预览 / 持久化 / 账号 / 赞助 / 模块管理
│   ├── img/alipay-qr.jpg   # 赞助二维码
│   └── data/sample.json    # 示例数据（可直接作为 resume.json 导入）
├── CHANGELOG               # 版本更新日志
└── README.md
```

## 📄 License

[MIT](LICENSE) — 可自由使用、修改与再分发。
