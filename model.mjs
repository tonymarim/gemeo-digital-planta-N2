import {io,stations,colors} from './data/catalog.mjs';

export class Twin {
 constructor(robot){
  this.robotData=robot; this.time=0; this.speed=1; this.mode='auto'; this.status='ready'; this.phaseIndex=-1; this.plan=[]; this.order=null;
  this.stock=Array.from({length:28},(_,i)=>['azul','vermelho','preto'][i%3]); this.rack=Array(12).fill(null);
  this.laminas=Object.fromEntries(Object.keys(colors).map(c=>[c,30])); this.lids=12; this.completed=[]; this.scrapped=[];
  this.q={}; this.inputs={}; this.forces={}; this.faults={emergency:false,air:false,vacuum:false,jam:false,camera:false,gripper:false};
  this.axes={estoque:{position:29,target:29,busy:false,t:0},processo:{position:8,target:8,busy:false,t:0},expedicao:{position:13,target:13,busy:false,t:0}};
  this.motion={}; this.robot={command:0,busy:false,progress:0,ready:true,frame:0}; this.elapsed=0; this.alarm=null; this.events=[]; this.sequence=0;
  this.config={motionSeconds:1.5,transportSeconds:4,pneumaticSeconds:.45,timeoutSeconds:5,robotSeconds:2};
  this.clearOutputs(); this.updateSensors(0); this.log('INIT','Modelo local iniciado; sem conexão com equipamento.');
 }
 log(code,message){this.events.push({seq:++this.sequence,t:+this.time.toFixed(3),code,message,phase:this.phaseIndex}); if(this.events.length>4000)this.events.shift();}
 clearOutputs(){for(const row of io.filter(r=>r.dir==='Q'))this.q[row.id]=false;}
 signal(id){return Object.hasOwn(this.forces,id)?this.forces[id]:!!this.inputs[id];}
 get phase(){return this.plan[this.phaseIndex]||null;}
 ensureStopped(){if(['running','manual'].includes(this.status)||this.order)throw Error('Pare e aborte o pedido antes de alterar o modo ou o inventário.');}
 gate(){return !this.faults.emergency&&!this.faults.air&&stations.every(s=>this.signal(s.id+'.safe'));}
 setFault(name,value){
  if(!Object.hasOwn(this.faults,name)||typeof value!=='boolean')throw Error('Falha inválida.');
  this.faults[name]=value;this.log('FAULT',`${name}: ${value?'injetada':'removida'}`);
  this.updateSensors(0);
  if(value&&['emergency','air'].includes(name))this.trip(name==='emergency'?'EMERGÊNCIA':'SEM_AR',name==='emergency'?'Emergência virtual acionada.':'Pressão pneumática indisponível.');
 }
 trip(code,message){if(this.alarm?.code===code)return; this.alarm={code,message,t:this.time};this.status=code==='EMERGÊNCIA'?'emergency':'fault';this.clearOutputs();this.robot.ready=false;this.log(code,message);}
 reset(){
  if(!this.gate())throw Error('Remova a emergência, falta de ar e forças de segurança antes do rearme.');
  if(Object.values(this.faults).some(Boolean))throw Error('Remova as falhas injetadas antes do rearme.');
  this.alarm=null;this.clearOutputs(); this.status=this.order?'paused':'ready'; this.robot.busy=false;this.robot.ready=true;
  if(!this.order)for(const a of Object.values(this.axes)){a.busy=false;a.target=a.position;a.t=0;}
  this.elapsed=0;this.robot.progress=0; this.log('RESET','Rearmado; nova partida necessária. Etapa corrente será repetida.');
 }
 stop(){if(this.status==='running'||this.status==='manual'){this.status='paused';this.clearOutputs();this.log('STOP','Movimento pausado. Retomada exige comando explícito.');}}
 setMode(mode){if(!['auto','manual'].includes(mode))throw Error('Modo inválido.');this.ensureStopped();if(this.alarm)throw Error('Rearme antes de mudar o modo.');this.mode=mode;this.clearOutputs();for(const a of Object.values(this.axes)){a.busy=false;a.target=a.position;a.t=0;}this.robot.busy=false;this.robot.ready=true;this.status='ready';this.log('MODE',mode);}
 force(id,value){const row=io.find(r=>r.id===id&&r.dir==='I');if(!row)throw Error('Entrada desconhecida.');if(value===null)delete this.forces[id];else if(typeof value==='boolean')this.forces[id]=value;else throw Error('Força deve ser booleana ou null.');this.log('FORCE',`${id} = ${value===null?'automático':value}`);if(!this.gate())this.trip('INTERTRAVAMENTO','Entrada de segurança não confirmada.');}
 setOutput(id,value){
  if(this.mode!=='manual'||this.alarm||this.status==='paused'||this.order)throw Error('Saídas exigem modo manual rearmado e sem pedido.');
  if(!this.gate())throw Error('Permissivos não confirmados.');
  if(!io.some(r=>r.id===id&&r.dir==='Q')||typeof value!=='boolean')throw Error('Saída inválida.');
  const station=id.split('.')[0];
  if(value&&id.endsWith('feedAdvance')&&this.q[station+'.feedReturn']||value&&id.endsWith('feedReturn')&&this.q[station+'.feedAdvance'])throw Error('Avanço e recuo simultâneos bloqueados.');
  if(value&&id==='processo.z'&&(this.axes.processo.busy||this.robot.busy))throw Error('Zona compartilhada ocupada; recolha Z e aguarde o robô/eixo.');
  this.q[id]=value;this.status='manual';this.log('OUTPUT',`${id} = ${value}`);
 }
 moveAxis(station,target){
  if(this.mode!=='manual'||this.alarm||this.order||this.status==='paused')throw Error('Movimento exige modo manual rearmado.');
  if(!this.gate())throw Error('Permissivos não confirmados.');
  const max={estoque:29,processo:14,expedicao:14}[station];
  if(!Number.isInteger(target)||target<1||target>max)throw Error('Posição fora dos limites documentados.');
  if(this.axes[station].busy)throw Error('Eixo ocupado.');
  if(station==='processo'&&(!this.signal('processo.zRetracted')||this.robot.busy))throw Error('Recolha o eixo Z e aguarde o robô.');
  this.axes[station]={...this.axes[station],target,busy:true,t:0};this.status='manual';this.log('AXIS',`${station} → ${target}`);
 }
 robotCommand(command){
  if(this.mode!=='manual'||this.alarm||this.order||this.status==='paused')throw Error('Robô exige modo manual rearmado.');
  if(!this.gate()||this.robot.busy||this.axes.processo.busy||!this.signal('processo.zRetracted'))throw Error('Robô sem permissivo ou zona de processo ocupada.');
  if(!Number.isInteger(command)||!this.robotData.commands.some(c=>c.id===command))throw Error('Comando inexistente no Smart40.script.');
  this.robot={command,busy:true,ready:false,progress:0,frame:0};this.status='manual';this.log('ROBOT',`Comando ${command} iniciado (reprodução visual).`);
 }
 refill(){this.ensureStopped();this.stock=Array.from({length:28},(_,i)=>['azul','vermelho','preto'][i%3]);this.laminas=Object.fromEntries(Object.keys(colors).map(c=>[c,30]));this.lids=12;this.log('REFILL','Estoque inicial didático: 10 azuis, 9 vermelhos, 9 pretos; 30 lâminas/cor; 12 tampas.');}
 clearRack(){this.ensureStopped();this.rack.fill(null);this.log('RACK','Produtos retirados do magazine; histórico preservado.');}
 configure(config){this.ensureStopped();for(const [k,v] of Object.entries(config)){if(!Object.hasOwn(this.config,k)||!Number.isFinite(v)||v<.1||v>120)throw Error('Parâmetro inválido (0,1–120 s).');}Object.assign(this.config,config);this.log('CONFIG','Tempos do modelo alterados.');}
 makePlan(recipe){
  const p=[],stock=[...this.stock],rack=this.rack.indexOf(null); if(rack<0)throw Error('Magazine de expedição cheio.');
  const needed={};for(const f of recipe)for(const c of f.laminas)needed[c]=(needed[c]||0)+1;
  for(const [c,n] of Object.entries(needed))if(this.laminas[c]<n)throw Error('Lâminas insuficientes: '+c);
  if(this.lids<1)throw Error('Sem tampas.');
  const add=(type,label,station,extra={})=>p.push({type,label,station,duration:this.config.motionSeconds,...extra});
  const rob=(cmd,label,extra)=>add('robot',label,'montagem',{cmd,duration:this.config.robotSeconds,...extra});
  recipe.forEach((floor,f)=>{
   const cell=stock.indexOf(floor.color);if(cell<0)throw Error('Estoque insuficiente: '+floor.color);stock[cell]=null;
   const slot=recipe.length===1?3:recipe.length===2?[1,3][f]:f+1;
   add('stock','Buscar base '+(f+1)+' · posição '+(cell+1),'estoque',{cell,floor:f,slot,color:floor.color,target:cell+1});
   add('stockTake','Capturar base por vácuo','estoque',{cell,floor:f,slot,color:floor.color,required:['estoque.vacuumOK','estoque.gripClosed']});
   add('stockDeliver','Entregar base ao alimentador · posição 29','estoque',{floor:f,slot,target:29});
   add('feed','Avançar alimentador do estoque','estoque',{floor:f,slot,required:['estoque.feedExtended']});
   add('transport','Transportar base até RFID da montagem','montagem',{floor:f,slot,duration:this.config.transportSeconds,required:['montagem.rfid']});
   rob(slot,'Robô · base na posição '+slot,{floor:f,slot});
   floor.laminas.forEach((color,lam)=>{
    add('laminaPick',`Separar lâmina ${lam+1} · ${color}`,'processo',{floor:f,slot,lam,color,target:Object.keys(colors).indexOf(color)+1});
    add('laminaVacuum','Capturar lâmina com vácuo','processo',{floor:f,slot,lam,color,required:['processo.vacuumOK','processo.zExtended']});
    add('laminaDeliver',`Disponibilizar lâmina ${lam+1} · depósito ${9+lam}`,'processo',{floor:f,slot,lam,color,target:9+lam});
    rob(4+lam,'Robô · pegar lâmina '+(lam+1),{floor:f,slot,lam,color});
    add('inspect','Inspecionar cor da lâmina · trigger por borda','montagem',{floor:f,slot,lam,color,cmd:7,duration:this.config.robotSeconds,required:['montagem.cameraOK']});
    rob(9+(slot-1)*3+[0,2,1][lam],`Encaixar lâmina ${lam+1} no bloco ${slot}`,{floor:f,slot,lam,color,insert:true});
   });
  });
  rob(18,'Aplicar tampa no bloco da posição 3',{lid:true,slot:3});
  if(recipe.length>1)rob(recipe.length===2?19:20,`Empilhar ${recipe.length} andares`,{stack:true});
  rob(recipe.length===1?21:22,'Retirar produto montado para a esteira',{unload:true});
  add('transportFinal','Transportar produto até RFID de expedição','expedicao',{duration:this.config.transportSeconds,required:['expedicao.rfid']});
  add('expPick','Coletar produto · posição 14','expedicao',{target:14,required:['expedicao.vacuumOK','expedicao.feedExtended']});
  add('expStore',`Armazenar produto · posição ${rack+1}`,'expedicao',{target:rack+1,rack});
  add('expHome','Recolher elevador · Home 13','expedicao',{target:13,rack});
  return p;
 }
 start(recipe){
  if(this.mode!=='auto')throw Error('Selecione o modo automático.');
  if(this.alarm||!this.gate())throw Error('Rearme e confirme os permissivos antes da partida.');
  if(this.status==='running')throw Error('Ciclo já em andamento.');
  if(this.order){if(this.status!=='paused')throw Error('Pedido ativo.');this.status='running';this.applyPhase(true);this.log('RESUME','Ciclo retomado.');return;}
  if(!Array.isArray(recipe)||recipe.length<1||recipe.length>3||recipe.some(f=>!['azul','vermelho','preto'].includes(f.color)||!Array.isArray(f.laminas)||f.laminas.length!==3||f.laminas.some(c=>!Object.hasOwn(colors,c))))throw Error('Receita inválida: 1–3 andares, base azul/vermelha/preta e três lâminas por andar.');
  const plan=this.makePlan(recipe); this.plan=plan; this.phaseIndex=0;this.elapsed=0;
  this.order={id:'N2-'+String(this.completed.length+this.scrapped.length+1).padStart(4,'0'),recipe:structuredClone(recipe),started:this.time,bases:[],inserted:[],consumedLaminas:0,inspected:0,lid:false,location:'estoque'};
  this.status='running';this.log('START','Pedido '+this.order.id+' iniciado.');this.applyPhase();
 }
 abort(){if(this.order){this.scrapped.push({...this.order,aborted:this.time});this.log('ABORT','Pedido abortado. Insumos já consumidos registrados como refugo; não retornam ao estoque.');}this.order=null;this.plan=[];this.phaseIndex=-1;this.elapsed=0;this.clearOutputs();this.robot.busy=false;this.robot.ready=!this.alarm;for(const a of Object.values(this.axes))a.busy=false;this.status=this.alarm?'fault':'ready';}
 applyPhase(resume=false){
  const p=this.phase;if(!p)return;this.clearOutputs();this.q[p.station+'.status']=true;
  const q=(s,...keys)=>keys.forEach(k=>this.q[s+'.'+k]=true);
  if(p.target&&this.axes[p.station]&&!resume)this.axes[p.station]={...this.axes[p.station],target:p.target,busy:true,t:0};
  if(p.type==='stockTake')q('estoque','vacuum','grip','position');
  if(p.type==='stockDeliver')q('estoque','vacuum','grip');
  if(p.type==='feed')q('estoque','feedAdvance');
  if(p.type==='transport')for(const s of ['estoque','processo','montagem'])q(s,'belt1');
  if(p.type==='laminaVacuum')q('processo','z','vacuum');
  if(p.type==='laminaDeliver')q('processo','vacuum');
  if(p.type==='inspect')q('montagem','cameraTrigger');
  if(p.type==='transportFinal')for(const s of ['montagem','expedicao'])q(s,'belt1');
  if(p.type==='expPick')q('expedicao','feedAdvance','vacuum');
  if(p.type==='expStore')q('expedicao','vacuum');
  if(p.cmd){if(!resume)this.robot={command:p.cmd,busy:true,ready:false,progress:0,frame:0};}else this.robot={...this.robot,busy:false,ready:true};
  this.log('PHASE',`${this.phaseIndex+1}/${this.plan.length} · ${p.label}`);
 }
 finishPhase(){
  const p=this.phase,o=this.order;if(!p||!o)return;
  if(p.type==='stockTake'){this.stock[p.cell]=null;o.bases.push({floor:p.floor,color:p.color,slot:p.slot,cell:p.cell});o.location='estoque';}
  if(p.type==='transport')o.location='montagem';
  if(p.type==='robot'&&p.cmd>=1&&p.cmd<=3){const base=o.bases.find(b=>b.floor===p.floor);if(base)base.placed=true;}
  if(p.type==='laminaVacuum'){this.laminas[p.color]--;o.consumedLaminas++;}
  if(p.type==='inspect')o.inspected++;
  if(p.insert)o.inserted.push({floor:p.floor,lam:p.lam,color:p.color});
  if(p.lid){this.lids--;o.lid=true;}
  if(p.stack)o.stacked=true;
  if(p.unload)o.location='esteira';
  if(p.type==='transportFinal')o.location='expedicao';
  if(p.type==='expStore'){o.storedRack=p.rack;o.location='rack';}
  if(p.type==='expHome'){
   const done={...structuredClone(o),finished:this.time,cycleSeconds:+(this.time-o.started).toFixed(2),rack:p.rack+1};
   this.rack[p.rack]=done;this.completed.push(done);this.log('COMPLETE',`${o.id} armazenado na posição ${p.rack+1}. ${o.inspected} lâminas inspecionadas.`);
   this.order=null;this.status='complete';this.clearOutputs();this.robot.busy=false;this.robot.ready=true;this.elapsed=0;return;
  }
  this.phaseIndex++;this.elapsed=0;this.applyPhase();
 }
 updateSensors(dt){
  const movable=['running','manual'].includes(this.status)&&!this.alarm&&!this.faults.emergency&&!this.faults.air;
  const approach=(key,target)=>{const a=this.motion[key]??0;this.motion[key]=movable?a+Math.sign(target-a)*Math.min(Math.abs(target-a),dt/this.config.pneumaticSeconds):a;return this.motion[key];};
  for(const s of stations){
   const id=s.id;const input=(key,value)=>this.inputs[id+'.'+key]=value;const q=key=>!!this.q[id+'.'+key];
   input('safe',!this.faults.emergency);input('auto',this.mode==='auto');input('start',this.status==='running');input('stop',this.status==='paused');
   const feed=approach(id+'.feed',q('feedAdvance')?1:q('feedReturn')?0:0);
   input('feedExtended',feed>.99);input('feedRetracted',feed<.01);input('feedDelivery',feed>.45&&feed<.55);
   const grip=approach(id+'.grip',q('grip')?1:0);input('gripOpen',grip<.01);input('gripClosed',grip>.99);
   const pos=approach(id+'.position',q('position')?1:0);input('positionExtended',pos>.99);input('positionRetracted',pos<.01);
   const vacuum=approach(id+'.vacuum',q('vacuum')?1:0);input('vacuumOK',vacuum>.95&&!this.faults.vacuum&&!this.faults.air);
   input('tableVacuumOK',q('tableVacuum')&&!this.faults.vacuum&&!this.faults.air);
   const z=approach(id+'.z',q('z')?1:0);input('zExtended',z>.99);input('zRetracted',z<.01);
   const a=this.axes[id];if(a){input('axisBusy',a.busy);input('axisInPosition',!a.busy);}
   input('rfid',!!this.order&&this.phase?.station===id&&this.elapsed>=this.phase.duration*.9&&!this.faults.jam);
  }
  const trigger=!!this.q['montagem.cameraTrigger'];
  if(trigger&&!this.lastTrigger){this.cameraAge=0;this.inputs['montagem.cameraOK']=false;this.log('CAMERA_TRIGGER','Borda de subida do trigger.');}
  if(trigger&&movable){this.cameraAge=(this.cameraAge||0)+dt;if(this.cameraAge>=.3)this.inputs['montagem.cameraOK']=!this.faults.camera;}
  this.lastTrigger=trigger;
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0||dt>.25)throw Error('Passo de integração deve estar em (0, 0,25] s.');
  this.time+=dt;
  if(['running','manual'].includes(this.status)&&!this.gate())this.trip('INTERTRAVAMENTO','Permissivo de segurança ou ar perdido.');
  if(['running','manual'].includes(this.status)){
   for(const a of Object.values(this.axes))if(a.busy){a.t+=dt;if(a.t>=this.config.motionSeconds){a.position=a.target;a.busy=false;}}
   if(this.status==='manual'&&this.robot.busy){if(this.faults.gripper)this.trip('GARRA','Garra sem confirmação.');else{this.robot.progress=Math.min(1,this.robot.progress+dt/this.config.robotSeconds);if(this.robot.progress>=1){this.robot.busy=false;this.robot.ready=true;this.log('ROBOT_DONE','Comando visual concluído.');}}}
   if(this.status==='running')this.elapsed+=dt;
  }
  this.updateSensors(dt);
  if(this.status!=='running')return;
  const p=this.phase;if(!p)return;
  if(p.cmd){this.robot.progress=Math.min(1,this.elapsed/p.duration);if(this.faults.gripper){this.trip('GARRA','Garra sem confirmação; movimento bloqueado.');return;}}
  if(this.elapsed>=p.duration){
   if(p.type==='inspect'&&this.faults.camera){this.trip('VISAO_NOK','Lâmina rejeitada na inspeção. Remova a falha e rearme para repetir a inspeção, ou aborte.');return;}
   const missing=(p.required||[]).filter(id=>!this.signal(id));
   if(missing.length){if(this.elapsed>=p.duration+this.config.timeoutSeconds)this.trip('TIMEOUT','Sem confirmação: '+missing.join(', '));return;}
   this.finishPhase();
  }
 }
 state(){return {time:this.time,speed:this.speed,mode:this.mode,status:this.status,phase:this.phase,phaseIndex:this.phaseIndex,phaseCount:this.plan.length,elapsed:this.elapsed,order:this.order,stock:this.stock,rack:this.rack,laminas:this.laminas,lids:this.lids,completed:this.completed,scrapped:this.scrapped,q:this.q,inputs:Object.fromEntries(io.filter(r=>r.dir==='I').map(r=>[r.id,this.signal(r.id)])),rawInputs:this.inputs,forces:this.forces,faults:this.faults,axes:this.axes,motion:this.motion,robot:this.robot,alarm:this.alarm,events:this.events.slice(-120),config:this.config};}
 action(action){
  switch(action.type){
   case 'start':this.start(action.recipe);break;case 'stop':this.stop();break;case 'reset':this.reset();break;case 'abort':this.abort();break;
   case 'mode':this.setMode(action.value);break;case 'fault':this.setFault(action.name,action.value);break;case 'force':this.force(action.id,action.value);break;
   case 'output':this.setOutput(action.id,action.value);break;case 'axis':this.moveAxis(action.station,action.target);break;case 'robot':this.robotCommand(action.command);break;
   case 'refill':this.refill();break;case 'clearRack':this.clearRack();break;case 'config':this.configure(action.value);break;
   case 'speed':if(![.25,1,2,5].includes(action.value))throw Error('Velocidade inválida.');this.speed=action.value;break;
   case 'step':{if(this.status!=='paused'||!this.order||this.alarm)throw Error('Passo exige pedido pausado e rearmado.');this.start();const n=this.phaseIndex;for(let i=0;i<3000&&this.phaseIndex===n&&this.status==='running';i++)this.tick(.05);this.stop();break;}
   default:throw Error('Ação desconhecida.');
  }return this.state();
 }
}
