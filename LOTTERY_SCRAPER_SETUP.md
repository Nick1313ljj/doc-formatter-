# 开彩号码爬虫服务器 - 安装指南

## 概述
这是一个本地 Node.js 爬虫服务器，用于从 4dyes3.com 自动抓取开彩号码。
- 完全避免 CORS 跨域限制
- 使用 Puppeteer 正确渲染 JavaScript
- 稳定可靠的数据抓取

---

## 安装步骤

### 1️⃣ 安装 Node.js（如果还没安装）

- 访问 https://nodejs.org/
- 下载 LTS 版本（推荐）
- 按默认设置安装

验证安装成功：
```bash
node --version
npm --version
```

---

### 2️⃣ 安装依赖

打开命令行（CMD 或 PowerShell），进入项目目录：

```bash
cd C:\Users\PHATOM GAMING
npm install
```

这会安装三个包：
- **express**: Web 框架
- **puppeteer**: 浏览器自动化（爬虫核心）
- **cors**: 跨域支持

⏱️ **首次安装需要 2-5 分钟**（Puppeteer 会下载 Chromium 浏览器）

---

### 3️⃣ 启动爬虫服务器

```bash
node lottery-scraper.js
```

成功启动会看到：
```
✓ 爬虫服务器已启动: http://localhost:3000
API 端点: GET http://localhost:3000/api/lottery
健康检查: GET http://localhost:3000/api/health
```

**保持这个窗口打开**，服务器需要持续运行。

---

## 使用方法

### 方法 1：手动抓取

1. 打开 doc-formatter 网页
2. 进入"⑧ 中奖"面板
3. 点击"🔄 自动抓取"按钮
4. 等待 5-10 秒（首次可能更长）
5. 号码会自动填充到文本框
6. 点击"➕ 添加到库"

### 方法 2：自动定时抓取

- 保持网页和爬虫服务器同时打开
- 每天 4pm 和 8pm 时自动触发（仅一次）
- 号码自动填充，无需手动操作

---

## 故障排查

### 问题 1：npm 命令找不到
**原因**: Node.js 未正确安装
**解决**: 重新安装 Node.js，并在安装时勾选"Add to PATH"

### 问题 2：Puppeteer 下载失败
**原因**: 网络问题或磁盘空间不足
**解决**:
```bash
# 清空缓存后重试
npm cache clean --force
npm install
```

### 问题 3：爬虫返回空数据
**原因**: 网站结构变化
**解决**: 
1. 检查网站是否正常访问
2. 看看网页源代码是否改变
3. 可能需要更新正则表达式

### 问题 4：点击"自动抓取"出现连接错误
**原因**: 爬虫服务器没有运行
**解决**:
```bash
# 确保在正确的目录
cd C:\Users\PHATOM GAMING
# 重新启动服务器
node lottery-scraper.js
```

---

## 高级配置

### 改变端口（如果 3000 被占用）

编辑 `lottery-scraper.js`，找到最后一行：
```javascript
const PORT = 3000;  // 改为其他端口，如 8080
```

然后在 HTML 中修改：
```javascript
const response = await fetch('http://localhost:8080/api/lottery', {
```

### 添加代理（如果在海外）

编辑 `lottery-scraper.js` 的 `puppeteer.launch()` 部分：
```javascript
browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--proxy-server=http://your-proxy:port'  // 添加代理
  ]
});
```

---

## 技术细节

**架构**:
```
HTML 网页 (doc-formatter)
    ↓
HTTP GET /api/lottery
    ↓
本地爬虫服务器 (Node.js + Puppeteer)
    ↓
Puppeteer (Chromium 浏览器) → 自动访问 4dyes3.com
    ↓
提取数据 → 返回 JSON
    ↓
HTML 网页解析 → 填充文本框
```

**为什么用 Puppeteer 而不是爬虫库**:
- 4dyes3.com 使用 JavaScript 动态加载号码
- 普通爬虫（如 BeautifulSoup）只能获取静态 HTML
- Puppeteer 控制真实浏览器，能正确执行 JavaScript

---

## 注意事项

⚠️ **建议保持后台运行**:
- 爬虫服务器最好全天运行
- 这样 4pm/8pm 才能自动抓取
- 可以使用 Windows 任务计划程序自动启动

⚠️ **隐私和合法性**:
- 只爬取公开数据
- 不会造成网站压力（爬虫间隔足够长）
- 建议在网站 robots.txt 允许的范围内使用

---

## 卸载

如果要删除爬虫服务器：

```bash
# 删除依赖包
rmdir /s node_modules

# 删除锁定文件
del package-lock.json

# 删除爬虫脚本
del lottery-scraper.js

# 删除本说明
del LOTTERY_SCRAPER_SETUP.md
```

---

## 更新日志

**v1.0.0** (2026-04-27)
- ✓ 初始版本
- ✓ 支持 Lucky 3:30PM、Lucky、Perdana 3:30PM、Perdana
- ✓ API 端点: GET /api/lottery
- ✓ 健康检查: GET /api/health

---

有问题可以查看爬虫日志或提交 issue 👇
