import {MeshBuilder,StandardMaterial,DynamicTexture,Color3,Vector3,TransformNode} from '@babylonjs/core';

export function detailEquipment(scene,catalog,{box,cyl,mat,metal,dark,black,cyan,lights}){
 const V=(x,y,z)=>new Vector3(x,y,z),steel=mat('aço escovado','#bdc1c2'),bolt=mat('parafuso aço','#71797c'),blueTube=mat('tubo pneumático azul','#2389ba');
 metal.specularColor=new Color3(.65,.67,.68);metal.specularPower=110;
 steel.specularColor=new Color3(.8,.8,.8);steel.specularPower=130;
 dark.diffuseColor=Color3.FromHexString('#33383b');dark.specularColor=new Color3(.3,.3,.3);
 cyan.diffuseColor=Color3.FromHexString('#86b9cb');
 function texMat(name,w,h,paint){const t=new DynamicTexture(name,{width:w,height:h},scene,true);paint(t.getContext(),w,h);t.update(true);t.anisotropicFilteringLevel=8;const m=new StandardMaterial(name,scene);m.diffuseTexture=t;m.specularColor=new Color3(.22,.22,.22);m.specularPower=100;return m;}
 const panelArt=texMat('IHM Siemens em operação',1024,640,(c,w,h)=>{
  c.fillStyle='#77858e';c.fillRect(0,0,w,h);c.fillStyle='#e3e8e9';c.font='bold 28px Arial';c.fillText('SIEMENS',28,39);c.font='20px Arial';c.fillText('SIMATIC HMI',760,39);
  c.fillStyle='#151d22';c.fillRect(35,65,954,485);c.fillStyle='#c9dbe0';c.fillRect(52,83,920,447);
  c.fillStyle='#126378';c.fillRect(52,83,920,62);c.fillStyle='white';c.font='bold 27px Arial';c.fillText('SMART 4.0  |  CONTROLE DA ESTAÇÃO',75,124);
  c.fillStyle='#526970';c.font='22px Arial';c.fillText('MODO AUTOMÁTICO',82,190);c.fillText('ESTADO DO EQUIPAMENTO',82,275);
  for(let i=0;i<4;i++){c.fillStyle=['#6e9e72','#bac7ca','#bac7ca','#bac7ca'][i];c.fillRect(82+i*218,310,194,100);c.fillStyle='#223e47';c.fillText(['Iniciar','Parar','Sensores','Ajustes'][i],101+i*218,369);}
  c.fillStyle='#45636d';c.font='19px Arial';c.fillText('Rede PROFINET   •   Operação didática',82,482);
  for(let i=0;i<8;i++){c.fillStyle='#c6d0d4';c.fillRect(75+i*115,579,80,35);}
 });
 function wire(name,points,color=black,radius=.003){const m=MeshBuilder.CreateTube(name,{path:points.map(p=>V(...p)),radius,tessellation:8},scene);m.material=color;return m;}
 function label(text,x,y,z,w,h){const m=texMat('placa '+text,512,128,(c)=>{c.fillStyle='#e7e7df';c.fillRect(0,0,512,128);c.fillStyle='#232b2d';c.font='bold 38px Arial';c.fillText(text,16,80);});const p=MeshBuilder.CreatePlane(text,{width:w,height:h},scene);p.position.set(x,y,z);p.material=m;return p;}
 // Replace the flat schematic consoles with inclined housings and panel hardware.
 const oldNames=['console IHM','KTP700','display','botoeira','emergência base','emergência'];
 scene.meshes.filter(m=>oldNames.includes(m.name)).forEach(m=>m.setEnabled(false));
 for(const [i,s] of catalog.stations.entries()){
  const {x,width:w}=s;
  const root=new TransformNode('console inclinado '+s.id,scene);root.position.set(x,.83,-.49);root.rotation.x=-.55;
  box('caixa console grafite',0,0,0,w*.84,.075,.235,dark,root);
  box('painel alumínio console',0,.041,0,w*.84-.008,.006,.23,steel,root);
  const screen=box('IHM Siemens',-w*.13,.048,-.005,w*.48,.014,.199,black,root);
  const face=MeshBuilder.CreatePlane('face IHM Siemens',{width:w*.45,height:.187},scene);face.parent=root;face.position.set(-w*.13,.057,-.005);face.rotation.x=Math.PI/2;face.material=panelArt;
  for(const dx of [-w*.39,w*.39])for(const z of [-.1,.1])cyl('fixação console',dx,.046,z,.006,.004,bolt,root);
  const green=mat('botão verde','#169c79'),red=mat('red','#d92c2b'),yellow=mat('base emergência amarela','#ecd010');
  for(const [j,m] of [cyan,green,red].entries()){cyl('anel cromado botão',w*.19,.05,-.072+j*.052,.029,.012,steel,root);cyl('botão comando',w*.19,.06,-.072+j*.052,.021,.014,m,root);}
  cyl('anel seletor',w*.32,.05,.067,.029,.012,steel,root);box('seletor preto',w*.32,.066,.067,.009,.02,.026,black,root);
  cyl('colar emergência',w*.33,.053,-.06,.048,.021,yellow,root);cyl('cogumelo emergência',w*.33,.075,-.06,.033,.025,red,root);
  lights[s.id].parent=root;lights[s.id].position.set(w*.32,.06,.02);
  // Smoked front doors, silver locks, branded graphics and recessed framing.
  scene.meshes.filter(m=>m.name==='porta'&&Math.abs(m.position.x-x)<w/2).forEach(m=>{
   m.material=mat('porta vidro bronze','#242322');m.material.specularColor=new Color3(.48,.43,.35);m.material.specularPower=110;
  });
  const front=texMat('identificação '+s.id,512,768,(c)=>{
   c.clearRect(0,0,512,768);c.fillStyle='#a8d052';c.font='bold 47px Arial';c.fillText('SMART 4.0',110,130);
   c.save();c.translate(54,690);c.rotate(-Math.PI/2);c.font='bold 42px Arial';c.fillText(s.name.toUpperCase(),0,0);c.restore();
   c.fillStyle='#dfdfdc';c.font='bold 31px Arial';c.fillText('SENAI',110,688);c.font='24px Arial';c.fillText('Industrial',232,688);c.fillStyle='#a8d052';c.fillRect(95,710,370,4);
   for(const [j,color] of ['#d03b34','#2d77b2','#d8c13e'].entries()){c.fillStyle=color;c.fillRect(225+j*29,38+j*12,27,35);}
  });front.diffuseTexture.hasAlpha=true;front.useAlphaFromDiffuseTexture=true;front.backFaceCulling=false;
  const graphic=MeshBuilder.CreatePlane('serigrafia gabinete',{width:w*.88,height:.66},scene);graphic.position.set(x,.45,-.383);graphic.material=front;
  scene.meshes.filter(m=>m.name==='label'&&Math.abs(m.position.x-x)<w/2&&m.position.z>-.4).forEach(m=>m.setEnabled(false));
  cyl('fechadura gabinete',x-w*.36,.70,-.393,.016,.008,steel).rotation.x=Math.PI/2;
  box('travessa inferior gabinete',x,.075,-.39,w-.025,.028,.025,dark);
  // Flanged conveyor motors and pneumatic manifolds on the front side.
  const mx=x+w*.23;
  box('placa motor',mx,.94,-.265,.13,.16,.015,dark);
  const motor=cyl('motor esteira',mx,.94,-.345,.067,.12,black);motor.rotation.x=Math.PI/2;
  const flange=cyl('flange motor',mx,.94,-.407,.074,.014,steel);flange.rotation.x=Math.PI/2;
  for(let j=0;j<8;j++)box('aleta motor',mx-.027+j*.0077,.94,-.345,.002,.057,.095,black);
  for(const dx of [-.047,.047])for(const dy of [-.059,.059]){const b=cyl('parafuso placa motor',mx+dx,.94+dy,-.276,.008,.008,steel);b.rotation.x=Math.PI/2;}
  box('bloco válvulas',x-.16,.94,-.13,.09,.035,.055,metal);
  for(let j=0;j<4;j++){cyl('conexão pneumática',x-.19+j*.02,.968,-.13,.012,.025,black);wire('mangueira pneumática',[[x-.19+j*.02,.979,-.13],[x-.2+j*.02,1.0,-.07],[x-.24+j*.02,.95,.03],[x-.22+j*.02,.928,.12]],j%2?blueTube:mat('tubo branco','#d8d7cb'),.002);}
  wire('cabo motor',[[mx,.93,-.41],[mx+.04,.87,-.43],[x+.12,.923,-.12],[x+.04,.923,.1]],black,.004);
  for(const z of [-.38,.38])for(const dx of [-w/2+.05,w/2-.05]){
   box('cantoneira bancada',x+dx,.935,z,.038,.03,.03,metal);cyl('parafuso bancada',x+dx,.953,z,.007,.006,bolt);
  }
  label('SMART 4.0 · '+String(i+1).padStart(2,'0'),x,.975,-.394,.125,.017);
 }
 // Brushed return discs with a black perimeter, replacing the tubular U-turn.
 scene.meshes.filter(m=>m.name==='giro 180°').forEach(m=>m.setEnabled(false));
 for(const x of [-1.435,1.435]){
  cyl('carcaça giro esteira',x,1.002,-.275,.188,.069,metal);
  cyl('anel borracha giro',x,1.037,-.275,.184,.012,black);
  cyl('disco retorno aço',x,1.045,-.275,.143,.009,steel);
  cyl('centro disco retorno',x,1.051,-.275,.022,.004,bolt);
 }
 // Cabinet end frames have open centres as on the photographed equipment.
 for(const x of [-1.47,1.47]){
  for(const z of [-.385,.385])box('lateral estrutura perna',x,.45,z,.065,.85,.07,dark);
  for(const y of [.07,.87])box('lateral travessa moldura',x,y,0,.065,.085,.78,dark);
  for(const z of [-.35,.35])for(const y of [.1,.83]){const b=cyl('parafuso lateral',x+(x<0?-.035:.035),y,z,.016,.005,black);b.rotation.z=Math.PI/2;}
 }
 // Cable chains and rear extrusion grooves make the three linear axes legible.
 for(const [x,z,h] of [[-1.05,.04,.70],[1.04,.07,.67]]){
  for(const dx of [-.014,.014])box('canal perfil eixo',x+dx,1.27,z-.024,.003,h,.002,black);
  for(let j=0;j<18;j++)box('elo esteira porta cabos',x+.052,1.0+j*.031,z+.045,.036,.025,.035,black);
 }
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  const x=.82+col*.145,y=1.405-row*.18;
  for(const dx of [-.053,.053])box('guia berço expedição',x+dx,y+.011,.26,.009,.018,.14,steel);
 }
 return {wire,steel,black};
}
