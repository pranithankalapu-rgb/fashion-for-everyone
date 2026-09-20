import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('./presentation_assets/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser with chrome at:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 }
  });

  try {
    const page = await browser.newPage();

    // 1. Customer Home / Explore / AI Engine
    console.log('Navigating to Customer Home ...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_customer_home.png') });

    // 2. Open AI Stylist Drawer
    console.log('Opening AI Stylist Drawer ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const stylist = btns.find(b => b.textContent?.includes('AI Stylist Chat'));
      if (stylist) stylist.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_ai_stylist_drawer.png') });

    // Close Stylist Drawer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 3. Color Voting
    console.log('Capturing Color Voting ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cv = btns.find(b => b.textContent?.includes('Color Voting') || b.textContent?.includes('Color Arena'));
      if (cv) cv.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_color_voting.png') });

    // 4. Designer Showcase
    console.log('Capturing Designer Showcase ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const ds = btns.find(b => b.textContent?.includes('Designer Showcase'));
      if (ds) ds.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_designer_showcase.png') });

    // 5. Stock Locator / Products
    console.log('Capturing Stock Locator ...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sl = btns.find(b => b.textContent?.includes('Stock') || b.textContent?.includes('Stores') || b.textContent?.includes('Catalog'));
      if (sl) sl.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_stock_locator.png') });

    // Open Product Detail Modal
    console.log('Opening Product Detail Modal ...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-card, [role="button"], div.group'));
      const productCard = cards.find(c => c.querySelector('img') && c.textContent?.includes('$'));
      if (productCard) {
        const btn = productCard.querySelector('button') || productCard;
        btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05b_product_modal.png') });

    // Close product modal if open
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const close = closeBtns.find(b => b.querySelector('svg.lucide-x'));
      if (close) close.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 6. Switch Role to Retailer
    console.log('Switching to Retailer Dashboard ...');
    await page.evaluate(() => {
      const retailerBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.toLowerCase().includes('retailer'));
      if (retailerBtn) retailerBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_retailer_dashboard.png') });

    // 7. Retailer Orders
    console.log('Capturing Retailer Orders ...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const ordTab = tabs.find(b => b.textContent?.includes('Orders'));
      if (ordTab) ordTab.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_retailer_orders.png') });

    // 8. Retailer Inventory & Stock Management
    console.log('Capturing Retailer Inventory ...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const invTab = tabs.find(b => b.textContent?.includes('Inventory') || b.textContent?.includes('Stock'));
      if (invTab) invTab.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07b_retailer_inventory.png') });

    // 9. Admin Login & Auth
    console.log('Navigating to Admin Portal ...');
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_admin_login.png') });

    // Log in via Admin Form
    console.log('Logging in as Admin ...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const emailInput = inputs.find(i => i.placeholder?.includes('admin@') || i.type === 'text');
      const passInput = inputs.find(i => i.type === 'password');
      if (emailInput) {
        emailInput.value = 'admin@fashionforeveryone.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (passInput) {
        passInput.value = 'adminpassword123';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submit = document.querySelector('button[type="submit"]');
      if (submit) submit.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // 10. Admin Executive Dashboard
    console.log('Capturing Admin Executive Dashboard ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_admin_dashboard.png') });

    // 11. Admin Orders View
    console.log('Capturing Admin Orders View ...');
    await page.goto('http://localhost:5173/admin/orders', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_admin_orders.png') });

    // 12. Admin Users View
    console.log('Capturing Admin Users View ...');
    await page.goto('http://localhost:5173/admin/users', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11_admin_users.png') });

    // 13. Admin Retailers & Designers
    console.log('Capturing Admin Retailers View ...');
    await page.goto('http://localhost:5173/admin/retailers', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12_admin_retailers.png') });

    // 14. Mobile Screen Viewport (Simulate mobile experience for Slide 17)
    console.log('Capturing Mobile responsive screens ...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '13_mobile_home.png') });

    // Mobile AI Stylist
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const stylist = btns.find(b => b.textContent?.includes('AI Stylist Chat'));
      if (stylist) stylist.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '14_mobile_ai_stylist.png') });

    console.log('✅ ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
