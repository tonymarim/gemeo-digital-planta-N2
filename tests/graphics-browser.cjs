const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/marim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1500,height:1060},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.GRAPHICS_URL||'http://127.0.0.1:4185/n2/';
 await page.goto(url);await page.waitForFunction(()=>document.querySelector('#connection')?.textContent.includes('Demo no navegador'));
 await page.waitForTimeout(1800);assert.equal(await page.locator('#sceneError').isVisible(),false);
 const size=()=>page.locator('#renderCanvas').evaluate(c=>({width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}));
 const high=await size();assert.ok(high.width>=high.cssWidth*1.95,'A tela DPR2 deve renderizar com resolução dupla.');
 await page.locator('#renderQuality').selectOption('economy');await page.waitForTimeout(700);const economy=await size();assert.ok(Math.abs(economy.width-economy.cssWidth)<=2);
 await page.locator('#renderQuality').selectOption('high');await page.waitForTimeout(700);
 // Exact camera-distance zoom measurement lives in environment-browser.cjs.
 // A pixel silhouette is unstable with room furniture, reflections and contact shadows.
 const box=await page.locator('#renderCanvas').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.wheel(0,-120);await page.waitForTimeout(500);
 await page.mouse.wheel(0,120);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>scrollY),0,'A roda sobre a planta não deve rolar a página.');
 await page.locator('[data-view="all"]').click();await page.waitForTimeout(500);fs.mkdirSync('reports',{recursive:true});await page.locator('#viewport').screenshot({path:'reports/graphics-high-dpi.png'});
 await page.locator('[data-tab="io"]').click();await page.locator('#mode').selectOption('manual');await page.locator('#ioStation').selectOption('montagem');await page.locator('#robotCommand').selectOption('7');await page.locator('#robotMove').click();await page.waitForTimeout(800);await page.locator('#viewport').screenshot({path:'reports/robot-sem-rastro.png'});
 await page.waitForTimeout(1800);await page.locator('#viewport').screenshot({path:'reports/robot-parado-sem-rastro.png'});
 await page.locator('#reset').click();await page.locator('#mode').selectOption('auto');
 await page.setViewportSize({width:390,height:844});await page.locator('[data-view="all"]').click();await page.waitForTimeout(700);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'reports/graphics-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);fs.writeFileSync('reports/graphics-browser.json',JSON.stringify({passed:true,url,high,economy,zoomVerification:'reports/environment-browser.json',errors,checks:['resolução DPR2','qualidade econômica em resolução nativa','roda não rola a página','robô em movimento e parado sem trajetória automática','layout móvel']},null,2));
 console.log('Gráficos aprovados: resolução alta, modo econômico e interface móvel; sem erros JavaScript.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
