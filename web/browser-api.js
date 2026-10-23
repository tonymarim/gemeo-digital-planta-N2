import {Twin} from '../model.mjs';
import {acceptance} from '../commissioning.mjs';
import {io,stations,colors,fidelity} from '../data/catalog.mjs';
import robot from '../data/robot.json';
import sources from '../data/sources.json';

// Cada visitante tem um modelo isolado. Nenhuma chamada a PLC ou servidor de controle.
let twin;
function initialize(){
 if(twin)return;
 twin=new Twin(robot);let previous=performance.now(),accumulator=0;
 setInterval(()=>{const now=performance.now();accumulator+=Math.min((now-previous)/1000,.25)*twin.speed;previous=now;while(accumulator>=.05){twin.tick(.05);accumulator-=.05;}},25);
}
export async function request(url,data){
 initialize();
 switch(url){
  case '/api/catalog':return {io,stations,colors,fidelity,robot,sources};
  case '/api/state':return structuredClone(twin.state());
  case '/api/action':return structuredClone(twin.action(data));
  case '/api/commission':return {...acceptance(robot),configuration:structuredClone(twin.config),sources,note:'Ensaios isolados com configuração padrão. Executados no navegador; nenhum relatório enviado a servidor.'};
  default:throw Error('Recurso indisponível na demonstração.');
 }
}
export function downloadTrace(){
 const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
 const csv='\ufeffseq;tempo_s;evento;etapa;mensagem\r\n'+twin.events.map(e=>[e.seq,e.t,e.code,e.phase,e.message].map(quote).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='rastreio-n2-demo.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
