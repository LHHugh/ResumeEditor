# 在线简历编辑器（Resume Maker）

一个**零依赖、纯静态**的在线简历模板网站，灵感来自 [visiky/resume](https://github.com/visiky/resume)。
打开网页即可在左侧编辑、右侧实时预览，支持导出 PDF（浏览器打印）与 JSON，数据自动保存在本地浏览器。

## 功能

- 🧩 三套模板：**默认模板 / 简易模板 / 侧边栏模板**
- 🎨 自定义**主题色**与**标签色**
- ✍️ 左侧表单实时编辑，右侧 A4 预览，输入即所见
- 🖱️ **「直接编辑预览」模式**：开启后简历正文可直接点选修改（所见即所得），与表单双向同步
- 💾 内容自动保存到浏览器 `localStorage`，刷新不丢失
- 📤 导出 `resume.json` / 导入已有的 `resume.json`（兼容 visiky 数据结构）
- 🖨️ 一键「打印 / PDF」导出（建议打印时选「另存为 PDF」、关闭页眉页脚）
- 🌐 中英界面切换

## 数据模型

与 visiky/resume 的 `resume.json` 兼容，主要字段：

```
profile        { name, email, mobile, github, zhihu, workExpYear }
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
   （本仓库线上地址：https://lhhugh.github.io/ResumeEditor/）

> 若使用 **用户页**（仓库名为 `<用户名>.github.io`），站点地址为 `https://<用户名>.github.io/`。

## 目录结构

```
resume-site/
├── index.html              # 入口页面
├── assets/
│   ├── css/style.css       # 三套模板 + 主题变量 + 打印样式
│   ├── js/app.js           # 编辑器 / 预览 / 持久化 / 导入导出
│   └── data/sample.json    # 示例数据（可直接作为 resume.json 导入）
└── README.md
```
