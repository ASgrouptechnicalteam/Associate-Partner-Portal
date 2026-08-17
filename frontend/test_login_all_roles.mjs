import puppeteer from 'puppeteer';

const users = [
  { associateId: 'ASSOC-MD-4056', password: 'Password123!', role: 'MD' },
  { associateId: 'ASSOC-MN-5001', password: 'Password123!', role: 'ASSOCIATE_MANAGER' },
  { associateId: 'ASSOC-RS-6432', password: 'Password123!', role: 'ASSOCIATE' },
];

(async () => {
  const browser = await puppeteer.launch();
  
  for (const user of users) {
    console.log(`\nTesting login for ${user.role} (${user.associateId})`);
    const page = await browser.newPage();
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
      await page.type('#associateId', user.associateId);
      await page.type('#password', user.password);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
      await new Promise(r => setTimeout(r, 2000)); // wait for any client-side redirects
      
      const currentUrl = page.url();
      console.log(`CURRENT_URL: ${currentUrl}`);
      
      const content = await page.content();
      if (content.includes('Welcome back')) {
        console.log(`[SUCCESS] Logged in successfully to Dashboard as ${user.role}`);
      } else {
        console.log(`[FAILURE] Did not see Dashboard for ${user.role}`);
        const text = await page.evaluate(() => document.body.innerText);
        console.log(`PAGE TEXT: ${text}`);
        if (content.includes('Authentication failed')) {
            console.log('Error message: Authentication failed');
        }
      }
    } catch (error) {
      console.log(`[ERROR] ${error.message}`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
})();
