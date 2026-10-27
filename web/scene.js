import {Engine,Scene,ArcRotateCamera,Vector3,Color3,Color4,HemisphericLight,DirectionalLight,MeshBuilder,StandardMaterial,DynamicTexture,TransformNode,Quaternion,DefaultRenderingPipeline,ShadowGenerator} from '@babylonjs/core';

export function createPlant(canvas,catalog,onSelect){
 const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});
 let quality='high';
 function resize(){
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  const ratio=quality==='high'?Math.min(window.devicePixelRatio||1,2,Math.sqrt(3000000/(width*height))):1;
  engine.setHardwareScalingLevel(1/ratio);engine.resize();
 }
 resize();
 const scene=new Scene(engine);scene.clearColor=new Color4(.82,.87,.9,1);scene.ambientColor=new Color3(.12,.12,.12);
 const overviewRadius=()=>Math.max(3.3,4.5/(canvas.clientWidth/canvas.clientHeight));
 const camera=new ArcRotateCamera('orbit',-Math.PI/2-.25,1.28,overviewRadius(),new Vector3(0,.78,0),scene);
 camera.attachControl(canvas,false);camera.lowerRadiusLimit=.85;camera.upperRadiusLimit=9;
 camera.wheelDeltaPercentage=.006;camera.pinchDeltaPercentage=.003;camera.inertia=.75;camera.panningInertia=.65;
 camera.minZ=.02;camera.panningSensibility=1600;camera.lowerBetaLimit=.12;camera.upperBetaLimit=1.55;
 const pipeline=new DefaultRenderingPipeline('qualidade',false,scene,[camera]);
 pipeline.samples=4;pipeline.fxaaEnabled=true;pipeline.imageProcessingEnabled=false;
 const hemi=new HemisphericLight('sky',new Vector3(.3,1,-.5),scene);hemi.intensity=.85;hemi.groundColor=new Color3(.35,.4,.45);
 const sun=new DirectionalLight('sun',new Vector3(-.4,-1,.5),scene);sun.intensity=.5;sun.position=new Vector3(1.5,4,-2);
 sun.autoCalcShadowZBounds=true;
 const shadow=new ShadowGenerator(1024,sun);shadow.usePercentageCloserFiltering=true;shadow.bias=.0005;shadow.normalBias=.015;shadow.setDarkness(.25);
 const materials={};
 function mat(name,hex){if(materials[name])return materials[name];const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.16,.16,.16);m.specularPower=48;materials[name]=m;return m;}
 const metal=mat('aluminum','#a8b7bf'),dark=mat('frame','#26313a'),black=mat('black','#141d25'),deck=mat('deck','#bac6cd'),rubber=mat('rubber','#323c43'),lime=mat('lime','#b9da4e'),cyan=mat('urblue','#65bed4'),white=mat('white','#e2e8eb');
 const V=(x,y,z)=>new Vector3(x,y,z);
 function box(name,x,y,z,w,h,d,m,parent){const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);mesh.position.set(x,y,z);mesh.material=m;if(parent)mesh.parent=parent;return mesh;}
 function cyl(name,x,y,z,d,h,m,parent){const mesh=MeshBuilder.CreateCylinder(name,{diameter:d,height:h,tessellation:32},scene);mesh.position.set(x,y,z);mesh.material=m;if(parent)mesh.parent=parent;return mesh;}
 function placeRod(r,a,b){const diff=b.subtract(a);r.position=Vector3.Center(a,b);r.scaling.y=diff.length();r.rotationQuaternion=Quaternion.FromUnitVectorsToRef(Vector3.Up(),diff.normalize(),new Quaternion());}
 function textPanel(text,x,y,z,w,h,bg='#1d2a33',fg='#c3e366',size=60){const tex=new DynamicTexture('label-'+text,{width:1024,height:256},scene,false);tex.hasAlpha=false;tex.drawText(text,null,165,`600 ${size}px Segoe UI`,fg,bg,true);const m=new StandardMaterial('label-'+text,scene);m.diffuseTexture=tex;m.emissiveColor=new Color3(.45,.45,.45);m.backFaceCulling=false;const p=MeshBuilder.CreatePlane('label',{width:w,height:h},scene);p.position.set(x,y,z);p.material=m;return p;}
 const floor=box('piso',0,-.028,0,10,.04,7,mat('floor','#c9d5dc'));
 const gridLines=[];
 for(let x=-4;x<=4;x+=.25)gridLines.push([V(x,-.004,-3),V(x,-.004,3)]);
 for(let z=-3;z<=3;z+=.25)gridLines.push([V(-4,-.004,z),V(4,-.004,z)]);
 const grid=MeshBuilder.CreateLineSystem('grade',{lines:gridLines},scene);grid.color=new Color3(.52,.62,.68);grid.alpha=.12;grid.isPickable=false;
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
  feeds[s.id]=box('alimentador',x,1.035,-.10,.065,.035,.10,metal);
  stoppers[s.id]=[box('stopper',x+.14,1.05,-.34,.012,.055,.065,black),box('stopper',x+.14,1.05,-.21,.012,.055,.065,black)];
  box('RFID',x+.11,1.033,-.405,.045,.025,.025,mat('RFID','#ecba44'));
  const label=textPanel(`${String(i+1).padStart(2,'0')}   ${s.name.toUpperCase()}`,x,.13,-.61,w*.85,.075,'#263540','#d4e3ed',67);label.metadata={station:s.id};labels.push(label);
 }
 for(const x of [-1.435,1.435]){
  const arc=[];for(let i=0;i<=24;i++){const a=-Math.PI/2+Math.PI*i/24;arc.push(V(x+(x<0?-1:1)*.065*Math.cos(a),1.01,-.275+.065*Math.sin(a)));}
  MeshBuilder.CreateTube('giro 180°',{path:arc,radius:.04,tessellation:24},scene).material=rubber;
 }
 const stockMeshes=[];
 function stockPoint(index){const row=Math.floor(index/7),col=index%7,a=(15+col*25)*Math.PI/180;return V(-1.05-.27*Math.cos(a),1.43-row*.105,.03+.29*Math.sin(a));}
 for(let i=0;i<28;i++){const p=stockPoint(i);const plate=box('posição estoque '+(i+1),p.x,p.y-.035,p.z,.095,.012,.105,dark);plate.rotation.y=(i%7-3)*-.20;stockMeshes.push(block('base estoque',p.x,p.y,p.z,'azul'));}
 for(let col of [0,3,6]){const p=stockPoint(col);box('suporte magazine',p.x,1.15,p.z,.018,.5,.018,metal);}
 box('coluna estoque',-1.05,1.27,.04,.045,.70,.045,metal);
 const stockTool=new TransformNode('armazenador estoque',scene);box('carro vertical',0,0,0,.075,.065,.075,dark,stockTool);box('braço radial',0,0,.11,.025,.025,.23,metal,stockTool);box('garra estoque',0,-.025,.22,.09,.035,.05,metal,stockTool);
 // Pórtico cartesiano do processo e seis magazines de lâminas.
 for(const x of [-.70,-.2])box('pórtico coluna',x,1.12,.19,.03,.43,.03,metal);
 box('eixo X processo',-.45,1.34,.19,.56,.04,.045,dark);
 const processTool=new TransformNode('manipulador processo',scene);
 box('carro X',0,0,0,.07,.075,.07,metal,processTool);box('eixo Y',0,-.02,-.08,.025,.03,.23,dark,processTool);const processZ=box('pneumático Z',0,-.09,-.12,.035,.17,.035,metal,processTool);const suction=cyl('ventosa',0,-.18,-.12,.025,.015,black,processTool);
 const laminaColors=Object.keys(catalog.colors);
 laminaColors.forEach((c,i)=>{const x=-.67+i*.085;box('magazine '+c,x,.956,.08,.065,.07,.065,dark);for(let j=0;j<5;j++)box('lâmina '+c,x,.99+j*.004,.08,.052,.003,.05,mat(c,catalog.colors[c]));});
 for(const z of [-.02,.28])for(let i=0;i<3;i++)box('depósito lâmina',-.57+i*.12,.94,z,.065,.018,.06,black);
 // Base de montagem: B3 esquerda, B2 centro, B1 direita (foto Posições_Robô).
 const fixtures={1:V(.57,.965,.29),2:V(.38,.965,.29),3:V(.19,.965,.29)};
 Object.entries(fixtures).forEach(([n,p])=>{box('berço B'+n,p.x,p.y-.015,p.z,.14,.025,.15,dark);textPanel('B'+n,p.x,p.y+.02,p.z-.081,.05,.023,'#26313a','#dce5e9');});
 box('magazine tampas',.02,1.02,.30,.11,.20,.12,white);
 for(let i=0;i<7;i++)box('tampa',.02,.94+i*.016,.29,.095,.008,.09,dark);
 const ramp=box('rampa de alimentação',-.035,1.02,-.015,.13,.025,.30,metal);ramp.rotation.x=.37;
 box('câmera suporte',.65,1.13,.05,.022,.40,.022,metal);box('VISOR',.65,1.35,.015,.09,.06,.05,black);const lens=cyl('lente VISOR',.65,1.35,-.02,.035,.04,mat('lens','#496a81'));lens.rotation.x=Math.PI/2;
 box('teach pendant',.58,.82,-.54,.22,.045,.17,cyan);box('teach tela',.58,.85,-.54,.17,.008,.12,materials.display);
 // Robô visual: pontos TCP reais, elos ilustrativos (não é cinemática UR certificada).
 const base=V(.36,.95,.035);cyl('base UR3e',base.x,base.y,base.z,.128,.06,metal);
 const joints=Array.from({length:6},(_,i)=>{const m=MeshBuilder.CreateSphere('junta '+(i+1),{diameter:i<3?.09:.065,segments:24},scene);m.material=cyan;return m;});
 const links=Array.from({length:5},(_,i)=>cyl('elo '+i,0,0,0,i<2?.067:.047,1,white));
 const gripper=new TransformNode('SCHUNK EGH',scene);box('corpo EGH',0,0,0,.065,.075,.045,metal,gripper);box('dedo esquerdo',-.03,-.05,0,.014,.055,.025,dark,gripper);box('dedo direito',.03,-.05,0,.014,.055,.025,dark,gripper);
 const world=p=>V(base.x+p[0],base.y+p[2],base.z-p[1]);
 const expMeshes=[];
 function rackPoint(i){return V(.82+(i%4)*.14,1.44-Math.floor(i/4)*.16,.26);}
 for(let row=0;row<3;row++)box('prateleira expedição',1.03,1.405-row*.16,.26,.58,.014,.14,dark);
 for(const x of [.76,1.31])box('coluna expedição',x,1.2,.28,.025,.60,.025,metal);
 for(let i=0;i<12;i++){const p=rackPoint(i);expMeshes.push(Array.from({length:3},(_,j)=>{const b=block('pedido '+(i+1)+' andar '+j,p.x,p.y+j*.052,p.z,'azul');b.setEnabled(false);return b;}));}
 box('eixo X expedição',1.04,.96,.07,.56,.04,.045,dark);
 const expTool=new TransformNode('armazenador expedição',scene);box('eixo Y expedição',0,.29,0,.04,.67,.04,metal,expTool);const expFork=box('garfo expedição',0,0,-.07,.11,.025,.19,metal,expTool);
 const assembled=Array.from({length:3},(_,i)=>block('bloco montagem '+i,0,0,0,'azul'));assembled.forEach(b=>b.setEnabled(false));
 const transit=block('bloco em trânsito',0,0,0,'azul');transit.setEnabled(false);
 const transitExtra=[block('andar 2 em trânsito',0,0,0,'azul'),block('andar 3 em trânsito',0,0,0,'azul')];transitExtra.forEach(b=>b.setEnabled(false));
 const carriedLam=box('lâmina manipulada',0,0,0,.055,.004,.05,materials.azul);
 function block(name,x,y,z,color){
  const root=new TransformNode(name,scene);root.position.set(x,y,z);root.parts=[];
  const m=mat(color,catalog.colors[color]);
  box('base',0,-.018,0,.085,.012,.085,m,root);
  for(const [dx,dz,w,d] of [[-.038,0,.009,.085],[.038,0,.009,.085],[0,.038,.085,.009],[0,-.038,.085,.009]])root.parts.push(box('parede',dx,.005,dz,w,.042,d,m,root));
  root.panels=[box('L1',-.044,.006,0,.002,.03,.055,white,root),box('L2',0,.006,.044,.055,.03,.002,white,root),box('L3',.044,.006,0,.002,.03,.055,white,root)];
  root.panels.forEach(p=>p.setEnabled(false));root.lid=box('tampa',0,.03,0,.09,.008,.09,dark,root);root.lid.setEnabled(false);return root;
 }
 function colorBlock(b,color){const m=mat(color,catalog.colors[color]);for(const child of b.getChildMeshes())if(child.name==='parede'||child.name==='base')child.material=m;}
 let state=null;
 function update(s){state=s;
  stockMeshes.forEach((b,i)=>{b.setEnabled(!!s.stock[i]);if(s.stock[i])colorBlock(b,s.stock[i]);});
  expMeshes.forEach((floors,i)=>floors.forEach((b,f)=>{const p=s.rack[i],r=p?.recipe[f];b.setEnabled(!!r);if(r){colorBlock(b,r.color);b.lid.setEnabled(f===p.recipe.length-1);b.panels.forEach((l,j)=>{l.setEnabled(true);l.material=mat(r.laminas[j],catalog.colors[r.laminas[j]]);});}}));
  const p=s.phase,t=p?Math.min(1,s.elapsed/p.duration):0,o=s.order;
  assembled.forEach((b,i)=>{const f=o?.bases.find(b=>b.floor===i);const loaded=f?.placed&&!['esteira','expedicao'].includes(o.location);b.setEnabled(!!loaded);if(loaded){const pos=fixtures[f.slot].clone();if(o.stacked){pos.copyFrom(fixtures[1]);pos.y+=i*.052;}b.position=pos;colorBlock(b,f.color);b.lid.setEnabled(!!o.lid&&i===o.recipe.length-1);b.panels.forEach((l,j)=>{const item=o.inserted.find(x=>x.floor===i&&x.lam===j);l.setEnabled(!!item);if(item)l.material=mat(item.color,catalog.colors[item.color]);});}});
  transit.setEnabled(false);transitExtra.forEach(b=>b.setEnabled(false));carriedLam.setEnabled(false);
  if(o&&p){
   if(['stockDeliver','feed','transport','transportFinal','expPick','expStore'].includes(p.type)){
    transit.setEnabled(true);colorBlock(transit,o.recipe[p.floor??0].color);
    let pos=V(-1.05,1.065,-.34);
    if(p.type==='stockDeliver')pos=Vector3.Lerp(stockPoint(o.bases.at(-1)?.cell??0),pos,t);
    if(p.type==='transport')pos=V(-1.05+1.4*(s.faults.jam?Math.min(.5,t):t),1.065,-.34);
    if(p.type==='transportFinal')pos=V(.35+.7*(s.faults.jam?Math.min(.5,t):t),1.065,-.34);
    if(p.type==='expPick')pos=V(1.05,1.065,-.34+.34*t);
    if(p.type==='expStore')pos=Vector3.Lerp(V(1.05,1.065,0),rackPoint(p.rack),t);
    transit.position=pos;transit.lid.setEnabled(!!o.lid&&o.recipe.length===1);
    const final=['transportFinal','expPick','expStore'].includes(p.type);
    transit.panels.forEach((l,j)=>{l.setEnabled(final);if(final)l.material=mat(o.recipe[0].laminas[j],catalog.colors[o.recipe[0].laminas[j]]);});
    if(final)transitExtra.forEach((b,i)=>{const r=o.recipe[i+1];b.setEnabled(!!r);if(r){b.position=pos.add(V(0,(i+1)*.052,0));colorBlock(b,r.color);b.lid.setEnabled(i+1===o.recipe.length-1);b.panels.forEach((l,j)=>{l.setEnabled(true);l.material=mat(r.laminas[j],catalog.colors[r.laminas[j]]);});}});
   }
   if(p.color&&['laminaVacuum','laminaDeliver','inspect'].includes(p.type)){carriedLam.setEnabled(true);carriedLam.material=mat(p.color,catalog.colors[p.color]);carriedLam.position=p.type==='inspect'?gripper.position.add(V(0,-.07,0)):processTool.position.add(V(0,-.18,-.12));}
  }
 }
 engine.runRenderLoop(()=>{
  if(state){const s=state;
   for(const b of belts)if(s.q[b.s+'.'+b.lane]&&!s.faults.jam){b.offset=(b.offset+Math.min(.05,engine.getDeltaTime()/1000)*.35*s.speed)%b.width;b.mesh.position.x=b.x+b.offset;}
   for(const st of catalog.stations){const id=st.id;feeds[id].position.z=-.10-(s.motion[id+'.feed']||0)*.14;stoppers[id].forEach((m,i)=>m.position.y=s.q[id+'.stopper'+(i+1)]?1.05:1.005);lights[id].material=s.alarm?materials.red:s.phase?.station===id&&s.status==='running'?lime:cyan;}
   const axisPoint=(axis,point)=>Vector3.Lerp(point(axis.position),point(axis.target),axis.busy?Math.min(1,axis.t/s.config.motionSeconds):1);
   const a=s.axes.estoque;stockTool.position=axisPoint(a,n=>n===29?V(-1.05,1.05,.04):stockPoint(n-1).add(V(0,.035,-.20)));stockTool.rotation.y=a.position===29?0:(a.position%7-3)*.25;
   const ap=s.axes.processo;processTool.position=axisPoint(ap,n=>{let px=-.67+(Math.min(n,6)-1)*.085,pz=.20;if(n>=9){px=-.57+((n-9)%3)*.12;pz=n<12?.10:.40;}if(n===8){px=-.2;pz=.19;}return V(px,1.34,pz);});processZ.position.y=-.09-(s.motion['processo.z']||0)*.08;suction.position.y=-.18-(s.motion['processo.z']||0)*.08;
   const ae=s.axes.expedicao;const ep=axisPoint(ae,n=>n<=12?rackPoint(n-1):V(1.25,1.05,.07));expTool.position=V(ep.x,.95,.07);expFork.position.y=ep.y-.95;
   const cmd=catalog.robot.commands.find(c=>c.id===s.robot.command);let tcp=world(catalog.robot.poses.Home_Retirada.p);
   if(cmd?.moves.length){const ft=s.robot.progress*(cmd.moves.length-1),idx=Math.floor(ft);tcp=Vector3.Lerp(world(cmd.moves[idx].p),world(cmd.moves[Math.min(idx+1,cmd.moves.length-1)].p),ft-idx);}
   const shoulder=base.add(V(0,.13,0)),wrist=tcp.add(V(0,.08,0));const elbow=base.add(V(-.22,.40,.09));
   const points=[base,shoulder,elbow,Vector3.Lerp(elbow,wrist,.82),wrist,tcp];joints.forEach((j,i)=>j.position=points[i]);links.forEach((l,i)=>placeRod(l,joints[i].position,joints[i+1].position));gripper.position=tcp;
  }scene.render();
 });
 scene.onPointerObservable.add(p=>{if(p.type===1&&p.pickInfo?.pickedMesh?.metadata?.station)onSelect(p.pickInfo.pickedMesh.metadata.station);});
 floor.receiveShadows=true;
 for(const mesh of scene.meshes){
  if(/gabinete|^perfil$|^porta$|^tampo$|^coluna|^elo |^junta |^base UR3e$|^parede$|^eixo|^pórtico|^corpo EGH$/.test(mesh.name))shadow.addShadowCaster(mesh);
  if(/^tampo$|^porta$|^longarina$/.test(mesh.name))mesh.receiveShadows=true;
 }
 new ResizeObserver(resize).observe(canvas);window.addEventListener('resize',resize);
 return {update,quality(value){quality=value==='economy'?'economy':'high';pipeline.samples=quality==='high'?4:1;shadow.setDarkness(quality==='high'?.25:0);sun.shadowEnabled=quality==='high';resize();},view(id){
  camera.inertialRadiusOffset=0;camera.inertialAlphaOffset=0;camera.inertialBetaOffset=0;camera.inertialPanningX=0;camera.inertialPanningY=0;
  if(id==='all'){camera.setTarget(V(0,.78,0));camera.alpha=-Math.PI/2-.25;camera.beta=1.28;camera.radius=overviewRadius();}else if(id==='top'){camera.setTarget(V(0,.9,0));camera.alpha=-Math.PI/2;camera.beta=.13;camera.radius=Math.max(3.5,overviewRadius());}else if(id==='front'){camera.setTarget(V(0,.8,0));camera.alpha=-Math.PI/2;camera.beta=1.5;camera.radius=overviewRadius();}else{const s=catalog.stations.find(s=>s.id===id);camera.setTarget(V(s.x,1.05,0));camera.radius=1.8;camera.beta=1.0;camera.alpha=-Math.PI/2-.4;}
 },labels(show){labels.forEach(m=>m.setEnabled(show));}};
}
