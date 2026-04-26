/**
 * 本地开彩号码爬虫服务器
 * 使用 Puppeteer 爬取 4dyes3.com 的开彩号码
 *
 * 安装步骤：
 * 1. 在命令行运行：npm install express puppeteer cors
 * 2. 运行此文件：node lottery-scraper.js
 * 3. 服务器会在 http://localhost:3000 运行
 */

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

app.use(cors());

let browser = null;

// 初始化浏览器
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
}

// 爬取开彩号码
async function scrapeLotteryNumbers() {
  try {
    await initBrowser();
    const page = await browser.newPage();

    // 设置超时
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    console.log('正在访问网站...');
    await page.goto('https://4dyes3.com/en/gdlotto-perdana-lucky', {
      waitUntil: 'networkidle2'
    });

    // 等待动态内容加载
    await page.waitForTimeout(3000);

    // 提取数据
    const data = await page.evaluate(() => {
      const pageText = document.body.innerText;

      return {
        date: new Date().toISOString().split('T')[0],
        L3: { 1: '', 2: '', 3: '', S: '', C: '' },
        L: { 1: '', 2: '', 3: '', S: '', C: '' },
        N3: { 1: '', 2: '', 3: '', S: '', C: '' },
        N: { 1: '', 2: '', 3: '', S: '', C: '' },
        debug: {
          pageText: pageText.substring(0, 3000),
          allNumbers: pageText.match(/\d{4}/g) || []
        }
      };
    });

    // 输出调试信息到服务器控制台
    console.log('===== 页面内容（前3000字） =====');
    console.log(data.debug.pageText);
    console.log('===== 结束 =====');
    console.log('找到的所有4位号码:', data.debug.allNumbers.slice(0, 30));

    // 删除调试信息，不返回给客户端
    delete data.debug;

    await page.close();
    return { success: true, data };
  } catch (error) {
    console.error('爬虫错误:', error.message);
    return { success: false, error: error.message };
  }
}

// API 路由
app.get('/api/lottery', async (req, res) => {
  console.log('收到爬虫请求...');
  const result = await scrapeLotteryNumbers();
  res.json(result);
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 关闭服务器
async function shutdown() {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✓ 爬虫服务器已启动: http://localhost:${PORT}`);
  console.log('API 端点: GET http://localhost:3000/api/lottery');
  console.log('健康检查: GET http://localhost:3000/api/health\n');
  initBrowser();
});
