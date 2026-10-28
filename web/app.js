import {createPlant} from './scene.js';
import './demo.css';
import * as browserAPI from './browser-api.js';
const browserDemo=import.meta.env.VITE_BROWSER_DEMO==='true';
const localDemo=browserDemo?browserAPI:null;
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state,catalog,plant,report,toastTimer,lastIO='',lastEvent=0;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
async function api(url,data){if(localDemo)return localDemo.request(url,data);const r=await fetch(url,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const result=await r.json();if(!r.ok)throw Error(result.error||r.statusText);return result;}
async function action(data){try{state=await api('/api/action',data);render();}catch(e){toast(e.message);}}
const options=(values,selected)=>values.map(c=>`<option value="${c}" ${c===selected?'selected':''}>${c[0].toUpperCase()+c.slice(1)}</option>`).join('');
function recipeUI(){const old=readRecipe();$('recipe').innerHTML=Array.from({length:Number($('floorCount').value)},(_,i)=>`<div class="recipe-floor"><div class="floor-head"><span class="floor-index">${String(i+1).padStart(2,'0')} / ${i===0?'BASE':'ANDAR'}</span><select aria-label="Cor da base ${i+1}" class="base-color">${options(['azul','vermelho','preto'],old[i]?.color||['azul','vermelho','preto'][i])}</select></div><div class="laminas">${[0,1,2].map(j=>`<label>L${j+1} · ${['Esquerda','Trás','Direita'][j]}<select aria-label="Lâmina ${j+1} do andar ${i+1}" class="lamina-color">${options(Object.keys(catalog.colors),old[i]?.laminas[j]||['azul','amarelo','verde'][j])}</select></label>`).join('')}</div></div>`).join('');}
function readRecipe(){return [...document.querySelectorAll('.recipe-floor')].map(f=>({color:f.querySelector('.base-color').value,laminas:[...f.querySelectorAll('.lamina-color')].map(s=>s.value)}));}
function tab(id){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==id);}
function buildIO(){
 const station=$('ioStation').value,search=$('ioSearch').value.toLowerCase();lastIO=station+search;
 $('axisControl').hidden=station==='montagem';$('robotControl').hidden=station!=='montagem';$('axisTarget').max=station==='estoque'?29:14;
 $('ioTable').innerHTML=['I','Q'].map(dir=>`<div class="io-header">${dir==='I'?'ENTRADAS · FORÇAR / OBSERVAR':'SAÍDAS · ACIONAMENTO MANUAL'}</div>`+catalog.io.filter(r=>r.station===station&&r.dir===dir&&(r.label+' '+r.address).toLowerCase().includes(search)).map(r=>`<div class="io-row"><code>${esc(r.address)}</code><div>${esc(r.label)}<small>${esc(r.source)}</small></div><button data-signal="${r.id}" data-dir="${r.dir}" aria-label="${dir==='I'?'Forçar':'Acionar'} ${esc(r.label)}">0</button></div>`).join('')).join('');
 $('ioTable').querySelectorAll('button').forEach(b=>b.onclick=()=>{const id=b.dataset.signal;if(b.dataset.dir==='Q')action({type:'output',id,value:!state.q[id]});else action({type:'force',id,value:!Object.hasOwn(state.forces,id)?true:state.forces[id]?false:null});});
}
const states={ready:'PRONTO',running:'EM CICLO',paused:'PAUSADO',complete:'CONCLUÍDO',manual:'MANUAL',fault:'FALHA',emergency:'EMERGÊNCIA'};
function render(){
 if(!state)return;const s=state,p=s.phase;
 $('connection').textContent=browserDemo?'● Demo no navegador':'● Servidor local ativo';$('connection').style.color='';
 $('phaseLabel').textContent=s.order?p?.label||'Pedido em andamento':s.status==='complete'?'Pedido concluído e armazenado':s.mode==='manual'?'Operação manual dos componentes':'Aguardando pedido';
 $('phaseMeta').textContent=s.order?`${s.order.id} · Etapa ${s.phaseIndex+1} de ${s.phaseCount} · ${s.elapsed.toFixed(1)} s / ${p.duration.toFixed(1)} s nominais`:'Quatro estações · modelo determinístico · sem conexão física';
 $('statusBadge').textContent=states[s.status];$('statusBadge').style.color=s.alarm?'#ffaaa4':'';
 $('progressBar').style.width=(s.order?100*(s.phaseIndex+Math.min(1,s.elapsed/p.duration))/s.phaseCount:s.status==='complete'?100:0)+'%';
 $('start').textContent=s.status==='paused'?'▶ Retomar ciclo':'▶ Iniciar ciclo';$('start').disabled=s.mode!=='auto'||!!s.alarm||s.status==='running';
 $('stop').disabled=!['running','manual'].includes(s.status);$('step').disabled=s.status!=='paused'||!s.order||!!s.alarm;
 $('emergency').textContent=s.faults.emergency?'● Liberar emergência':'● Emergência';$('emergency').classList.toggle('active',s.faults.emergency);
 $('alarm').hidden=!s.alarm;if(s.alarm)$('alarm').textContent=s.alarm.code+' · '+s.alarm.message;
 $('kpiDone').textContent=s.completed.length;$('kpiStock').innerHTML=s.stock.filter(Boolean).length+' <em>/ 28</em>';$('kpiRack').innerHTML=s.rack.filter(Boolean).length+' <em>/ 12</em>';
 $('kpiTime').textContent=Math.floor(s.time/60).toString().padStart(2,'0')+':'+Math.floor(s.time%60).toString().padStart(2,'0');
 $('mode').value=s.mode;$('speed').value=s.speed;
 document.querySelectorAll('#recipe select,#floorCount').forEach(e=>e.disabled=!!s.order);
 $('inventory').innerHTML=['azul','vermelho','preto'].map(c=>`<div class="inventory-row"><i class="swatch" style="background:${catalog.colors[c]}"></i><span>Base ${c}</span><b>${s.stock.filter(x=>x===c).length}</b></div>`).join('')+`<div class="inventory-row"><span>Lâminas · seis cores</span><b>${Object.values(s.laminas).reduce((a,b)=>a+b,0)}</b></div><div class="inventory-row"><span>Tampas</span><b>${s.lids}</b></div>`;
 $('rackGrid').innerHTML=s.rack.map((p,i)=>`<div class="rack-cell ${p?'full':''}" title="${p?esc(p.id+' · '+p.recipe.length+' andar(es)'):'Vazio'}">${String(i+1).padStart(2,'0')}${p?' ●':''}</div>`).join('');
 document.querySelectorAll('.station-card').forEach(b=>b.classList.toggle('active',s.status==='running'&&p?.station===b.dataset.station));
 if(lastIO!==$('ioStation').value+$('ioSearch').value.toLowerCase())buildIO();
 document.querySelectorAll('[data-signal]').forEach(b=>{const id=b.dataset.signal,forced=Object.hasOwn(s.forces,id),value=b.dataset.dir==='I'?s.inputs[id]:s.q[id];b.textContent=(forced?'F ':'')+(value?'1':'0');b.classList.toggle('on',!!value);b.classList.toggle('forced',forced);b.disabled=b.dataset.dir==='Q'&&(s.mode!=='manual'||!!s.alarm||s.status==='paused');});
 document.querySelectorAll('[data-fault]').forEach(b=>b.classList.toggle('active',s.faults[b.dataset.fault]));
 const cmd=catalog.robot.commands.find(c=>c.id===s.robot.command);$('robotPose').textContent=cmd?`UR3e · ${s.robot.command} · ${s.robot.busy?'ocupado':'pronto'}`:'UR3e · pronto';
 if(s.events.at(-1)?.seq!==lastEvent){lastEvent=s.events.at(-1)?.seq||0;$('eventCount').textContent='· últimos '+s.events.length;$('trace').innerHTML=[...s.events].reverse().map(e=>`<div class="trace-row ${['TIMEOUT','EMERGÊNCIA','VISAO_NOK','GARRA'].includes(e.code)?'error':''}"><span>${e.t.toFixed(2)} s</span><b>${esc(e.code)}</b><span>${esc(e.message)}</span></div>`).join('');}
 plant?.update(s);
}
async function initialize(){
 if(browserDemo){
  document.title='Planta N2 · Demo SMART 4.0';
  document.querySelector('.scene-top .eyebrow').textContent='DEMONSTRAÇÃO / MODELO ISOLADO NO NAVEGADOR';
  document.querySelector('.brand small').textContent='DEMONSTRAÇÃO DE COMISSIONAMENTO';
  const back=document.createElement('a');back.href='../';back.textContent='← Outras demos';back.className='portal-back';document.querySelector('.headright').prepend(back);
  document.querySelectorAll('.source-links a').forEach((a,i)=>{a.href='https://github.com/tonymarim/gemeo-digital-planta-N2/blob/main/'+(i?'data/io-map.csv':'LEIA-ME.md');a.textContent=i?'↗ Mapa de sinais':'↗ Guia e referências';});
  document.querySelector('a[href="/api/trace"]').addEventListener('click',e=>{e.preventDefault();localDemo.downloadTrace();});
  const note=document.createElement('p');note.className='demo-note';note.textContent='Demo isolada no navegador: nenhum equipamento conectado. Recarregar reinicia o pedido e o inventário. Os relatórios são baixados no seu dispositivo.';document.querySelector('main').prepend(note);
  document.querySelector('#help p').textContent='A sessão existe somente neste navegador. Recarregar reinicia a simulação. Exporte as evidências antes de sair; nenhum dado de operação é enviado a servidor.';
 }
 catalog=await api('/api/catalog');
 $('stationCards').innerHTML=catalog.stations.map((s,i)=>`<button class="station-card" data-station="${s.id}"><span class="number">0${i+1}</span><strong>${s.name}</strong><small>${s.id==='montagem'?'UR3e · SCHUNK EGH':s.id==='estoque'?'Armazenador · 28 posições':s.id==='processo'?'Pórtico XYZ · seis cores':'Armazenador · 12 posições'}</small></button>`).join('');
 $('ioStation').innerHTML=catalog.stations.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
 $('robotCommand').innerHTML=catalog.robot.commands.map(c=>`<option value="${c.id}">${c.id} · ${esc(c.name)}</option>`).join('');
 $('fidelity').innerHTML=catalog.fidelity.map(([title,level,description])=>`<div class="fidelity-item"><h3>${esc(title)}</h3><b>${esc(level)}</b><p>${esc(description)}</p></div>`).join('');
 $('network').innerHTML=catalog.stations.map(s=>`<div class="network-row">${s.name}<code>${s.ip}</code><br>${s.plc}</div>`).join('');
 $('faultControls').innerHTML=Object.entries({air:'Falta de ar',vacuum:'Perda de vácuo',jam:'Esteira obstruída',camera:'Visão: cor incorreta',gripper:'Garra sem confirmação'}).map(([key,text])=>`<button data-fault="${key}">○ ${text}</button>`).join('');
 const configLabels={motionSeconds:'Atuadores',transportSeconds:'Transporte',pneumaticSeconds:'Pneumática',timeoutSeconds:'Timeout adicional',robotSeconds:'Comando do robô'};
 state=await api('/api/state');$('configForm').innerHTML=Object.entries(configLabels).map(([key,label])=>`<label>${label}<input type="number" min="0.1" max="120" step="0.1" data-config="${key}" value="${state.config[key]}"></label>`).join('');
 recipeUI();buildIO();
 try{plant=createPlant($('renderCanvas'),catalog,id=>{$('ioStation').value=id;buildIO();});}catch(e){$('sceneError').hidden=false;$('sceneError').textContent='Não foi possível iniciar WebGL: '+e.message;}
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{plant?.view(b.dataset.view);document.querySelectorAll('[data-view]').forEach(v=>v.classList.toggle('selected',v===b));});
 document.querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>{plant?.view(b.dataset.station);$('ioStation').value=b.dataset.station;buildIO();});
 let showLabels=true;$('labelsBtn').onclick=()=>plant?.labels(showLabels=!showLabels);
 let showRoom=true;$('roomBtn').onclick=()=>{showRoom=!showRoom;plant?.environment(showRoom);$('roomBtn').textContent=showRoom?'Sala visível':'Sala oculta';$('roomBtn').setAttribute('aria-pressed',String(showRoom));};
 $('renderQuality').onchange=()=>plant?.quality($('renderQuality').value);
 $('floorCount').onchange=recipeUI;$('start').onclick=()=>action({type:'start',recipe:readRecipe()});$('stop').onclick=()=>action({type:'stop'});$('step').onclick=()=>action({type:'step'});$('reset').onclick=()=>action({type:'reset'});
 $('emergency').onclick=()=>action({type:'fault',name:'emergency',value:!state.faults.emergency});
 $('abort').onclick=()=>action({type:'abort'});$('refill').onclick=()=>action({type:'refill'});$('clearRack').onclick=()=>action({type:'clearRack'});
 $('speed').onchange=()=>action({type:'speed',value:Number($('speed').value)});$('mode').onchange=()=>action({type:'mode',value:$('mode').value});
 $('ioStation').onchange=()=>{buildIO();render();};$('ioSearch').oninput=()=>{buildIO();render();};
 $('axisMove').onclick=()=>action({type:'axis',station:$('ioStation').value,target:Number($('axisTarget').value)});
 $('robotMove').onclick=()=>action({type:'robot',command:Number($('robotCommand').value)});
 document.querySelectorAll('[data-fault]').forEach(b=>b.onclick=()=>action({type:'fault',name:b.dataset.fault,value:!state.faults[b.dataset.fault]}));
 $('saveConfig').onclick=()=>action({type:'config',value:Object.fromEntries([...document.querySelectorAll('[data-config]')].map(e=>[e.dataset.config,Number(e.value)]))});
 $('runTests').onclick=async()=>{try{$('runTests').disabled=true;report=await api('/api/commission',{});$('testResults').innerHTML=`<strong>${report.results.filter(r=>r.passed).length}/${report.total} ensaios aprovados</strong>`+report.results.map(r=>`<div class="test-result ${r.passed?'pass':'fail'}">${r.passed?'✓':'✗'} ${esc(r.name)}<small>${esc(r.error|| (typeof r.evidence==='object'?JSON.stringify(r.evidence):r.evidence))}</small></div>`).join('');$('exportReport').disabled=false;}catch(e){toast(e.message);}finally{$('runTests').disabled=false;}};
 $('exportReport').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='comissionamento-n2.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('helpBtn').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();
 render();
 async function poll(){try{state=await api('/api/state');render();}catch(e){$('connection').textContent='● Servidor desconectado';$('connection').style.color='#ffaaa4';}setTimeout(poll,180);}poll();
}
initialize().catch(e=>toast('Falha ao carregar o modelo: '+e.message));
