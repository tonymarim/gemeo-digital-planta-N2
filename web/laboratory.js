import {MeshBuilder,StandardMaterial,DynamicTexture,Color3,Vector3,Texture} from '@babylonjs/core';

// Architectural reconstruction from the ten N2 photographs (28 October 2026).
// Room dimensions are visual estimates. No photograph or person is embedded.
export function createLaboratory(scene){
 const V=(x,y,z)=>new Vector3(x,y,z),objects=[];
 const material=(name,color,spec=.12)=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(spec,spec,spec);m.specularPower=80;return m;};
 const wall=material('pintura branco quente','#e5e4dd'),alu=material('caixilho anodizado','#bdc5c7',.65),red=material('faixa vermelha divisória','#bc201c'),black=material('mobiliário grafite','#202528'),desk=material('tampo sala adjacente','#deddd1'),woodEdge=material('rodapé madeira','#766049');
 function box(n,x,y,z,w,h,d,m){const b=MeshBuilder.CreateBox(n,{width:w,height:h,depth:d},scene);b.position.set(x,y,z);b.material=m;b.receiveShadows=true;b.isPickable=false;objects.push(b);return b;}
 function texture(name,w,h,paint){const t=new DynamicTexture(name,{width:w,height:h},scene,true);const c=t.getContext();paint(c,w,h);t.update(false);t.anisotropicFilteringLevel=8;return t;}
 // Deterministic wood grain: longitudinal fibres and staggered ceramic plank joints.
 let seed=4702;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const tex=texture('porcelanato amadeirado',1024,1024,(c,w,h)=>{
  c.fillStyle='#685b4a';c.fillRect(0,0,w,h);
  for(let row=0;row<8;row++)for(let col=-1;col<3;col++){
   const x=row*128+2,y=col*512+(row%3)*170,b=112+rnd()*31;
   c.fillStyle=`rgb(${b+24},${b+5},${b-19})`;c.fillRect(x,y+2,125,509);
   for(let k=0;k<140;k++){const xx=x+rnd()*123;c.strokeStyle=`rgba(${rnd()>.5?'58,39,21':'235,216,178'},${.03+rnd()*.12})`;c.lineWidth=.4+rnd()*1.2;c.beginPath();c.moveTo(xx,y);c.bezierCurveTo(xx+Math.sin(k)*4,y+160,xx+Math.cos(k)*3,y+340,xx,y+510);c.stroke();}
   c.strokeStyle='rgba(240,222,190,.25)';c.strokeRect(x+.5,y+2.5,124,508);
  }
 });tex.wrapU=Texture.WRAP_ADDRESSMODE;tex.wrapV=Texture.WRAP_ADDRESSMODE;tex.uScale=4;tex.vScale=2;
 const timber=material('piso porcelanato madeira','#ffffff',.22);timber.diffuseTexture=tex;timber.specularPower=110;
 const floor=box('piso real amadeirado',0,-.035,-.1,7,.06,6,timber);
 const rear=box('parede branca laboratório',0,1.55,1.1,5.7,3.1,.08,wall);
 box('rodapé traseiro',0,.065,1.045,5.7,.13,.025,woodEdge);
 // TV above the assembly station, sockets, conduit and electrical cabinet.
 box('TV moldura',.1,2.17,1.025,1.1,.66,.055,black);
 const screen=material('TV desligada','#182127',.6);box('TV vidro',.1,2.18,.992,1.04,.59,.008,screen);
 const socket=material('tomadas e eletroduto','#f1f0e9');
 for(const x of [-1.8,.9,1.9]){box('eletroduto parede',x,1.0,1.035,.014,1.9,.014,socket);box('tomada parede',x,.74,1.013,.065,.09,.025,socket);box('miolo tomada',x,.74,.998,.022,.026,.005,alu);}
 box('quadro elétrico parede',-1.99,1.48,1.0,.39,.94,.17,socket);box('fechadura quadro',-1.84,1.48,.907,.012,.07,.018,alu);
 // Window wall at stock end; late daylight is warm through the exterior brise.
 const windowMat=material('vidro janela','#afa49a',.5);windowMat.alpha=.52;windowMat.backFaceCulling=false;
 const side=[];const sideBox=(...a)=>{const m=box(...a);side.push(m);return m;};
 for(let z=-1.4;z<1;z+=.6){sideBox('janela vidro',-2.4,1.76,z,.015,2.45,.58,windowMat);sideBox('montante janela',-2.38,1.76,z-.3,.045,2.5,.025,alu);}
 for(const y of [.52,1.37,2.22,3])sideBox('travessa janela',-2.38,y,-.5,.045,.04,2.5,alu);
 const brise=material('brise externo terracota','#a47866');for(let z=-1.65;z<.9;z+=.26)sideBox('brise fachada',-2.54,1.65,z,.10,2.65,.14,brise);
 sideBox('ar condicionado janela',-2.30,2.44,-.92,.23,.39,.52,desk);for(let i=0;i<12;i++)sideBox('veneziana ar condicionado',-2.175,2.30+i*.024,-.92,.006,.009,.45,alu);
 // Tall black network rack and UPS visible beside stock in the photographs.
 const rack=box('rack rede gabinete',-1.97,.98,-.12,.43,1.96,.49,black);
 const rackGlass=material('rack vidro fumê','#283035',.5);rackGlass.alpha=.68;
 box('rack porta vidro',-1.97,1,-.374,.36,1.82,.009,rackGlass);
 const blue=material('LED azul','#2462ad');blue.emissiveColor=Color3.FromHexString('#126ada');
 for(let i=0;i<16;i++){box('equipamento rede',-1.97,.25+i*.095,-.37,.31,.053,.014,black);for(let j=0;j<7;j++)box('porta switch',-2.075+j*.031,.25+i*.095,-.383,.018,.012,.005,alu);if(i%3===0)box('LED rack',-1.82,.25+i*.095,-.388,.008,.008,.006,blue);}
 box('nobreak',-1.63,.29,.02,.18,.58,.28,black);box('display nobreak',-1.63,.49,-.125,.06,.035,.004,blue);
 // Glazed partition and adjacent classroom. Front-facing panes form a cutaway.
 const glass=material('vidro divisória','#c9dcdf',.6);glass.alpha=.13;glass.backFaceCulling=false;glass.disableDepthWrite=true;
 const partition=[];
 const pane=(...args)=>{const m=box(...args);partition.push(m);return m;};
 for(let z=-2.25;z<1.2;z+=.75){pane('vidro lateral sala',2.5,1.5,z,.012,3,.73,glass);pane('montante divisória',2.5,1.5,z-.375,.035,3.0,.035,alu);for(const y of [1.02,1.16])pane('faixa vermelha vidro',2.48,y,z,.008,.065,.75,red);}
 for(const y of [.035,3])pane('trilho divisória',2.5,y,-.75,.045,.045,3.75,alu);
 for(const z of [-1.10,-.94])pane('puxador porta vidro',2.46,1.0,z,.035,.24,.025,socket);
 box('piso sala adjacente',3.5,-.025,-.1,2,.05,6,timber);
 for(const z of [-1.7,-.1,.95]){
  box('mesa laboratório adjacente',3.5,.74,z,1.35,.045,.65,desk);
  for(const dx of [-.58,.58])for(const dz of [-.24,.24])box('pé mesa',3.5+dx,.36,z+dz,.035,.72,.035,black);
  for(const x of [3.12,3.83]){box('monitor sala',x,1.0,z+.12,.38,.25,.035,black);box('haste monitor',x,.84,z+.12,.025,.11,.025,black);box('base monitor',x,.77,z+.12,.19,.02,.12,black);box('assento cadeira',x,.45,z-.55,.36,.06,.34,black);box('encosto cadeira',x,.67,z-.72,.34,.40,.04,black);box('pedestal cadeira',x,.23,z-.55,.04,.42,.04,alu);}
 }
 // Overhead luminous panels: geometry supplements the actual scene lights.
 const luminous=material('difusor LED teto','#fff4db');luminous.emissiveColor=new Color3(.9,.87,.77);
 const ceiling=[];for(const x of [-1.1,1.1])for(const z of [-1.2,.4]){const p=box('luminária laboratório',x,3.05,z,.65,.025,.48,luminous);ceiling.push(p);}
 let visible=true;
 return {floor,objects,visible(value){visible=value;objects.forEach(m=>{if(m!==floor)m.setEnabled(value);});},update(camera){
  if(!visible)return;
  // Keep the subject inspectable from outside the reconstructed room.
  rear.setEnabled(camera.position.z<1.02);side.forEach(m=>m.setEnabled(camera.position.x>-2.3));
  partition.forEach(m=>m.setEnabled(camera.position.x<2.4));ceiling.forEach(m=>m.setEnabled(camera.position.y<2.8));
 }};
}
