# 在线简历编辑器（Resume Maker）

一个**零依赖、纯静态**的在线简历模板网站，灵感来自 [visiky/resume](https://github.com/visiky/resume)。
打开网页即可在左侧编辑、右侧实时预览，支持导出 PDF（浏览器打印）与 JSON，数据自动保存在本地浏览器。

## 功能

- 🧩 三套模板：**默认模板 / 简易模板 / 侧边栏模板**
- 🎨 自定义**主题色**与**标签色**
- ✍️ 左侧表单实时编辑，右侧 A4 预览，输入即所见
- 🖱️ **「直接编辑预览」模式**：开启后简历正文可直接点选修改（所见即所得），与表单双向同步
- 📷 **头像本地上传**：左侧「头像」卡片可上传本地照片（自动缩放为小图、也可直接粘贴图片 URL），点击预览中的头像也能上传；形状为圆角长方形
- 💾 内容自动保存到浏览器 `localStorage`，刷新不丢失
- 📤 导出 `resume.json` / 导入已有的 `resume.json`（兼容 visiky 数据结构）
- 🖨️ 一键「打印 / PDF」导出：按 A4（210 mm × 297 mm）全幅输出，无浏览器默认白边
- 🧩 **模块可增减**：左侧「模块管理」可自由添加 / 删除「教育背景、工作经历、项目经验、个人技能、更多信息、个人作品、个人评价」等大模块
- ➕ **自定义模块**：在「模块管理」里输入名称即可新增任意模块（内部结构沿用「更多信息」格式：内容 + 时间）；也支持在**侧边栏模板**里单独增删「侧边栏模块」
- 📇 **基本信息可增删改**：「基本信息」卡片中，姓名固定，联系方式（手机 / 邮箱 / 微信 / 自定义标签等）均可自由添加、删除、修改
- 🌐 中英界面切换
- 🔐 **账号系统（纯前端）**：打开网站先登录 / 注册，每个账号的简历数据独立保存在浏览器 `localStorage` 的专属命名空间，**互不覆盖**；支持退出切换账号
- 💛 **赞助弹窗（非强制）**：点击「打印 / PDF」生成后会弹一次赞助提示（同一会话只弹一次），也可随时点工具栏「赞助 ♥」打开；关闭不影响任何功能

## 数据模型

与 visiky/resume 的 `resume.json` 兼容，主要字段：

```
profile        { name, contacts:[ { label, value }, ... ] }   // name 为标题大字号；contacts 可在编辑器增删改
avatar         { src, hidden }
educationList  [ { edu_time:[起,止], school, major, academic_degree } ]
workExpList    [ { company_name, department_name, work_time:[起,止], work_desc } ]
projectList    [ { project_name, project_role, project_time, project_desc, project_content } ]
skillList      [ "技能1", "技能2", ... ]   // 字符串数组，每个元素一个标签
awardList      [ { award_info, award_time } ]
workList       [ { work_name, work_desc, work_link } ]
aboutme        { aboutme_desc }
titleNameMap   { 各模块标题 中文/英文 }
theme          { color, tagColor }
```

> 时间字段用数组 `[开始, 结束]`，结束为 `null` 时显示「至今」；格式随意（如 `2020.07`）。

## 本地预览

任选其一：

```bash
# 方式一：Python
cd resume-site && python -m http.server 8000
# 浏览器打开 http://localhost:8000

# 方式二：Node
npx serve resume-site
```

直接双击 `index.html` 也可使用（部分浏览器对本地文件读取有限制，建议用本地服务器）。

## 部署到 GitHub Pages

1. 在 GitHub 新建一个仓库（例如 `resume`）。
2. 把本目录内容推送到该仓库的 `main` 分支：

   ```bash
   cd resume-site
   git init
   git add -A
   git commit -m "init resume maker"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

3. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **Deploy from a branch**，
   分支选 **main**、目录选 **/ (root)**，保存即可。本仓库已用此方式发布（纯静态，无需构建）。
4. 稍等 1~2 分钟构建完成，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。
   （本仓库线上地址：**https://lhhugh.github.io/ResumeEditor/**）

> 若使用 **用户页**（仓库名为 `<用户名>.github.io`），站点地址为 `https://<用户名>.github.io/`。

## 账号系统与数据隔离

本仓库是**纯静态站点**（GitHub Pages 只托管文件，无服务器 / 数据库），因此账号系统为**纯前端实现**：

- 注册 / 登录信息（用户名 + 加盐 SHA-256 密码哈希）保存在浏览器 `localStorage`；
- 每个账号的简历数据写入独立键 `resume_data_v1__<用户名>`，**不同账号之间不会互相覆盖**；
- 首次使用会自动把旧版（无账号时）的本地数据迁移进你注册的第一个账号，避免丢失。

> ⚠️ 限制：数据保存在**当前浏览器 / 设备**中，换设备不会自动同步；跨设备请使用「导出 JSON」备份并在新设备「导入」。
> 如果需要真正的「云端账号 + 跨设备同步 + 服务端校验」，需引入后端（如 Supabase / Firebase），不在本静态站范围内。

## 自定义赞助二维码

赞助弹窗已使用本仓库的支付宝收款码 `assets/img/alipay-qr.jpg`。如需替换：

1. 把你的支付宝收款码图片放到 `assets/img/`，命名为 `alipay-qr.jpg`；
2. 打开 `assets/js/app.js`，确认 `SPONSOR.qr` 指向你的图片路径即可。
3. 若不想显示赞助，可把 `SPONSOR.enabled` 设为 `false`。

## 目录结构

```
resume-site/
├── index.html              # 入口页面
├── assets/
│   ├── css/style.css       # 三套模板 + 主题变量 + 登录/弹窗/打印样式
│   ├── js/app.js           # 编辑器 / 预览 / 持久化 / 账号 / 赞助 / 模块管理
│   ├── img/alipay-qr.jpg   # 赞助二维码
│   └── data/sample.json    # 示例数据（可直接作为 resume.json 导入）
└── README.md
```
