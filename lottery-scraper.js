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
      const result = {
        date: new Date().toISOString().split('T')[0],
        L3: { 1: '', 2: '', 3: '', S: '', C: '' },
        L: { 1: '', 2: '', 3: '', S: '', C: '' },
        N3: { 1: '', 2: '', 3: '', S: '', C: '' },
        N: { 1: '', 2: '', 3: '', S: '', C: '' }
      };

      // 按彩票类型分割文本
      // 格式: "Type - Live Results\n[Draw Date]\n1st Prize\n(L) XXXX\n2nd Prize\n(M) XXXX\n3rd Prize\n(A) XXXX\nSpecial\nXXXX\n...\nConsolation\nXXXX"

      // Lucky Hari-Hari 3:30 (L3)
      const l3Match = pageText.match(/LuckyHari-Hari.*?3\.30.*?1st Prize.*?\(.\) (\d{4}).*?2nd Prize.*?\(.\) (\d{4}).*?3rd Prize.*?\(.\) (\d{4})/is);
      if (l3Match) {
        result.L3['1'] = l3Match[1];
        result.L3['2'] = l3Match[2];
        result.L3['3'] = l3Match[3];
      }

      // Lucky Hari-Hari 7:30 (L)
      const lMatch = pageText.match(/LuckyHari-Hari.*?7\.30.*?1st Prize.*?\(.\) (\d{4}).*?2nd Prize.*?\(.\) (\d{4}).*?3rd Prize.*?\(.\) (\d{4})/is);
      if (lMatch) {
        result.L['1'] = lMatch[1];
        result.L['2'] = lMatch[2];
        result.L['3'] = lMatch[3];
      }

      // Perdana 3:30 (N3)
      const n3Match = pageText.match(/Perdana.*?3\.30.*?1st Prize.*?\(.\) (\d{4}).*?2nd Prize.*?\(.\) (\d{4}).*?3rd Prize.*?\(.\) (\d{4})/is);
      if (n3Match) {
        result.N3['1'] = n3Match[1];
        result.N3['2'] = n3Match[2];
        result.N3['3'] = n3Match[3];
      }

      // Perdana 7:30 (N)
      const nMatch = pageText.match(/Perdana.*?7\.30.*?1st Prize.*?\(.\) (\d{4}).*?2nd Prize.*?\(.\) (\d{4}).*?3rd Prize.*?\(.\) (\d{4})/is);
      if (nMatch) {
        result.N['1'] = nMatch[1];
        result.N['2'] = nMatch[2];
        result.N['3'] = nMatch[3];
      }

      return result;
    });

    // 输出提取结果
    console.log('提取结果:', JSON.stringify(data, null, 2));

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
