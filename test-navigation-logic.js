// Test to demonstrate the Promise.race issue
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Promise.race with dual page.goto calls...');
  
  try {
    const result = await Promise.race([
      page.goto('https://example.com').then(() => {
        console.log('First goto completed');
        return true;
      }),
      page.goto('https://google.com').then(() => {
        console.log('Second goto completed');
        return true;
      })
    ]).catch((err) => {
      console.log('Both gotos failed:', err.message);
      return false;
    });
    
    console.log('Result:', result);
    console.log('Final URL:', page.url());
  } catch (err) {
    console.log('Error:', err.message);
  }
  
  await browser.close();
})();
