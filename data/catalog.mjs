export const colors = {azul:'#228ddc',vermelho:'#e84848',preto:'#28323d',branco:'#f5f5ee',amarelo:'#f6cf43',verde:'#68ba77'};
export const stations = [
 {id:'estoque',name:'Estoque',width:.6,x:-1.05,ip:'192.168.150.10',plc:'S7-1200',page:44},
 {id:'processo',name:'Processo',width:.6,x:-.45,ip:'192.168.150.20',plc:'S7-1200',page:47},
 {id:'montagem',name:'Montagem',width:.9,x:.3,ip:'192.168.150.30',plc:'S7-1500 · 6ES7512-1CK00-0AB0',page:50},
 {id:'expedicao',name:'Expedição',width:.6,x:1.05,ip:'192.168.150.40',plc:'S7-1200',page:53}
];
const io=[];
const rows=(station,dir,items)=>items.forEach(([addr,key,label])=>io.push({id:station+'.'+key,station,dir,address:'%'+dir+addr,label,source:`MU p. ${stations.find(s=>s.id===station).page}`,kind:'documentado'}));
rows('estoque','I',[
 ['0.1','safe','Emergência OK'],['0.2','feedExtended','Alimentador avançado'],['0.3','feedDelivery','Alimentador na entrega'],['0.4','feedRetracted','Alimentador recuado'],['0.5','gripOpen','Garra aberta'],['0.6','gripClosed','Garra fechada'],['0.7','positionExtended','Posicionador avançado'],['1.0','positionRetracted','Posicionador recuado'],['1.1','vacuumOK','Vacuostato'],['1.2','auto','Comutador 2 posições'],['1.3','start','Botão Start'],['1.4','stop','Botão Stop']]);
rows('estoque','Q',[
 ['0.0','feedAdvance','Avança alimentador'],['0.1','feedReturn','Recua alimentador'],['0.2','vacuum','Aciona vácuo'],['0.3','position','Avança posicionador'],['0.4','grip','Fecha garra'],['0.5','belt1','Motor esteira 1 e giro'],['0.6','belt2','Motor esteira 2'],['0.7','stopper1','Válvula 1 stopper'],['1.0','stopper2','Válvula 2 stopper'],['1.1','status','Status Smart Sense']]);
rows('processo','I',[
 ['0.1','safe','Emergência'],['0.2','zExtended','Eixo Z avançado'],['0.3','zRetracted','Eixo Z recuado'],['0.4','vacuumOK','Vacuostato manipulador'],['0.5','tableVacuumOK','Vacuostato base de gravação'],['0.6','auto','Comutador 2 posições'],['0.7','start','Botão Start'],['1.0','stop','Botão Stop']]);
rows('processo','Q',[
 ['0.0','z','Avança eixo Z'],['0.1','vacuum','Vácuo manipulador'],['0.2','tableVacuum','Vácuo base de gravação'],['0.3','belt1','Motor esteira 1 e giro'],['0.4','belt2','Motor esteira 2'],['1.1','status','Status Smart Sense']]);
rows('montagem','I',[['0.1','safe','Emergência']]);
rows('montagem','Q',[['0.0','status','Status Smart Sense']]);
rows('expedicao','I',[
 ['0.1','safe','Emergência'],['0.2','feedExtended','Alimentador avançado'],['0.3','feedRetracted','Alimentador recuado'],['0.4','vacuumOK','Vacuostato'],['0.5','auto','Comutador 2 posições'],['0.6','start','Botão Start'],['0.7','stop','Botão Stop']]);
rows('expedicao','Q',[
 ['0.0','feedAdvance','Avança alimentador'],['0.1','vacuum','Aciona vácuo'],['0.2','belt1','Motor esteira 1 e giro'],['0.3','belt2','Motor esteira 2'],['0.4','stopper1','Válvula 1 stopper'],['0.5','stopper2','Válvula 2 stopper'],['1.1','status','Status Smart Sense']]);
for(const s of stations){
 for(const [key,label,dir] of (s.id==='montagem'?[
 ['feedAdvance','Avança alimentador','Q'],['feedReturn','Recua alimentador','Q'],['vacuum','Vácuo','Q'],['belt1','Motor esteira 1','Q'],['belt2','Motor esteira 2','Q'],['stopper1','Stopper 1','Q'],['stopper2','Stopper 2','Q'],['cameraTrigger','Trigger câmera (borda de subida)','Q'],['feedExtended','Alimentador avançado','I'],['feedRetracted','Alimentador recuado','I'],['vacuumOK','Vácuo confirmado','I'],['cameraOK','Resultado câmera','I'],['rfid','Presença RFID','I']]:s.id==='processo'?[]:[['rfid','Presença RFID','I']]))
   io.push({id:s.id+'.'+key,station:s.id,dir,address:'Lógico',label,source:'GE pp. 267–269 / IO-Link: offset físico não fornecido',kind:'logico'});
 if(s.id!=='montagem') for(const [key,label] of [['axisBusy','Atuador ocupado'],['axisInPosition','Atuador na posição']])io.push({id:s.id+'.'+key,station:s.id,dir:'I',address:'Lógico',label,source:'GE pp. 267–269',kind:'logico'});
}
export {io};
export const fidelity=[
 ['Dimensões das bancadas','Documentado','600 / 600 / 900 / 600 × 980 × 1620 mm; MU pp. 10–11. Largura geral de 3050 mm inclui extremidades.'],
 ['Estoque e expedição','Documentado','28 posições + entrega 29; expedição 12 posições + home 13 + coleta 14. GE pp. 267 e 269.'],
 ['Robô','Extraído','23 comandos e poses p/q extraídos de Smart40.script. Reprodução visual de pontos; não executa URScript nem resolve colisão ou dinâmica UR.'],
 ['Mapa do simulador original','Divergente','GE p. 268 enumera 25 comandos; Smart40.script contém 23. Este projeto utiliza os 23 do script físico.'],
 ['PLC de montagem','Conferido','MU p. 49 diz S7-1200; p. 50 diz S7-1500. Esquema 102457 contém 6ES7512-1CK00-0AB0.'],
 ['Forma e posições locais','Aproximação','Reconstrução paramétrica das ilustrações. Sem CAD, cotas de peças, transformação da base do robô ou metrologia.'],
 ['Tempos e sensores','Modelo ajustável','Tempos, tolerâncias, detecção, dinâmica pneumática e estoque inicial são hipóteses de simulação, sem calibração física.'],
 ['Segurança e conexão','Somente virtual','Intertravamentos didáticos; não validam funções de segurança. Nenhum CLP, robô, MES ou serviço externo conectado.'],
 ['Receitas','Documentado + decisão','1–3 andares, três lâminas por andar, inspeção de todas. GE pp. 284–285. Sequência serial e bloqueio na rejeição são decisões deste modelo.']
];
