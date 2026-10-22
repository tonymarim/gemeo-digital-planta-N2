import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Twin} from './model.mjs';
import {acceptance} from './commissioning.mjs';
import {io,stations,colors,fidelity} from './data/catalog.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const robot=JSON.parse(await readFile(path.join(root,'data/robot.json'),'utf8'));
const sources=JSON.parse(await readFile(path.join(root,'data/sources.json'),'utf8'));
const twin=new Twin(robot); const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf'};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(req.method==='POST'){
   const origin=req.headers.origin;if(origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(origin))return json(res,403,{error:'Origem não permitida.'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>32768)return json(res,413,{error:'Corpo excede limite.'});}
   const body=raw?JSON.parse(raw):{};
   if(url.pathname==='/api/action')return json(res,200,twin.action(body));
   if(url.pathname==='/api/commission'){
    const report=acceptance(robot);report.configuration=twin.config;report.note='Os testes usam configuração padrão isolada; configuração da sessão anexada apenas como contexto.';report.sources=sources;
    await mkdir(path.join(root,'reports'),{recursive:true});await writeFile(path.join(root,'reports/commissioning-latest.json'),JSON.stringify(report,null,2));return json(res,200,report);
   }
   return json(res,404,{error:'Rota desconhecida.'});
  }
  if(req.method!=='GET')return json(res,405,{error:'Método não permitido.'});
  if(url.pathname==='/api/state')return json(res,200,twin.state());
  if(url.pathname==='/api/catalog')return json(res,200,{io,stations,colors,fidelity,robot,sources});
  if(url.pathname==='/api/trace'){
   const csv='seq;tempo_s;evento;etapa;mensagem\r\n'+twin.events.map(e=>[e.seq,e.t,e.code,e.phase,'"'+e.message.replaceAll('"','""')+'"'].join(';')).join('\r\n');
   res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="rastreio-n2.csv"'});return res.end('\ufeff'+csv);
  }
  const docs={'/sources/manual':'XL4002PD00.PT.MU.pdf','/sources/guia':'XL4002PD00.PT.GE.RevA.pdf'};
  let file=docs[url.pathname]?path.join(root,'../N2',docs[url.pathname]):path.resolve(root,'dist','.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!docs[url.pathname]&&!file.startsWith(path.join(root,'dist')+path.sep))return json(res,403,{error:'Caminho inválido.'});
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
 }catch(e){json(res,e.code==='ENOENT'?404:400,{error:e.code==='ENOENT'?'Arquivo não encontrado. Execute npm run build.':e.message});}
});
let last=performance.now(),accumulator=0;
const timer=setInterval(()=>{const now=performance.now();accumulator+=Math.min((now-last)/1000,.25)*twin.speed;last=now;while(accumulator>=.05){twin.tick(.05);accumulator-=.05;}},25);
server.on('close',()=>clearInterval(timer));
server.listen(port,'127.0.0.1',()=>console.log(`SMART 4.0 N2 • http://127.0.0.1:${port} • somente simulação local`));
