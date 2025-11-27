import puppeteer from 'puppeteer';

export interface SearchResult {
    title: string;
    url: string;
    snippet?: string;
}

export async function performGoogleSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    console.log(`[Puppeteer] Starting DuckDuckGo search for: ${query}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ja-JP'],
        });

        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to DuckDuckGo (HTML version is easier to scrape and lighter)
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for results
        await page.waitForSelector('.result', { timeout: 10000 });

        // Extract results
        const results = await page.evaluate((limit) => {
            const items: { title: string; url: string; snippet?: string }[] = [];
            const resultElements = document.querySelectorAll('.result');

            for (const el of resultElements) {
                if (items.length >= limit) break;

                const titleEl = el.querySelector('.result__a');
                const snippetEl = el.querySelector('.result__snippet');

                if (titleEl && (titleEl as HTMLAnchorElement).href) {
                    let url = (titleEl as HTMLAnchorElement).href;
                    // Decode DuckDuckGo redirect URL
                    if (url.includes('duckduckgo.com/l/')) {
                        try {
                            const urlObj = new URL(url);
                            const uddg = urlObj.searchParams.get('uddg');
                            if (uddg) {
                                url = decodeURIComponent(uddg);
                            }
                        } catch (e) {
                            // Keep original URL if parsing fails
                        }
                    }

                    items.push({
                        title: titleEl.textContent?.trim() || '',
                        url: url,
                        snippet: snippetEl?.textContent?.trim() || ''
                    });
                }
            }
            return items;
        }, limit);

        console.log(`[Puppeteer] Found ${results.length} results`);
        return results;

    } catch (error) {
        console.error('[Puppeteer] Search failed:', error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
