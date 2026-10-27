// Contatos e trajetos didáticos no referencial da geometria reconstruída.
// Não substituem calibração TCP, cinemática UR ou cálculo de colisão.
export const geometry={
 blockBottom:.024,floorPitch:.05,gripOffset:.075,beltTop:1.024,
 robotBase:[.30,.95,.035],robotHome:[.30,1.42,.035],inspection:[.58,1.275,-.05],
 stockDelivery:[-1.05,1.048,-.10],robotPickup:[.35,1.048,-.34],expPickup:[1.05,1.048,-.34],
 fixtures:{1:[.57,.9635,.29],2:[.38,.9635,.29],3:[.19,.9635,.29]},
 laminaBase:.9335,laminaPitch:.002,lidBase:.9385,lidPitch:.008
};
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*Math.max(0,Math.min(1,t)));
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const up=(p,y)=>[p[0],y,p[2]];
const offset=geometry.gripOffset;
export function stockPoint(index){const row=Math.floor(index/7),col=index%7,a=(15+col*25)*Math.PI/180;return [-1.05-.27*Math.cos(a),1.43-row*.105,.03+.29*Math.sin(a)];}
export function rackPoint(index){return [.82+(index%4)*.14,1.436-Math.floor(index/4)*.18,.26];}
export function depotPoint(index){return [-.18,.929,[-.06,.02,.10][index%3]];}
export function magazinePoint(color,count,colors){return [-.67+colors.indexOf(color)*.085,geometry.laminaBase+(Math.max(1,count)-1)*geometry.laminaPitch,.08];}
function stockSurface(n){return sub(n===29?geometry.stockDelivery:stockPoint(n-1),[0,geometry.blockBottom,0]);}
function expSurface(n){return n===14?sub(geometry.expPickup,[0,geometry.blockBottom,0]):n===13?[1.25,geometry.beltTop,.07]:sub(rackPoint(n-1),[0,geometry.blockBottom,0]);}
function axisPosition(axis,point,seconds){return mix(point(axis.position),point(axis.target),axis.busy?axis.t/seconds:1);}
const zero=[0,0,0];
function rotate(v,r){
 // Babylon yaw/pitch/roll: aplicação X, depois Y para estas poses sem roll.
 let [x,y,z]=v;const cx=Math.cos(r[0]),sx=Math.sin(r[0]),cy=Math.cos(r[1]),sy=Math.sin(r[1]);
 [y,z]=[y*cx-z*sx,y*sx+z*cx];return [x*cy+z*sy,y,-x*sy+z*cy];
}
export function toolFor(partPosition,rotation=zero,grabHeight=0){return {position:add(partPosition,rotate([0,offset+grabHeight,0],rotation)),rotation};}
function path(t,keys){
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0])return mix(keys[i-1][1],keys[i][1],ease((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));
 return keys.at(-1)[1];
}
// Levar a ferramenta até a peça, fechar, transportar, apoiar e só então soltar.
function transfer(t,source,target,{start=geometry.robotHome,end=geometry.robotHome,grabHeight=0,retain=false}={}){
 const from=add(source,[0,offset+grabHeight,0]),to=add(target,[0,offset+grabHeight,0]);
 const lift=Math.max(1.32,from[1]+.10,to[1]+.10);
 const release=retain?1:.82;
 const tool=path(t,[[0,start],[.13,up(from,lift)],[.27,from],[.34,from],[.46,up(from,lift)],[.65,up(to,lift)],[.78,to],[release,to],[1,end]]);
 const held=t>=.27&&(retain||t<release);
 return {tool:{position:tool,rotation:zero},held,placed:!retain&&t>=release,position:held?sub(tool,[0,offset+grabHeight,0]):t>=release?target:source,open:!held};
}
function localBase(item,owner,world,local){return {...item,owner,position:world,local,rotation:zero};}

export function visualFrame(s,colorNames=['azul','vermelho','preto','branco','amarelo','verde']){
 const p=s.phase,o=s.order,t=p?clamp(s.elapsed/p.duration):0;
 const stock=axisPosition(s.axes.estoque,stockSurface,s.config.motionSeconds);
 const expedition=axisPosition(s.axes.expedicao,expSurface,s.config.motionSeconds);
 const processHome=[-.2,1.12,.19];
 const processPoint=n=>n>=9?up(depotPoint(n-9),1.12):n===7?[-.45,1.12,.28]:n===8?processHome:magazinePoint(colorNames[n-1],s.laminas[colorNames[n-1]],colorNames).map((v,i)=>i===1?1.12:v);
 let process=axisPosition(s.axes.processo,processPoint,s.config.motionSeconds);
 let robot={position:geometry.robotHome,rotation:zero},open=true,gripKind='base';
 const frame={anchors:{stock:{position:stock},expedition:{position:expedition},process:{position:add(process,[0,.009,0])},robot},bases:[],lamina:null,lid:null,hideStock:null,hideLamina:null,hideLid:null,gripKind,open};
 if(!o)return frame;
 const consumed=new Map(o.bases.map(b=>[b.floor,b]));
 const floorSlot=i=>o.recipe.length===1?3:o.recipe.length===2?[1,3][i]:i+1;
 for(const [i,recipe] of o.recipe.entries()){
  const b=consumed.get(i);if(!b)continue;
  const position=o.storedRack!==undefined?add(rackPoint(o.storedRack),[0,i*geometry.floorPitch,0]):o.stacked?add(geometry.fixtures[1],[0,i*geometry.floorPitch,0]):geometry.fixtures[b.slot];
  frame.bases.push(localBase({floor:i,color:recipe.color,slot:b.slot,cell:b.cell},o.storedRack!==undefined?'rack':'fixture',position));
 }
 const setBase=(i,owner,position,local)=>{
  const recipe=o.recipe[i],b=consumed.get(i);let item=frame.bases.find(b=>b.floor===i);
  if(!item){item={floor:i,color:recipe.color,slot:floorSlot(i),cell:b?.cell??p.cell};frame.bases.push(item);}
  Object.assign(item,{owner,position,local,rotation:zero});
 };
 if(p?.type==='stockTake'){
  const captured=t>=.55&&s.inputs['estoque.vacuumOK']&&s.inputs['estoque.gripClosed'];
  if(captured){frame.hideStock=p.cell;setBase(p.floor,'stock',add(stock,[0,geometry.blockBottom,0]),[0,geometry.blockBottom,0]);}
 }
 if(p?.type==='stockDeliver')setBase(p.floor,'stock',add(stock,[0,geometry.blockBottom,0]),[0,geometry.blockBottom,0]);
 if(p?.type==='feed')setBase(p.floor,'feed',mix(geometry.stockDelivery,[-1.05,1.048,-.34],s.motion['estoque.feed']||0));
 if(p?.type==='transport')setBase(p.floor,'belt',mix([-1.05,1.048,-.34],geometry.robotPickup,s.faults.jam?Math.min(.5,t):t));
 if(p?.type==='robot'&&p.cmd>=1&&p.cmd<=3){
  const a=transfer(t,geometry.robotPickup,geometry.fixtures[p.slot]);robot=a.tool;open=a.open;
  setBase(p.floor,a.held?'robot':a.placed?'fixture':'belt',a.position,a.held?[0,-offset,0]:undefined);
 }
 if(p?.type==='laminaVacuum'){
  const source=magazinePoint(p.color,s.laminas[p.color],colorNames),lift=up(source,1.12);
  const captured=t>=.55&&s.inputs['processo.vacuumOK']&&s.inputs['processo.zExtended'];
  process=path(t,[[0,lift],[.35,source],[.65,source],[1,lift]]);
  if(captured){frame.hideLamina={color:p.color,index:s.laminas[p.color]-1};frame.lamina={color:p.color,owner:'process',position:process,local:[0,-.009,0],rotation:zero};}
 }
 if(p?.type==='laminaDeliver'){
  const source=magazinePoint(p.color,s.laminas[p.color]+1,colorNames),target=depotPoint(p.lam);
  process=path(t,[[0,up(source,1.12)],[.6,up(target,1.12)],[.87,target],[1,target]]);
  frame.lamina={color:p.color,owner:'process',position:process,local:[0,-.009,0],rotation:zero};
 }
 const robotLamina=p?.type==='robot'&&p.cmd>=4&&p.cmd<=6;
 if(robotLamina){
  process=mix(depotPoint(p.lam),up(depotPoint(p.lam),1.12),ease(t/.20));
  const a=transfer(t,depotPoint(p.lam),geometry.inspection,{end:add(geometry.inspection,[0,offset,0]),retain:true});robot=a.tool;open=a.open;gripKind='lamina';
  frame.lamina={color:p.color,owner:a.held?'robot':'depot',position:a.position,local:a.held?[0,-offset,0]:undefined,rotation:zero};
 }
 if(p?.type==='inspect'){
  robot=toolFor(geometry.inspection);open=false;gripKind='lamina';
  frame.lamina={color:p.color,owner:'robot',position:geometry.inspection,local:[0,-offset,0],rotation:zero};
 }
 if(p?.insert){
  const base=geometry.fixtures[p.slot],delta=[[-.044,.006,0],[0,.006,.044],[.044,.006,0]][p.lam],target=add(base,delta);
  const rotation=[Math.PI/2,(p.lam===1?0:Math.PI/2),0];
  const part=path(t,[[0,geometry.inspection],[.3,up(target,1.23)],[.70,target],[.82,target],[1,target]]);
  const turning=mix(zero,rotation,ease(t/.65));robot=toolFor(part,turning);open=t>=.82;gripKind='lamina';
  if(open)robot={position:path((t-.82)/.18,[[0,robot.position],[1,geometry.robotHome]]),rotation:mix(rotation,zero,(t-.82)/.18)};
  frame.lamina={color:p.color,owner:open?'fixture':'robot',position:open?target:part,local:open?undefined:[0,-offset,0],rotation:open?rotation:zero};
 }
 if(p?.lid){
  const source=[.02,geometry.lidBase+(s.lids-1)*geometry.lidPitch,.29],target=add(geometry.fixtures[3],[0,.03,0]);
  const a=transfer(t,source,target);robot=a.tool;open=a.open;gripKind='lid';
  if(t>=.27)frame.hideLid=s.lids-1;
  frame.lid=t<.27?null:{owner:a.held?'robot':'fixture',position:a.position,local:a.held?[0,-offset,0]:undefined,rotation:zero};
 }
 if(p?.stack){
  const three=o.recipe.length===3,leg=three?(t<.5?1:2):1,u=three?(t<.5?t*2:(t-.5)*2):t;
  if(three&&leg===2)setBase(1,'fixture',add(geometry.fixtures[1],[0,geometry.floorPitch,0]));
  const source=geometry.fixtures[floorSlot(leg)],target=add(geometry.fixtures[1],[0,leg*geometry.floorPitch,0]);
  const a=transfer(u,source,target);robot=a.tool;open=a.open;
  setBase(leg,a.held?'robot':'fixture',a.position,a.held?[0,-offset,0]:undefined);
 }
 if(p?.unload){
  const source=o.recipe.length===1?geometry.fixtures[3]:geometry.fixtures[1],height=(o.recipe.length-1)*geometry.floorPitch;
  const a=transfer(t,source,geometry.robotPickup,{grabHeight:height});robot=a.tool;open=a.open;
  o.recipe.forEach((_,i)=>setBase(i,a.held?'robot':a.placed?'belt':'fixture',add(a.position,[0,i*geometry.floorPitch,0]),a.held?[0,-offset-height+i*geometry.floorPitch,0]:undefined));
 }
 if(p?.type==='transportFinal'||p?.type==='expPick'||p?.type==='expStore'){
  const final=p.type==='transportFinal',onFork=p.type==='expStore';
  const bottom=final?mix(geometry.robotPickup,geometry.expPickup,s.faults.jam?Math.min(.5,t):t):onFork?add(expedition,[0,geometry.blockBottom,0]):geometry.expPickup;
  o.recipe.forEach((_,i)=>setBase(i,onFork?'expedition':'belt',add(bottom,[0,i*geometry.floorPitch,0]),onFork?[0,geometry.blockBottom+i*geometry.floorPitch,0]:undefined));
 }
 frame.anchors.process.position=add(process,[0,.009,0]);frame.anchors.robot=robot;frame.open=open;frame.gripKind=gripKind;
 return frame;
}
