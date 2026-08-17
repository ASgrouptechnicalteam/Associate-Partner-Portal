import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_PAGE_ERROR:', error.message));

  try {
    await page.goto('http://localhost:4173/login', { waitUntil: 'networkidle2' });
    // wait a bit for react to mount
    await new Promise(r => setTimeout(r, 3000));
    console.log('PAGE_LOADED_SUCCESSFULLY');
    const content = await page.content();
    if (content.includes('Sign in to your account')) {
      console.log('LOGIN_TEXT_FOUND');
    } else {
      console.log('LOGIN_TEXT_MISSING');
    }
  } catch (error) {
    console.log('GOTO_ERROR:', error);
  } finally {
    await browser.close();
  }
})();
