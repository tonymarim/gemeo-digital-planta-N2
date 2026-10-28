import {Engine,Scene,ArcRotateCamera,Vector3,Color3,Color4,HemisphericLight,DirectionalLight,MeshBuilder,StandardMaterial,DynamicTexture,TransformNode,Quaternion,DefaultRenderingPipeline,ShadowGenerator,PointLight,ReflectionProbe,RenderTargetTexture,SSAO2RenderingPipeline} from '@babylonjs/core';
import {createLaboratory} from './laboratory.js';
import {detailEquipment} from './equipment-detail.js';
import {geometry,stockPoint as stockCell,rackPoint as rackCell,depotPoint,visualFrame} from './visual-state.mjs';

export function createPlant(canvas,catalog,onSelect){
 const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});
 let quality='high';
 function resize(){
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  const ratio=quality==='high'?Math.min(window.devicePixelRatio||1,2,Math.sqrt(3000000/(width*height))):1;
  engine.setHardwareScalingLevel(1/ratio);engine.resize();
 }
 resize();
 const scene=new Scene(engine);scene.clearColor=new Color4(.86,.87,.85,1);scene.ambientColor=new Color3(.10,.10,.10);
 const overviewRadius=()=>Math.max(3.3,4.5/(canvas.clientWidth/canvas.clientHeight));
 const camera=new ArcRotateCamera('orbit',-Math.PI/2-.40,1.20,overviewRadius(),new Vector3(0,.87,0),scene);
 camera.attachControl(canvas,false);camera.lowerRadiusLimit=.85;camera.upperRadiusLimit=9;
 camera.wheelDeltaPercentage=.006;camera.pinchDeltaPercentage=.003;camera.inertia=.75;camera.panningInertia=.65;
 camera.minZ=.02;camera.panningSensibility=1600;camera.lowerBetaLimit=.12;camera.upperBetaLimit=1.55;
 const pipeline=new DefaultRenderingPipeline('qualidade',false,scene,[camera]);
 pipeline.samples=4;pipeline.fxaaEnabled=true;pipeline.imageProcessingEnabled=false;
 const ao=SSAO2RenderingPipeline.IsSupported?new SSAO2RenderingPipeline('oclusão de contato',scene,{ssaoRatio:.5,blurRatio:.5},[camera]):null;
 if(ao){ao.radius=.09;ao.totalStrength=.85;ao.samples=8;ao.expensiveBlur=false;ao.textureSamples=1;}
 const hemi=new HemisphericLight('sky',new Vector3(.3,1,-.5),scene);hemi.intensity=.62;hemi.groundColor=new Color3(.38,.34,.28);
 const sun=new DirectionalLight('janela',new Vector3(.5,-1,.3),scene);sun.intensity=.62;sun.diffuse=new Color3(1,.95,.85);sun.position=new Vector3(-2.1,3,-1.2);
 const ceilingLight=new PointLight('painéis LED',new Vector3(.5,3,-.7),scene);ceilingLight.intensity=.3;ceilingLight.diffuse=new Color3(.93,.97,1);
 sun.autoCalcShadowZBounds=true;
 const shadow=new ShadowGenerator(2048,sun);shadow.usePercentageCloserFiltering=true;shadow.filteringQuality=ShadowGenerator.QUALITY_HIGH;shadow.bias=.0001;shadow.normalBias=.003;shadow.setDarkness(.42);
 const materials={};
 function mat(name,hex){if(materials[name])return materials[name];const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.16,.16,.16);m.specularPower=48;materials[name]=m;return m;}
 const metal=mat('aluminum','#a8b7bf'),dark=mat('frame','#26313a'),black=mat('black','#141d25'),deck=mat('deck','#bac6cd'),rubber=mat('rubber','#323c43'),lime=mat('lime','#b9da4e'),cyan=mat('urblue','#65bed4'),white=mat('white','#e2e8eb');
 const V=(x,y,z)=>new Vector3(x,y,z);
 function box(name,x,y,z,w,h,d,m,parent){const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);mesh.position.set(x,y,z);mesh.material=m;if(parent)mesh.parent=parent;return mesh;}
 function cyl(name,x,y,z,d,h,m,parent){const mesh=MeshBuilder.CreateCylinder(name,{diameter:d,height:h,tessellation:32},scene);mesh.position.set(x,y,z);mesh.material=m;if(parent)mesh.parent=parent;return mesh;}
 function placeRod(r,a,b){const diff=b.subtract(a),length=diff.length();r.setEnabled(length>.00001);if(length<=.00001)return;r.position=Vector3.Center(a,b);r.scaling.y=length;r.rotationQuaternion=Quaternion.FromUnitVectorsToRef(Vector3.Up(),diff.normalize(),new Quaternion());}
 function textPanel(text,x,y,z,w,h,bg='#1d2a33',fg='#c3e366',size=60){const tex=new DynamicTexture('label-'+text,{width:1024,height:256},scene,false);tex.hasAlpha=false;tex.drawText(text,null,165,`600 ${size}px Segoe UI`,fg,bg,true);const m=new StandardMaterial('label-'+text,scene);m.diffuseTexture=tex;m.emissiveColor=new Color3(.45,.45,.45);m.backFaceCulling=false;const p=MeshBuilder.CreatePlane('label',{width:w,height:h},scene);p.position.set(x,y,z);p.material=m;return p;}
 const laboratory=createLaboratory(scene),floor=laboratory.floor;
 const labels=[],lights={},belts=[],feeds={},stoppers={};
 for(const [i,s] of catalog.stations.entries()){
  const x=s.x,w=s.width;
  box(s.name+' gabinete',x,.46,0,w-.025,.78,.73,dark);
  for(const dx of [-w/2+.025,w/2-.025])for(const z of [-.37,.37]){box('perfil',x+dx,.46,z,.035,.83,.035,metal);cyl('pé',x+dx,.035,z,.055,.04,dark);}
  box('tampo',x,.897,0,w-.008,.035,.79,deck);
  for(let dx=-w/2+.05;dx<w/2;dx+=.025)box('ranhura',x+dx,.917,0,.001,.001,.73,metal);
  const doors=s.id==='montagem'?2:1;
  for(let j=0;j<doors;j++){
   const cx=x-w/2+.03+(j+.5)*(w-.06)/doors;
   box('porta',cx,.45,-.375,(w-.065)/doors-.012,.65,.012,mat('door','#38434c'));
   box('maçaneta',cx-(w-.065)/doors/2+.025,.66,-.39,.009,.07,.015,metal);
   textPanel(s.name.toUpperCase(),cx,.25,-.388,(w-.065)/doors-.03,.08,'#38434c','#b6da60',63);
   textPanel('SMART 4.0',cx,.67,-.388,(w-.065)/doors-.08,.05,'#38434c','#dce5e9',60);
  }
  const console=box('console IHM',x-.03,.83,-.48,w*.78,.065,.18,metal);console.rotation.x=-.25;
  const scr=box('KTP700',x-.095,.872,-.49,w*.4,.008,.10,black);scr.rotation.x=-.25;
  const display=box('display',x-.095,.878,-.49,w*.35,.006,.078,mat('display','#50b4cc'));display.rotation.x=-.25;
  for(let j=0;j<3;j++)cyl('botoeira',x+w*.22,.888,-.44-j*.04,.022,.014,[lime,mat('red','#db4541'),cyan][j]);
  cyl('emergência base',x+w*.33,.88,-.46,.045,.012,mat('yellow','#efc947'));cyl('emergência',x+w*.33,.90,-.46,.028,.03,materials.red);
  lights[s.id]=cyl('sinalizador',x+w*.33,.889,-.52,.013,.012,lime);
  // Duas esteiras contínuas, com giro nas extremidades.
  for(const z of [-.21,-.34]){
   box('longarina',x,.976,z,w,.075,.09,metal);box('correia',x,1.017,z,w,.009,.067,rubber);
   for(const dz of [-.047,.047])box('guia',x,1.032,z+dz,w,.018,.008,metal);
   for(let n=0;n<12;n++){const stripe=box('emenda',x-w/2+n*w/12,1.023,z,.003,.001,.061,mat('stripe','#53616b'));belts.push({mesh:stripe,x:x-w/2,width:w,offset:n*w/12,s:s.id,lane:z===-.21?'belt2':'belt1'});}
  }
  feeds[s.id]=box('alimentador',x,1.0115,-.10,.11,.025,.105,metal);
  box('suporte alimentador',x,.964,-.10,.035,.099,.035,metal);
  stoppers[s.id]=[box('stopper',x+.14,1.05,-.34,.012,.055,.065,black),box('stopper',x+.14,1.05,-.21,.012,.055,.065,black)];
  box('RFID',x+.11,1.033,-.405,.045,.025,.025,mat('RFID','#ecba44'));
  const label=textPanel(`${String(i+1).padStart(2,'0')}   ${s.name.toUpperCase()}`,x,.13,-.61,w*.85,.075,'#263540','#d4e3ed',67);label.metadata={station:s.id};labels.push(label);
 }
 for(const x of [-1.435,1.435]){
  const arc=[];for(let i=0;i<=24;i++){const a=-Math.PI/2+Math.PI*i/24;arc.push(V(x+(x<0?-1:1)*.065*Math.cos(a),1.01,-.275+.065*Math.sin(a)));}
  MeshBuilder.CreateTube('giro 180°',{path:arc,radius:.04,tessellation:24},scene).material=rubber;
 }
 const stockMeshes=[],stockPlates=[];
 function stockPoint(index){return V(...stockCell(index));}
 for(let i=0;i<28;i++){const p=stockPoint(i);const plate=box('posição estoque '+(i+1),p.x,p.y-.030,p.z,.095,.012,.105,dark);plate.rotation.y=(i%7-3)*-.20;stockPlates.push(plate);stockMeshes.push(block('base estoque',p.x,p.y,p.z,'azul'));}
 for(let row=0;row<4;row++)for(const radial of [.245,.325]){
  const points=[];for(let i=0;i<=36;i++){const a=(15+i*150/36)*Math.PI/180;points.push(V(-1.05-radial*Math.cos(a),1.43-row*.105-.041,.03+radial*Math.sin(a)));}
  MeshBuilder.CreateTube('trilho curvo magazine',{path:points,radius:.008,tessellation:12},scene).material=metal;
 }
 for(let col of [0,3,6]){const p=stockPoint(col);box('suporte magazine',p.x,1.1745,p.z,.018,.52,.018,metal);}
 box('coluna estoque',-1.05,1.27,.04,.045,.70,.045,metal);
 const stockTool=new TransformNode('garfo estoque',scene);const stockPlate=box('apoio móvel estoque',0,-.006,0,.105,.012,.11,metal,stockTool);
 for(const x of [-.05,.05])box('dedo garra estoque',x,.015,0,.01,.03,.07,dark,stockTool);
 const stockArm=cyl('braço radial estoque',0,0,0,.022,1,metal);
 // Pórtico cartesiano do processo e seis magazines de lâminas.
 for(const x of [-.70,-.2])box('pórtico coluna',x,1.12,.19,.03,.43,.03,metal);
 box('eixo X processo',-.45,1.34,.19,.56,.04,.045,dark);
 const processTool=new TransformNode('manipulador processo',scene);
 box('carro X',0,0,0,.07,.075,.07,metal,processTool);box('eixo Y',0,-.02,-.08,.025,.03,.23,dark,processTool);const processZ=box('pneumático Z',0,-.09,-.12,.035,.17,.035,metal,processTool);
 const suctionAnchor=new TransformNode('ventosa processo',scene);cyl('ventosa',0,0,0,.025,.015,black,suctionAnchor);
 const laminaColors=Object.keys(catalog.colors);
 const laminaStacks={},laminaSupports={};
 laminaColors.forEach((c,i)=>{const x=-.67+i*.085;laminaSupports[c]=box('base magazine '+c,x,.9235,.08,.065,.018,.05,dark);
  for(const dx of [-.032,.032])box('guia magazine '+c,x+dx,.9725,.08,.005,.08,.045,metal);
  laminaStacks[c]=Array.from({length:30},(_,j)=>box('lâmina '+c,x,geometry.laminaBase+j*geometry.laminaPitch,.08,.055,.002,.03,mat(c,catalog.colors[c])));
 });
 for(let i=0;i<3;i++){const d=depotPoint(i);box('depósito lâmina '+(i+1),d[0],.921,d[2],.065,.014,.06,black);}
 // Base de montagem: B3 esquerda, B2 centro, B1 direita (foto Posições_Robô).
 const fixtures=Object.fromEntries(Object.entries(geometry.fixtures).map(([n,p])=>[n,V(...p)]));
 Object.entries(fixtures).forEach(([n,p])=>{box('berço B'+n,p.x,p.y-.0365,p.z,.14,.025,.15,dark);textPanel('B'+n,p.x,p.y+.02,p.z-.081,.05,.023,'#26313a','#dce5e9');});
 box('base magazine tampas',.02,.9245,.29,.11,.02,.12,white);
 for(const x of [-.035,.075])box('guia magazine tampas',x,.9945,.29,.009,.12,.11,metal);
 const lidStack=Array.from({length:12},(_,i)=>box('tampa magazine',.02,geometry.lidBase+i*geometry.lidPitch,.29,.09,.008,.09,dark));
 const ramp=box('rampa de alimentação',-.035,1.02,-.015,.13,.025,.30,metal);ramp.rotation.x=.37;
 box('câmera suporte',.65,1.13,.05,.022,.40,.022,metal);box('VISOR',.65,1.35,.015,.09,.06,.05,black);const lens=cyl('lente VISOR',.65,1.35,-.02,.035,.04,mat('lens','#496a81'));lens.rotation.x=Math.PI/2;
 box('teach pendant',.58,.82,-.54,.22,.045,.17,cyan);box('teach tela',.58,.85,-.54,.17,.008,.12,materials.display);
 // Robô ilustrativo: contatos geométricos no automático; pontos extraídos no manual.
 const base=V(...geometry.robotBase);cyl('base UR3e',base.x,base.y,base.z,.128,.06,metal);
 const joints=Array.from({length:6},(_,i)=>{const m=MeshBuilder.CreateSphere('junta '+(i+1),{diameter:i<3?.09:.065,segments:24},scene);m.material=cyan;return m;});
 const links=Array.from({length:5},(_,i)=>cyl('elo '+i,0,0,0,i<2?.067:.047,1,white));
 const gripper=new TransformNode('SCHUNK EGH',scene);box('corpo EGH',0,0,0,.065,.075,.045,metal,gripper);const jawLeft=box('dedo esquerdo',-.05,-.05,0,.014,.055,.025,dark,gripper),jawRight=box('dedo direito',.05,-.05,0,.014,.055,.025,dark,gripper);
 const world=p=>V(base.x+p[0],base.y+p[2],base.z-p[1]);
 const expMeshes=[];
 function rackPoint(i){return V(...rackCell(i));}
 for(let row=0;row<3;row++)box('prateleira expedição',1.03,1.405-row*.18,.26,.58,.014,.14,dark);
 for(const x of [.76,1.31])box('coluna expedição',x,1.2,.28,.025,.60,.025,metal);
 for(let i=0;i<12;i++){const p=rackPoint(i);expMeshes.push(Array.from({length:3},(_,j)=>{const b=block('pedido '+(i+1)+' andar '+j,p.x,p.y+j*geometry.floorPitch,p.z,'azul');b.setEnabled(false);return b;}));}
 box('eixo X expedição',1.04,.96,.07,.56,.04,.045,dark);
 const expTool=new TransformNode('armazenador expedição',scene);box('eixo Y expedição',0,.29,0,.04,.67,.04,metal,expTool);
 const expFork=new TransformNode('garfo expedição',scene);expFork.parent=expTool;const expPlate=box('apoio elevador',0,-.0125,0,.11,.025,.11,metal,expFork);
 for(const x of [-.052,.052])box('guia garfo expedição',x,.014,0,.008,.028,.105,dark,expFork);
 const expArm=cyl('braço telescópico expedição',0,0,0,.02,1,metal);
 const assembled=Array.from({length:3},(_,i)=>block('bloco montagem '+i,0,0,0,'azul'));assembled.forEach(b=>b.setEnabled(false));
 const carriedLam=box('lâmina manipulada',0,0,0,.055,.002,.03,materials.azul);carriedLam.setEnabled(false);
 const carriedLid=box('tampa manipulada',0,0,0,.09,.008,.09,dark);carriedLid.setEnabled(false);
 const details=detailEquipment(scene,catalog,{box,cyl,mat,metal,dark,black,cyan,lights});
 const reflection=new ReflectionProbe('reflexos laboratório',128,scene);reflection.position=V(0,1,.1);reflection.renderList=laboratory.objects.filter(m=>!m.material?.alpha||m.material.alpha===1);reflection.refreshRate=RenderTargetTexture.REFRESHRATE_RENDER_ONCE;reflection.cubeTexture.level=.24;
 for(const m of [metal,details.steel,materials['porta vidro bronze']])m.reflectionTexture=reflection.cubeTexture;
 // UR-style joint housings and polished link collars follow the same endpoints.
 const jointHousings=joints.map((_,i)=>cyl('carcaça junta UR '+i,0,0,0,i<3?.096:.073,i<3?.095:.068,dark));
 const jointCaps=joints.map((_,i)=>cyl('tampa azul junta UR '+i,0,0,0,i<3?.083:.062,.008,cyan));
 const collars=links.map((_,i)=>[0,1].map(()=>cyl('colar elo UR '+i,0,0,0,i<2?.072:.053,.027,details.steel)));
 const robotCable=MeshBuilder.CreateTube('cabo ferramenta UR',{path:Array.from({length:9},(_,i)=>V(0,1+i*.02,0)),radius:.004,tessellation:8,updatable:true},scene);robotCable.material=black;
 function block(name,x,y,z,color){
  const root=new TransformNode(name,scene);root.position.set(x,y,z);root.parts=[];
  const m=mat(color,catalog.colors[color]);
  box('base',0,-.018,0,.085,.012,.085,m,root);
  for(const dx of [-.038,.038])for(const dz of [-.038,.038])root.parts.push(box('parede',dx,.005,dz,.009,.042,.009,m,root));
  for(const [dx,dz,w,d] of [[-.038,0,.009,.085],[.038,0,.009,.085],[0,.038,.085,.009],[0,-.038,.085,.009]])root.parts.push(box('parede',dx,-.01,dz,w,.007,d,m,root));
  root.panels=[box('L1',-.044,.006,0,.002,.03,.055,white,root),box('L2',0,.006,.044,.055,.03,.002,white,root),box('L3',.044,.006,0,.002,.03,.055,white,root)];
  root.panels.forEach(p=>p.setEnabled(false));root.lid=box('tampa',0,.03,0,.09,.008,.09,dark,root);root.lid.setEnabled(false);return root;
 }
 function colorBlock(b,color){const m=mat(color,catalog.colors[color]);for(const child of b.getChildMeshes())if(child.name==='parede'||child.name==='base')child.material=m;}
 let state=null,lastVisualFrame=null;
 const carriers={stock:stockTool,process:suctionAnchor,robot:gripper,expedition:expFork};
 function bind(node,item){
  node.setEnabled(!!item);if(!item)return;
  node.parent=carriers[item.owner]||null;
  node.position=V(...(node.parent?item.local:item.position));node.rotation=V(...(item.rotation||[0,0,0]));
  node.metadata={owner:item.owner,floor:item.floor,color:item.color};
 }
 function finishBlock(b,recipe,index,inserted,lid){
  colorBlock(b,recipe.color);b.lid.setEnabled(lid&&index===state.order.recipe.length-1);
  b.panels.forEach((panel,j)=>{const entry=inserted.find(x=>x.floor===index&&x.lam===j);panel.setEnabled(!!entry);if(entry)panel.material=mat(entry.color,catalog.colors[entry.color]);});
 }
 function payloads(frame){
  const s=state,o=s.order;
  stockMeshes.forEach((b,i)=>{b.setEnabled(!!s.stock[i]&&frame.hideStock!==i);if(s.stock[i])colorBlock(b,s.stock[i]);});
  for(const c of laminaColors)laminaStacks[c].forEach((m,i)=>m.setEnabled(i<s.laminas[c]&&!(frame.hideLamina?.color===c&&frame.hideLamina.index===i)));
  lidStack.forEach((m,i)=>m.setEnabled(i<s.lids&&frame.hideLid!==i));
  expMeshes.forEach((floors,i)=>floors.forEach((b,f)=>{const p=s.rack[i],r=p?.recipe[f];b.setEnabled(!!r);if(r){colorBlock(b,r.color);b.lid.setEnabled(f===p.recipe.length-1);b.panels.forEach((l,j)=>{l.setEnabled(true);l.material=mat(r.laminas[j],catalog.colors[r.laminas[j]]);});}}));
  assembled.forEach((b,i)=>{const item=frame.bases.find(x=>x.floor===i);bind(b,item);if(item)finishBlock(b,o.recipe[i],i,o.inserted,o.lid);});
  bind(carriedLam,frame.lamina);if(frame.lamina)carriedLam.material=mat(frame.lamina.color,catalog.colors[frame.lamina.color]);
  bind(carriedLid,frame.lid);
 }
 function update(s){state=s;}
 function renderFrame(){
  laboratory.update(camera);
  if(state){const s=state,frame=visualFrame(s,laminaColors);lastVisualFrame=frame;
   for(const b of belts)if(s.q[b.s+'.'+b.lane]&&!s.faults.jam){b.offset=(b.offset+Math.min(.05,engine.getDeltaTime()/1000)*.35*s.speed)%b.width;b.mesh.position.x=b.x+b.offset;}
   for(const st of catalog.stations){const id=st.id;feeds[id].position.z=-.10-(s.motion[id+'.feed']||0)*.24;stoppers[id].forEach((m,i)=>m.position.y=s.q[id+'.stopper'+(i+1)]?1.05:1.005);lights[id].material=s.alarm?materials.red:s.phase?.station===id&&s.status==='running'?lime:cyan;}
   stockTool.position=V(...frame.anchors.stock.position);
   placeRod(stockArm,V(-1.05,stockTool.position.y+.018,.04),stockTool.position.add(V(0,.018,0)));
   const cp=frame.anchors.process.position;processTool.position=V(cp[0],1.34,cp[2]+.12);suctionAnchor.position=V(...cp);
   processZ.position.y=(cp[1]-1.34)/2;processZ.scaling.y=Math.max(.01,1.34-cp[1])/.17;
   const ep=frame.anchors.expedition.position;expTool.position=V(ep[0],.95,.07);expFork.position=V(0,ep[1]-.95,ep[2]-.07);
   placeRod(expArm,V(ep[0],ep[1]-.018,.07),V(ep[0],ep[1]-.018,ep[2]));
   let tcp=V(...frame.anchors.robot.position);gripper.rotation=V(...frame.anchors.robot.rotation);
   if(!s.order&&s.mode==='manual'){
    const cmd=catalog.robot.commands.find(c=>c.id===s.robot.command);
    if(cmd?.moves.length){const ft=s.robot.progress*(cmd.moves.length-1),idx=Math.floor(ft);tcp=Vector3.Lerp(world(cmd.moves[idx].p),world(cmd.moves[Math.min(idx+1,cmd.moves.length-1)].p),ft-idx);}
   }
   const shoulder=base.add(V(0,.13,0)),wrist=tcp.add(V(0,.08,0)),elbow=base.add(V(-.22,.40,.09));
   const points=[base,shoulder,elbow,Vector3.Lerp(elbow,wrist,.82),wrist,tcp];joints.forEach((j,i)=>j.position=points[i]);links.forEach((l,i)=>placeRod(l,joints[i].position,joints[i+1].position));gripper.position=tcp;
   joints.forEach((j,i)=>{j.setEnabled(false);const housing=jointHousings[i],cap=jointCaps[i];housing.position=j.position.clone();housing.rotation.x=Math.PI/2;cap.position=j.position.add(V(0,0,-(i<3?.051:.038)));cap.rotation.x=Math.PI/2;});
   links.forEach((l,i)=>collars[i].forEach((c,k)=>{const a=points[i],b=points[i+1];c.position=Vector3.Lerp(a,b,k?.90:.10);c.rotationQuaternion=l.rotationQuaternion;}));
   const cablePath=Array.from({length:9},(_,i)=>{const t=i/8,p=Vector3.Lerp(elbow,tcp,t);return p.add(V(.04*Math.sin(Math.PI*t),.075*Math.sin(Math.PI*t),.045));});MeshBuilder.CreateTube('cabo ferramenta UR',{path:cablePath,instance:robotCable});
   const gap=frame.open?.065:frame.gripKind==='lamina'?.0345:frame.gripKind==='lid'?.052:.0495;jawLeft.position.x=-gap;jawRight.position.x=gap;
   payloads(frame);
  }scene.render();
 }
 engine.runRenderLoop(renderFrame);
 function inspect(){
  renderFrame();
  const point=node=>{node.computeWorldMatrix(true);return node.getAbsolutePosition().asArray();};
  const active=node=>({name:node.name,owner:node.metadata?.owner,parent:node.parent?.name||null,position:point(node)});
  const stockGaps=stockMeshes.flatMap((b,i)=>b.isEnabled()?[Math.abs(point(b)[1]-geometry.blockBottom-stockPlates[i].getBoundingInfo().boundingBox.maximumWorld.y)]:[]);
  const laminaGaps=laminaColors.flatMap(c=>{const visible=laminaStacks[c].filter(m=>m.isEnabled());let top=laminaSupports[c].getBoundingInfo().boundingBox.maximumWorld.y;return visible.map(m=>{const bounds=m.getBoundingInfo().boundingBox,gap=Math.abs(bounds.minimumWorld.y-top);top=bounds.maximumWorld.y;return gap;});});
  return {graphics:{quality,contactOcclusion:!!ao,environmentMeshes:laboratory.objects.filter(m=>m.isEnabled()).length,meshCount:scene.meshes.length,fps:engine.getFps(),camera:camera.position.asArray(),cameraRadius:camera.radius},frame:lastVisualFrame,bases:assembled.filter(b=>b.isEnabled()).map(active),rack:expMeshes.flat().filter(b=>b.isEnabled()).map(active),lamina:carriedLam.isEnabled()?active(carriedLam):null,lid:carriedLid.isEnabled()?active(carriedLid):null,tools:{stock:point(stockTool),process:point(suctionAnchor),robot:point(gripper),expedition:point(expFork)},supportTop:{stock:stockPlate.getBoundingInfo().boundingBox.maximumWorld.y,expedition:expPlate.getBoundingInfo().boundingBox.maximumWorld.y},contacts:{stockMaxGap:Math.max(0,...stockGaps),laminaMaxGap:Math.max(0,...laminaGaps)}};
 }
 scene.onPointerObservable.add(p=>{if(p.type===1&&p.pickInfo?.pickedMesh?.metadata?.station)onSelect(p.pickInfo.pickedMesh.metadata.station);});
 floor.receiveShadows=true;
 for(const mesh of scene.meshes){
  if(/gabinete|^perfil$|^porta$|^tampo$|^coluna|^elo |junta UR|^base UR3e$|^parede$|^eixo|^pórtico|^corpo EGH$|console|rack rede|^base$|^parede$|prateleira/.test(mesh.name))shadow.addShadowCaster(mesh);
  if(/^tampo$|^porta$|^longarina$/.test(mesh.name))mesh.receiveShadows=true;
 }
 new ResizeObserver(resize).observe(canvas);window.addEventListener('resize',resize);
 return {update,inspect,environment:show=>laboratory.visible(show),quality(value){quality=value==='economy'?'economy':'high';pipeline.samples=quality==='high'?4:1;shadow.setDarkness(quality==='high'?.42:0);sun.shadowEnabled=quality==='high';reflection.cubeTexture.level=quality==='high'?.24:0;if(ao){scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline('oclusão de contato',[camera]);if(quality==='high')scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('oclusão de contato',[camera]);}resize();},view(id){
  camera.inertialRadiusOffset=0;camera.inertialAlphaOffset=0;camera.inertialBetaOffset=0;camera.inertialPanningX=0;camera.inertialPanningY=0;
  if(id==='room'){camera.setTarget(V(.05,1.03,.05));camera.alpha=-Math.PI/2-.30;camera.beta=1.23;camera.radius=Math.max(5,6.8/(canvas.clientWidth/canvas.clientHeight));return;}
  if(id==='all'){camera.setTarget(V(0,.87,0));camera.alpha=-Math.PI/2-.40;camera.beta=1.20;camera.radius=overviewRadius();}else if(id==='top'){camera.setTarget(V(0,.9,0));camera.alpha=-Math.PI/2;camera.beta=.13;camera.radius=Math.max(3.5,overviewRadius());}else if(id==='front'){camera.setTarget(V(0,.8,0));camera.alpha=-Math.PI/2;camera.beta=1.5;camera.radius=overviewRadius();}else{const s=catalog.stations.find(s=>s.id===id);camera.setTarget(V(s.x,1.05,0));camera.radius=1.8;camera.beta=1.0;camera.alpha=-Math.PI/2-.4;}
 },labels(show){labels.forEach(m=>m.setEnabled(show));}};
}
