import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=new URL('../',import.meta.url);
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:960,height:420},deviceScaleFactor:2});
 await page.goto(new URL('docs/terminal/index.html',root).href);
 await page.evaluate(()=>{document.querySelector('#mode').textContent='Click to open interactive terminal ↗';});
 await page.screenshot({path:new URL('docs/terminal/preview.png',root).pathname});
 for(const [theme,width] of [['dark',1100],['light',1100],['dark',390]]){
  await page.setViewportSize({width,height:700});await page.reload();
  await page.locator('#command').fill('theme '+theme);await page.locator('#command').press('Enter');
  await page.locator('#command').fill('clear');await page.locator('#command').press('Enter');
  await page.locator('#command').fill('projects');await page.locator('#command').press('Enter');
  await page.screenshot({path:new URL(`../terminal-${theme}-${width}.png`,root).pathname,fullPage:true});
 }
 console.log('Captured README preview and desktop/light/mobile terminal screenshots.');
} finally {await browser.close();}
