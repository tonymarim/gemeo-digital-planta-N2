const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/marim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4186/tests/visual-fixture.html');await page.waitForFunction(()=>window.visualTest);await page.waitForTimeout(1800);
  const inspect=()=>page.evaluate(()=>window.visualTest.plant.inspect());const high=await inspect();assert.ok(high.graphics.environmentMeshes>100);assert.ok(high.graphics.meshCount>1000);
  const bounds=await page.locator('#plant').boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.wheel(0,-120);await page.waitForTimeout(1200);
  const zoomChange=high.graphics.cameraRadius/(await inspect()).graphics.cameraRadius-1;assert.ok(zoomChange>0&&zoomChange<.08,'Aproximação gradual inferior a 8% por rolagem: '+zoomChange);
  await page.evaluate(()=>window.visualTest.plant.view('all'));
  await page.locator('#plant').screenshot({path:'reports/laboratorio-planta-geral.png'});
  await page.evaluate(()=>window.visualTest.plant.view('room'));await page.waitForTimeout(500);await page.locator('#plant').screenshot({path:'reports/laboratorio-ambiente.png'});
  await page.evaluate(()=>window.visualTest.plant.environment(false));const hidden=await inspect();assert.equal(hidden.graphics.environmentMeshes,1);
  await page.evaluate(()=>window.visualTest.plant.environment(true));assert.ok((await inspect()).graphics.environmentMeshes>100);
  await page.evaluate(()=>window.visualTest.plant.quality('economy'));await page.waitForTimeout(300);assert.equal((await inspect()).graphics.quality,'economy');
  await page.evaluate(()=>{window.visualTest.plant.quality('high');window.visualTest.plant.view('estoque');});await page.waitForTimeout(400);await page.locator('#plant').screenshot({path:'reports/laboratorio-estoque.png'});
  for(const view of ['processo','montagem','expedicao','top','front']){await page.evaluate(view=>window.visualTest.plant.view(view),view);await page.waitForTimeout(100);assert.ok((await inspect()).graphics.camera.every(Number.isFinite));}
  await page.mouse.move(720,400);await page.mouse.down();await page.mouse.move(1290,400,{steps:20});await page.mouse.up();await page.waitForTimeout(500);
  await page.locator('#plant').screenshot({path:'reports/laboratorio-orbita.png'});assert.deepEqual(errors,[]);
  fs.writeFileSync('reports/environment-browser.json',JSON.stringify({passed:true,errors,high:high.graphics,zoomChangePercent:+(zoomChange*100).toFixed(2),checks:['zoom medido pela distância da câmera','sala com geometria própria','vista ampla','ocultar e reexibir ambiente','troca Alta/Econômica','vistas de todas as estações','órbita com recorte arquitetônico','capturas da cena real']},null,2));
  console.log('Ambiente aprovado: vistas, recorte, modos de qualidade e ausência de erros JavaScript.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
