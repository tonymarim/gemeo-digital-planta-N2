import assert from 'node:assert/strict';
import {Twin} from './model.mjs';
const recipe=n=>Array.from({length:n},(_,i)=>({color:['azul','vermelho','preto'][i],laminas:['azul','amarelo','verde']}));
const run=(t,predicate,max=40000)=>{for(let i=0;i<max&&!predicate();i++)t.tick(.05);assert.ok(predicate(),'Prazo do ensaio excedido');};
export function acceptance(robot){
 const results=[];
 const test=(name,fn)=>{try{const evidence=fn();results.push({name,passed:true,evidence});}catch(e){results.push({name,passed:false,error:e.message});}};
 for(const n of [1,2,3])test(`Receita ${n} andar(es): conservação de peças, inspeção e expedição`,()=>{
  const t=new Twin(robot);t.start(recipe(n));run(t,()=>t.status==='complete');const p=t.completed[0];
  assert.equal(p.bases.length,n);assert.equal(p.inserted.length,3*n);assert.equal(p.inspected,3*n);assert.equal(t.stock.filter(Boolean).length,28-n);
  assert.equal(Object.values(t.laminas).reduce((a,b)=>a+b,0),180-3*n);assert.equal(t.lids,11);assert.equal(t.rack.filter(Boolean).length,1);
  assert.equal(p.lid,true);assert.equal(p.rack,1);assert.equal(Object.values(t.q).some(Boolean),false);
  return {cycleSeconds:p.cycleSeconds,bases:n,inspections:p.inspected,robotCommands:t.events.filter(e=>e.code==='PHASE'&&e.message.includes('Robô')).length};
 });
 test('Emergência derruba saídas, congela movimentos e exige nova partida',()=>{
  const t=new Twin(robot);t.start(recipe(1));run(t,()=>t.phase.type==='stockTake');t.setFault('emergency',true);
  assert.equal(t.status,'emergency');assert.ok(Object.values(t.q).every(v=>!v));const p=t.phaseIndex,e=t.elapsed;
  for(let i=0;i<40;i++)t.tick(.05);assert.equal(t.phaseIndex,p);assert.equal(t.elapsed,e);assert.throws(()=>t.reset());
  t.setFault('emergency',false);t.reset();assert.equal(t.status,'paused');t.tick(.05);assert.equal(t.phaseIndex,p);t.start();run(t,()=>t.status==='complete');return 'Saídas zero; sem reinício automático; ciclo recuperado.';
 });
 test('Perda de vácuo gera timeout sem consumir base',()=>{const t=new Twin(robot);t.setFault('vacuum',true);t.start(recipe(1));run(t,()=>t.status==='fault');assert.equal(t.alarm.code,'TIMEOUT');assert.equal(t.stock.filter(Boolean).length,28);return t.alarm.message;});
 test('Esteira obstruída não entrega peça por temporização',()=>{const t=new Twin(robot);t.setFault('jam',true);t.start(recipe(1));run(t,()=>t.status==='fault');assert.equal(t.phase.type,'transport');assert.equal(t.alarm.code,'TIMEOUT');assert.equal(t.completed.length,0);return t.alarm.message;});
 test('Rejeição de visão impede encaixe e expedição',()=>{const t=new Twin(robot);t.setFault('camera',true);t.start(recipe(1));run(t,()=>t.status==='fault');assert.equal(t.alarm.code,'VISAO_NOK');assert.equal(t.order.inserted.length,0);assert.equal(t.completed.length,0);return t.alarm.message;});
 test('Garra não confirmada impede conclusão do comando',()=>{const t=new Twin(robot);t.setFault('gripper',true);t.start(recipe(1));run(t,()=>t.status==='fault');assert.equal(t.alarm.code,'GARRA');return t.alarm.message;});
 test('Força de sensor e liberação permitem repetir a etapa',()=>{const t=new Twin(robot);t.force('estoque.feedExtended',false);t.start(recipe(1));run(t,()=>t.status==='fault');assert.equal(t.phase.type,'feed');t.force('estoque.feedExtended',null);t.reset();t.start();run(t,()=>t.status==='complete');return 'Timeout observado; força removida; pedido concluído sem duplicar base.';});
 test('Modo manual: cilindro movimenta sensores e rejeita comandos opostos',()=>{const t=new Twin(robot);t.setMode('manual');t.setOutput('estoque.feedAdvance',true);for(let i=0;i<20;i++)t.tick(.05);assert.ok(t.signal('estoque.feedExtended'));assert.ok(!t.signal('estoque.feedRetracted'));assert.throws(()=>t.setOutput('estoque.feedReturn',true));return 'Fim de curso avançado ativo; recuado inativo; oposição bloqueada.';});
 test('Eixo Z estendido bloqueia deslocamento do pórtico',()=>{const t=new Twin(robot);t.setMode('manual');t.setOutput('processo.z',true);for(let i=0;i<20;i++)t.tick(.05);assert.throws(()=>t.moveAxis('processo',2));return 'Intertravamento de zona compartilhada confirmado.';});
 test('Limites documentados e códigos de robô validados',()=>{const t=new Twin(robot);t.setMode('manual');assert.throws(()=>t.moveAxis('estoque',30));assert.throws(()=>t.moveAxis('expedicao',15));assert.throws(()=>t.robotCommand(24));assert.equal(robot.commands.length,23);assert.ok(robot.commands.every(c=>c.moves.length>0));return 'Estoque 1–29, expedição 1–14, robô 1–23.';});
 test('Magazine cheio bloqueia pedido antes de consumir insumos',()=>{const t=new Twin(robot);t.rack.fill({id:'ocupado'});assert.throws(()=>t.start(recipe(1)));assert.equal(t.stock.filter(Boolean).length,28);return 'Pedido recusado; inventário preservado.';});
 test('Pedido sem matéria-prima é rejeitado atomicamente',()=>{const t=new Twin(robot);t.stock.fill('preto');assert.throws(()=>t.start(recipe(1)));assert.equal(t.order,null);assert.equal(t.plan.length,0);return 'Sem consumo parcial na validação da receita.';});
 test('Abortar mantém rastreabilidade dos materiais consumidos',()=>{const t=new Twin(robot);t.start(recipe(1));run(t,()=>t.phase.type==='transport');t.abort();assert.equal(t.scrapped.length,1);assert.equal(t.stock.filter(Boolean).length,27);assert.equal(t.completed.length,0);return 'Uma base consumida registrada no pedido abortado.';});
 test('Passo a passo avança exatamente uma etapa',()=>{const t=new Twin(robot);t.start(recipe(1));t.stop();const p=t.phaseIndex;t.action({type:'step'});assert.equal(t.phaseIndex,p+1);assert.equal(t.status,'paused');return 'Uma transição executada; modelo permanece pausado.';});
 test('Trigger de visão gera uma borda para cada lâmina',()=>{const t=new Twin(robot);t.start(recipe(3));run(t,()=>t.status==='complete');assert.equal(t.events.filter(e=>e.code==='CAMERA_TRIGGER').length,9);return 'Nove bordas de subida e nove inspeções.';});
 return {timestamp:new Date().toISOString(),scope:'Ensaios do modelo local isolado; não validam PLC, trajetória física ou segurança funcional.',passed:results.every(r=>r.passed),total:results.length,results};
}
