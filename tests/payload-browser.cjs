const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/marim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const close=(a,b)=>assert.ok(Math.hypot(...a.map((v,i)=>v-b[i]))<.00001,JSON.stringify({a,b}));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1200,height:650},deviceScaleFactor:1.5});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4186/tests/visual-fixture.html');await page.waitForFunction(()=>window.visualTest);await page.waitForTimeout(1000);
 const initial=await page.evaluate(()=>window.visualTest.plant.inspect());assert.ok(initial.contacts.stockMaxGap<.00001);assert.ok(initial.contacts.laminaMaxGap<.00001);
 await page.screenshot({path:'reports/pecas-nos-magazines.png'});
 await page.evaluate(()=>window.visualTest.model.start([{color:'azul',laminas:['azul','vermelho','preto']},{color:'vermelho',laminas:['branco','amarelo','verde']},{color:'preto',laminas:['verde','azul','branco']}]));
 const samples=[];
 const seek=async(spec)=>{
  const result=await page.evaluate(spec=>{const {model,plant}=window.visualTest;let found=false;for(let i=0;i<25000;i++){const p=model.phase;if(p?.type===spec.type&&(spec.cmd===undefined||p.cmd===spec.cmd)&&model.elapsed>=p.duration*spec.progress){found=true;break;}if(!model.order)break;model.tick(.01);}if(!found)throw Error('Etapa não alcançada: '+JSON.stringify(spec));plant.update(model.state());return plant.inspect();},spec);
  for(const b of result.bases){const expected=result.frame.bases.find(x=>x.floor===Number(b.name.match(/\d+$/)[0]));assert.ok(expected);close(b.position,expected.position);}
  if(result.lamina)close(result.lamina.position,result.frame.lamina.position);
  samples.push({stage:spec,bases:result.bases,lamina:result.lamina,lid:result.lid,contacts:result.contacts});return result;
 };
 let r=await seek({type:'stockDeliver',progress:.5});assert.equal(r.bases[0].parent,'garfo estoque');assert.ok(Math.abs(r.bases[0].position[1]-.024-r.supportTop.stock)<.00001);
 r=await seek({type:'robot',cmd:1,progress:.5});assert.equal(r.bases[0].parent,'SCHUNK EGH');await page.evaluate(()=>window.visualTest.plant.view('montagem'));await page.screenshot({path:'reports/base-presa-na-garra.png'});
 r=await seek({type:'laminaDeliver',progress:.5});assert.equal(r.lamina.parent,'ventosa processo');
 r=await seek({type:'inspect',progress:.5});assert.equal(r.lamina.parent,'SCHUNK EGH');await page.screenshot({path:'reports/lamina-presa-na-garra.png'});
 r=await seek({type:'robot',cmd:9,progress:.6});assert.equal(r.lamina.parent,'SCHUNK EGH');
 r=await seek({type:'robot',cmd:18,progress:.5});assert.equal(r.lid.parent,'SCHUNK EGH');
 r=await seek({type:'robot',cmd:20,progress:.68});assert.equal(r.bases.length,3);assert.equal(r.bases.filter(b=>b.parent==='SCHUNK EGH').length,1);
 r=await seek({type:'robot',cmd:22,progress:.5});assert.ok(r.bases.every(b=>b.parent==='SCHUNK EGH'));await page.screenshot({path:'reports/montagem-presa-na-garra.png'});
 r=await seek({type:'expStore',progress:.55});assert.ok(r.bases.every(b=>b.parent==='garfo expedição'));assert.ok(Math.abs(r.bases[0].position[1]-.024-r.supportTop.expedition)<.00001);await page.evaluate(()=>window.visualTest.plant.view('expedicao'));await page.screenshot({path:'reports/montagem-apoiada-no-elevador.png'});
 r=await seek({type:'expHome',progress:.5});assert.ok(r.bases.every(b=>b.owner==='rack'&&b.parent===null));
 const done=await page.evaluate(()=>{const {model,plant}=window.visualTest;while(model.order)model.tick(.01);plant.update(model.state());return plant.inspect();});assert.equal(done.rack.length,3);assert.equal(done.bases.length,0);close(done.rack[0].position,[.82,1.436,.26]);
 assert.deepEqual(errors,[]);fs.writeFileSync('reports/payload-browser.json',JSON.stringify({passed:true,errors,initialContacts:initial.contacts,samples},null,2));console.log('Renderização aprovada: bases e lâminas apoiadas, captura sem desaparecimento e montagem solidária ao garfo.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
