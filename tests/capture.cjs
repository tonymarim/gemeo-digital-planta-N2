const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/marim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 const page=await b.newPage({viewport:{width:1500,height:1060}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('ativo'));await page.waitForTimeout(1200);
 if(await page.locator('#sceneError').isVisible())throw Error(await page.locator('#sceneError').innerText());
 await page.screenshot({path:'reports/visao-geral.png',fullPage:true});await page.locator('#viewport').screenshot({path:'reports/planta-3d.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-view="all"]').click();await page.waitForTimeout(300);await page.screenshot({path:'reports/mobile.png',fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Enquadramento desktop e móvel verificados; sem erros JavaScript.');await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
