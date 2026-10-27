import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Twin} from '../model.mjs';
import {geometry,visualFrame,stockPoint,rackPoint} from '../web/visual-state.mjs';
const robot=JSON.parse(readFileSync(new URL('../data/robot.json',import.meta.url)));
const recipe=n=>Array.from({length:n},(_,i)=>({color:['azul','vermelho','preto'][i],laminas:[['azul','vermelho','preto'],['branco','amarelo','verde'],['verde','azul','branco']][i]}));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function advance(t,predicate){for(let i=0;i<25000&&!predicate();i++)t.tick(.01);assert.ok(predicate(),'Etapa não alcançada.');}
for(const n of [1,2,3])test(`Continuidade e conservação visual durante todo o pedido de ${n} andar(es)`,()=>{
 const t=new Twin(robot);t.start(recipe(n));const seen=new Set();let previous=new Map(),lastLamina=null;
 for(let k=0;k<30000&&t.order;k++){
  const s=t.state(),v=visualFrame(s),p=s.phase;
  assert.equal(new Set(v.bases.map(b=>b.floor)).size,v.bases.length,'Base duplicada.');
  assert.ok(v.bases.length>=t.order.bases.length,'Base consumida desapareceu.');
  for(const b of v.bases){
   const old=previous.get(b.floor);if(old)assert.ok(distance(old,b.position)<.08,`${p.type}: salto na base ${b.floor}: ${distance(old,b.position)}`);
   if(['stock','expedition'].includes(b.owner)){assert.equal(b.position[0],v.anchors[b.owner].position[0]);assert.ok(Math.abs(b.position[1]-v.anchors[b.owner].position[1]-geometry.blockBottom-b.floor*(b.owner==='expedition'?geometry.floorPitch:0))<1e-9);}
   if(b.owner==='robot'){assert.ok(b.local,'Peça sem vínculo local com a garra.');seen.add('garra');}
   if(b.owner==='expedition')seen.add('elevador');
  }
  previous=new Map(v.bases.map(b=>[b.floor,b.position]));
  if(['laminaDeliver','inspect'].includes(p.type)||p.insert||p.type==='robot'&&p.cmd>=4&&p.cmd<=6)assert.ok(v.lamina,'Lâmina desapareceu durante transferência/inspeção/inserção.');
  if(v.lamina){
   const key=p.floor+':'+p.lam;
   if(lastLamina?.key===key)assert.ok(distance(lastLamina.position,v.lamina.position)<.08,`${p.type}: salto na lâmina ${key}`);
   lastLamina={key,position:v.lamina.position};
   if(v.lamina.owner==='robot')assert.deepEqual(v.lamina.local,[0,-geometry.gripOffset,0]);
  }else lastLamina=null;
  if(p.type==='expHome'){assert.equal(t.order.location,'rack');assert.ok(v.bases.every(b=>b.owner==='rack'));seen.add('retorno');}
  t.tick(.01);
 }
 assert.equal(t.status,'complete');assert.equal(t.axes.expedicao.position,13);assert.deepEqual([...seen].sort(),['elevador','garra','retorno']);
});
test('Lâmina é capturada uma vez, segue a ventosa, passa à garra e chega ao bloco',()=>{
 const t=new Twin(robot);t.start(recipe(1));advance(t,()=>t.phase.type==='laminaVacuum'&&t.elapsed>t.phase.duration*.6);
 let v=visualFrame(t.state());assert.ok(v.hideLamina);assert.equal(v.lamina.owner,'process');
 advance(t,()=>t.phase.type==='inspect');v=visualFrame(t.state());assert.equal(v.lamina.owner,'robot');
 advance(t,()=>t.phase.insert&&t.elapsed>t.phase.duration*.85);v=visualFrame(t.state());assert.equal(v.lamina.owner,'fixture');
});
test('Pausa e retomada não reiniciam o deslocamento do garfo',()=>{
 for(const type of ['stockDeliver','expStore']){
  const t=new Twin(robot);t.start(recipe(1));advance(t,()=>t.phase.type===type&&t.elapsed>.6);
  const before=visualFrame(t.state());t.stop();t.tick(.1);assert.deepEqual(visualFrame(t.state()).bases,before.bases);
  t.start();assert.deepEqual(visualFrame(t.state()).bases,before.bases);t.tick(.01);
  assert.ok(distance(visualFrame(t.state()).bases[0].position,before.bases[0].position)<.03);
 }
});
test('Base não sai da prateleira quando a confirmação de vácuo falha',()=>{
 const t=new Twin(robot);t.setFault('vacuum',true);t.start(recipe(1));advance(t,()=>t.status==='fault');
 const v=visualFrame(t.state());assert.equal(v.hideStock,null);assert.equal(v.bases.length,0);assert.equal(t.stock.filter(Boolean).length,28);
});
test('Apoios e empilhamento têm contato sem folga vertical',()=>{
 assert.equal(geometry.floorPitch,.026+geometry.blockBottom);
 for(let i=0;i<28;i++)assert.ok(Math.abs((stockPoint(i)[1]-.030+.006)-(stockPoint(i)[1]-geometry.blockBottom))<1e-9);
 for(let i=0;i<12;i++)assert.ok(Math.abs((1.405-Math.floor(i/4)*.18+.007)-(rackPoint(i)[1]-geometry.blockBottom))<1e-9);
});
