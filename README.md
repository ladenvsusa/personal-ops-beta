# 个人运营系统 Beta

一个面向个人长期使用的“个人运营中枢”安卓应用原型。首页聚合当天状态，底部按人际关系、运动、学习、工作、理财、出行六个模块组织个人数据。

## 当前版本

- 版本号：`0.1.0-beta`
- 包名：`com.personal.ops.beta`
- 应用名：`个人运营Beta`
- Android：`minSdk 23`，`targetSdk 35`
- 构建类型：Debug Beta

## 已实现功能

- 首页看板：今日步数、热量、睡眠、重点任务、本月支出。
- 人际关系：新增人物、关系分类、简介、事件、喜好、CSV 导入。
- 多关系网：可新增并命名多张关系网，切换查看，拖拽人物节点，给人物之间添加关系连线。
- 照片上传：人物、出行、理财流水均支持上传照片并显示缩略图。
- 运动：身高、体重、心率、步数、热量、睡眠手动录入，支持体重趋势图。
- 学习：英语模块占位，保留需求笔记。
- 工作：重点任务、进度、时间节点，按时间段一键生成阶段总结 Prompt。
- 理财：手动记账、CSV 导入、截图待识别占位、待补全审核。
- 出行：出行记录、出行规划，支持名称、分类、定位、时间、照片和备注。

## Beta APK

已生成可安装测试包：

```text
C:\Users\0\Documents\Codex\2026-07-08\new-chat\outputs\personal-os-beta-debug.apk
```

## 本地运行

这个项目的页面部分是静态前端，可以直接打开：

```text
C:\Users\0\Documents\Codex\2026-07-08\new-chat\work\personal-life-apk\index.html
```

## 重新构建 APK

已准备免安装构建环境：

- JDK 21：`C:\Users\0\Documents\Codex\toolchains\jdk-21.0.8+9`
- Android SDK：`C:\Users\0\Documents\Codex\toolchains\android-sdk`
- Gradle 分发包：`C:\Users\0\Documents\Codex\toolchains\gradle-8.11.1-all.zip`
- Capacitor：项目内 `node_modules`

重新生成 Beta APK：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-beta.ps1
```

## 技术路线

- 前端：原生 HTML/CSS/JavaScript
- Android 封装：Capacitor
- 当前存储：浏览器本地存储
- 后续计划：SQLite 本地数据库、OneDrive 同步、账单 OCR、高驰运动数据接入

## 建议 OneDrive 数据目录

```text
OneDrive/个人运营系统/
  people/people.json
  people/files/
  sport/sport_records.json
  work/tasks.json
  finance/expenses.json
  travel/trips.json
  attachments/
```

## 后续路线

1. 把当前 localStorage 存储升级为 SQLite。
2. 用 Capacitor 文件系统插件保存照片和附件。
3. 接入 OneDrive，同步 JSON 数据和附件。
4. 支持支付宝、微信账单 CSV 导入和截图 OCR。
5. 明确高驰数据来源，优先做文件导入，其次再考虑 API。
6. 生成正式签名 Release 包。
