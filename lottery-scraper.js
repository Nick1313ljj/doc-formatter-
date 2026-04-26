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
      const result = {
        date: new Date().toISOString().split('T')[0],
        L3: { 1: '', 2: '', 3: '', S: '', C: '' },
        L: { 1: '', 2: '', 3: '', S: '', C: '' },
        N3: { 1: '', 2: '', 3: '', S: '', C: '' },
        N: { 1: '', 2: '', 3: '', S: '', C: '' }
      };

      // 获取所有文本内容
      const pageText = document.body.innerText;

      // 调试：输出页面的相关部分
      console.log('===== 页面内容调试 =====');
      console.log(pageText.substring(0, 2000));
      console.log('===== 结束 =====');

      // 简化版本：直接查找所有4位数字，按顺序关联到各个彩票类型
      // 这是一个备用方案，用来获取数据以便调试
      const allNumbers = pageText.match(/\d{4}/g) || [];
      console.log('找到的所有4位号码:', allNumbers.slice(0, 20));

      return result;
    });

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
