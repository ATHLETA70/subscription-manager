const puppeteer = require('puppeteer');

async function testSearch() {
    console.log('Starting Puppeteer test (Standard + DuckDuckGo)...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ja-JP']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const query = 'NewsPicks 解約方法 公式';
        console.log(`Searching for: ${query}`);

        // Use DuckDuckGo HTML version
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for results
        try {
            await page.waitForSelector('.result', { timeout: 10000 });
        } catch (e) {
            console.log('Timeout waiting for .result selector.');
        }

        // Capture screenshot
        await page.screenshot({ path: 'debug-ddg.png' });
        console.log('Saved debug-ddg.png');

        const results = await page.evaluate(() => {
            const items = [];
            const resultElements = document.querySelectorAll('.result');

            resultElements.forEach(el => {
                const titleEl = el.querySelector('.result__a');
                const snippetEl = el.querySelector('.result__snippet');

                if (titleEl && titleEl.href) {
                    items.push({
                        title: titleEl.innerText.trim(),
                        url: titleEl.href,
                        snippet: snippetEl ? snippetEl.innerText.trim() : ''
                    });
                }
            });
            return items;
        });

        console.log('Results found:', results.length);
        results.forEach((r, i) => {
            console.log(`${i + 1}. ${r.title} (${r.url})`);
        });

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testSearch();
