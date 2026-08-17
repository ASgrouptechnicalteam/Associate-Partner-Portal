import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_PAGE_ERROR:', error.message));

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    console.log('PAGE_LOADED_SUCCESSFULLY');
    await page.type('#associateId', 'ASSOC-MD-4056');
    await page.type('#password', 'Password123!');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 4000));
    console.log('WAIT_DONE');
    console.log('CURRENT_URL:', page.url());
    const content = await page.content();
    if (content.includes('Dashboard')) {
      console.log('DASHBOARD_TEXT_FOUND');
    } else {
      console.log('DASHBOARD_TEXT_MISSING');
    }
  } catch (error) {
    console.log('GOTO_ERROR:', error);
  } finally {
    await browser.close();
  }
})();
