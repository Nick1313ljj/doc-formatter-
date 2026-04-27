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

    // 捕获浏览器的 console 输出
    page.on('console', msg => {
      if (msg.text().includes('【DEBUG】')) {
        console.log('浏览器输出:', msg.text());
      }
    });

    console.log('正在访问网站...');
    await page.goto('https://4dyes3.com/en/gdlotto-perdana-lucky', {
      waitUntil: 'networkidle2'
    });

    // 等待动态内容加载
    await page.waitForTimeout(3000);

    // 提取数据
    const pageText = await page.evaluate(() => document.body.innerText);

    console.log('\n【DEBUG】页面文本长度:', pageText.length);
    console.log('【DEBUG】页面文本前3000字符：\n');
    console.log(pageText.substring(0, 3000));
    console.log('\n【DEBUG】页面文本结束\n');

    const data = await page.evaluate(() => {
      const pageText = document.body.innerText;

      const result = {
        date: new Date().toISOString().split('T')[0],
        L3: { 1: '', 2: '', 3: '', S: '', C: '' },
        L: { 1: '', 2: '', 3: '', S: '', C: '' },
        N3: { 1: '', 2: '', 3: '', S: '', C: '' },
        N: { 1: '', 2: '', 3: '', S: '', C: '' }
      };

      // 辅助函数：从一个彩票区块提取数据
      function extractFromSection(section) {
        const data = { 1: '', 2: '', 3: '', S: '', C: '' };

        // 提取1st Prize的数字
        const first = section.match(/1st\s+Prize\s*\n\s*\(\w\)\s*(\d{4})/);
        if (first) data['1'] = first[1];

        // 提取2nd Prize的数字
        const second = section.match(/2nd\s+Prize\s*\n\s*\(\w\)\s*(\d{4})/);
        if (second) data['2'] = second[1];

        // 提取3rd Prize的数字
        const third = section.match(/3rd\s+Prize\s*\n\s*\(\w\)\s*(\d{4})/);
        if (third) data['3'] = third[1];

        // 提取Special的第一个数字（Special后面跟第一个4位数）
        const special = section.match(/Special\s*\n\s*(\d{4})/);
        if (special) data['S'] = special[1];

        // 提取Consolation的第一个数字
        const consolation = section.match(/Consolation\s*\n\s*(\d{4})/);
        if (consolation) data['C'] = consolation[1];

        return data;
      }

      // 按 "Live Results" 分割各个彩票区块
      const liveResultsPattern = /[A-Za-z\s&]+?Live Results[^\n]*/g;
      let match;
      const sections = [];

      while ((match = liveResultsPattern.exec(pageText)) !== null) {
        const startIdx = match.index;
        const nextMatchIdx = liveResultsPattern.lastIndex;
        const endIdx = pageText.indexOf('\n', nextMatchIdx + 500) || pageText.length;

        const section = pageText.substring(startIdx, endIdx);
        if (section.length > 50) sections.push(section);
      }

      // 提取各类型的彩票数据
      sections.forEach(section => {
        const extracted = extractFromSection(section);

        // 跳过没有数据的区块
        if (!extracted['1'] && !extracted['2'] && !extracted['3']) return;

        // 根据标题判断彩票类型
        if (section.match(/Lucky.*Hari.*3[:.]30/i)) {
          result.L3 = extracted;
        } else if (section.match(/Lucky.*Hari.*7[:.]30/i)) {
          result.L = extracted;
        } else if (section.match(/Perdana.*3[:.]30/i)) {
          result.N3 = extracted;
        } else if (section.match(/Perdana.*7[:.]30/i)) {
          result.N = extracted;
        } else if (section.match(/GDLotto/i)) {
          // GDLotto 默认分配给 N（7:30PM）
          result.N = extracted;
        }
      });

      return result;
    });

    // 输出提取结果
    console.log('═══ 提取结果 ═══');
    console.log(JSON.stringify(data, null, 2));

    // 检查是否成功提取了数据
    const hasData = Object.values(data).some(lottery =>
      Object.values(lottery).some(val => val !== '')
    );
    if (!hasData) {
      console.warn('⚠️ 警告：未提取到任何开彩号码！检查页面是否已完全加载。');
    } else {
      console.log('✓ 成功提取开彩号码');
    }

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
