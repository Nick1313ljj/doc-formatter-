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

      // 查找各个部分的文本
      // LuckyHari-Hari 3:30 (L3)
      if (pageText.includes('LuckyHari-Hari') && pageText.includes('3.30')) {
        const l3Section = pageText.match(/LuckyHari-Hari.*?3\.30.*?1st Prize.*?(\d{4}).*?2nd Prize.*?(\d{4}).*?3rd Prize.*?(\d{4})/is);
        if (l3Section) {
          result.L3['1'] = l3Section[1];
          result.L3['2'] = l3Section[2];
          result.L3['3'] = l3Section[3];
        }
      }

      // LuckyHari-Hari 7:30 (L)
      const lSection = pageText.match(/LuckyHari-Hari.*?7\.30.*?1st Prize.*?(\d{4}).*?2nd Prize.*?(\d{4}).*?3rd Prize.*?(\d{4})/is);
      if (lSection) {
        result.L['1'] = lSection[1];
        result.L['2'] = lSection[2];
        result.L['3'] = lSection[3];
      }

      // Perdana 3:30 (N3)
      const n3Section = pageText.match(/Perdana.*?3\.30.*?1st Prize.*?(\d{4}).*?2nd Prize.*?(\d{4}).*?3rd Prize.*?(\d{4})/is);
      if (n3Section) {
        result.N3['1'] = n3Section[1];
        result.N3['2'] = n3Section[2];
        result.N3['3'] = n3Section[3];
      }

      // Perdana 7:30 (N)
      const nSection = pageText.match(/Perdana.*?7\.30.*?1st Prize.*?(\d{4}).*?2nd Prize.*?(\d{4}).*?3rd Prize.*?(\d{4})/is);
      if (nSection) {
        result.N['1'] = nSection[1];
        result.N['2'] = nSection[2];
        result.N['3'] = nSection[3];
      }

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
