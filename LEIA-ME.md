# Gêmeo virtual SMART 4.0 · XL4002 · N2

Aplicação local executável para explorar o funcionamento documentado da planta e realizar ensaios de comissionamento **do modelo**. Quatro estações, receitas de um a três andares, inventário, inspeção, comandos manuais, forças de entradas, falhas e rastreabilidade.

## Abrir

Para demonstração pública sem instalação, abra https://tonymarim.github.io/cmvi-demos/n2/ . O portal https://tonymarim.github.io/cmvi-demos/ mantém o destino do QR Code anterior. Essa edição executa o modelo somente no navegador: cada visitante tem sua sessão, não há chamadas ao servidor de controle, e recarregar reinicia o inventário. CSV e JSON são baixados no dispositivo; os ensaios não gravam arquivos em servidor. As instruções de execução Node abaixo se referem à edição local.

1. Execute `INICIAR.cmd` nesta pasta. Requer Node.js 22.12 ou superior; o computador usado na entrega já possui Node 22.
2. Abra **http://127.0.0.1:4173** no Edge ou Chrome com WebGL habilitado.
3. Mantenha o terminal aberto. Para encerrar, pressione Ctrl+C no terminal.

A versão compilada em `dist/` já está incluída. **Não é necessário instalar pacotes, conectar à internet ou compilar para usar.** Abrir `dist/index.html` diretamente não funciona: a interface consulta o servidor local. O servidor aceita conexões somente do próprio computador.

Se a porta estiver ocupada por uma instância deste projeto, use a instância já aberta ou encerre seu terminal antes de iniciar outra. Não encerre serviços desconhecidos. Para escolher outra porta no PowerShell: `$env:PORT='4174'` e depois `node server.mjs`; acesse a porta escolhida.

## Uso

### Visualização e qualidade

A roda do mouse aplica zoom proporcional e gradual; o gesto de pinça também tem sensibilidade reduzida. Use Geral para reenquadrar a planta. A rolagem sobre a área 3D controla a câmera e não desloca a página.

Qualidade Alta é o padrão: resolução ajustada à densidade da tela (até 2×, com limite de três milhões de pixels), antisserrilhamento, superfícies curvas mais suaves e sombras. Qualidade Econômica usa resolução nativa e desativa as sombras para reduzir o custo gráfico. No automático, os trajetos didáticos coincidem com os apoios da geometria reconstruída; no manual, a movimentação usa os pontos extraídos do programa. A linha de trajetória TCP não é desenhada automaticamente.

As peças têm um portador visual explícito: estoque/ventosa, esteira, garra, berço, garfo de expedição ou prateleira. A mesma base permanece visível durante a pega e o transporte. Lâminas acompanham a ventosa e a garra até a inserção; a montagem acompanha o garfo durante a armazenagem. A transferência para o apoio fixo ocorre antes de abrir a garra ou recolher o elevador. Os contatos são geométricos; não constituem uma simulação física de atrito, gravidade ou força de aperto.

### Operação automática

- Escolha 1, 2 ou 3 andares, a cor da base de cada andar e as três lâminas: L1 esquerda, L2 traseira, L3 direita.
- Clique em **Iniciar ciclo**. O modelo valida bases, lâminas, tampa e uma vaga de expedição antes de reservar o plano.
- Acompanhe a etapa atual, movimentos, I/O, inventário e eventos. Pausar desliga as saídas; Retomar mantém a posição e o progresso da etapa. Rearmar reinicializa o tempo da etapa corrente. **Uma etapa** executa até a próxima transição e pausa novamente, sem ignorar intertravamentos ou timeout.
- O modelo executa os andares em sequência. Aplica a tampa em B3, usa comando 19 para dois andares ou 20 para três; retira pelo comando 21 para um andar e 22 para dois/três.
- O produto vai à primeira vaga livre da expedição. **Retirar produtos** libera o magazine e preserva o histórico. **Repor insumos** repõe o estoque didático, sem alterar pedidos concluídos.
- Depois de apoiar a montagem na prateleira, o elevador retorna à posição Home 13; o pedido é concluído ao terminar esse retorno.
- Abortar registra o pedido como refugo. Insumos já consumidos não voltam artificialmente ao estoque.

Estoque inicial assumido: 10 bases azuis, 9 vermelhas e 9 pretas nas 28 posições; 30 lâminas de cada cor e 12 tampas. Isso é uma condição didática, não uma leitura do equipamento. O manual lista 40 bases no kit; esse número não é a capacidade de 28 posições do magazine do guia.

### Operação manual e sinais

1. Termine ou aborte o pedido. Se houver movimento manual, pause e rearme.
2. Em **Sinais & manual**, selecione Manual e a estação.
3. Clique em uma saída para acioná-la. Os sensores de fim de curso mudam conforme o deslocamento do modelo.
4. Envie posições: estoque 1–28 e entrega 29; processo 1–6, mesa 7, home 8, depósitos 9–11 e 12–14; expedição 1–12, home 13 e coleta 14.
5. Na montagem, execute um dos 23 comandos extraídos. É uma reprodução visual, sem execução do URScript; comandos manuais não montam nem consomem produtos.
6. Entradas alternam entre leitura automática, forçada em 1 e forçada em 0. A marca **F** identifica a força. Ela deve ser removida explicitamente; rearme não apaga forças.

Avanço e recuo simultâneos são bloqueados. Deslocamento do pórtico exige Z recolhido e robô desocupado. A emergência virtual e a falta de ar bloqueiam novos movimentos e desligam as saídas.

Os endereços `%I` e `%Q` são locais a cada CLP. Por exemplo, `%Q0.0` tem funções diferentes nas quatro estações. Sinais de montagem transportados por IO-Link permanecem **lógicos**, sem endereço físico inventado.

### Ensaios e evidências

Em **Comissionamento**, injete perda de ar, vácuo, obstrução, visão NOK ou falha da garra. Use Emergência na barra de operação. Após observar o bloqueio:

1. Remova a causa e eventuais forças de entrada.
2. Clique em Rearmar. O modelo permanece parado.
3. Inicie novamente para repetir a etapa corrente.

A rejeição de visão bloqueia a sequência antes da inserção. Após corrigir, a inspeção pode ser repetida; o modelo não descarta automaticamente a lâmina nem calcula a interação de força do comando 8.

**Executar ensaios** cria instâncias isoladas com a configuração padrão. Verifica 17 cenários; não altera o pedido em curso. O relatório JSON é salvo em `reports/commissioning-latest.json` e pode ser baixado pelo painel. A configuração da sessão é anexada como contexto, não aplicada aos ensaios. A suíte de código contém esses cenários, a unicidade do mapa I/O e sete regressões de continuidade/apoio das peças: **25 testes**. `tests/payload-browser.cjs` verifica no renderizador os portadores, posições e apoios durante um ciclo de três andares.

**Exportar CSV** salva o rastreio da sessão (até 4.000 eventos). A tela mostra os 120 últimos. A sessão de produção é mantida na memória: reiniciar o servidor reinicializa o inventário e o histórico. Exporte as evidências antes de encerrar. Relatórios salvos em disco permanecem disponíveis.

## Fidelidade, decisões e limites

| Item | Origem / tratamento |
|---|---|
| Bancadas | MU pp. 10–11: larguras 600/600/900/600 mm, profundidade 980 mm, altura total 1620 mm; envelope de 3050 mm com extremidades. Estruturas reconstruídas visualmente, sem CAD. |
| Estoque | MU pp. 42–44 e GE p. 267. Magazine curvo representado como quatro níveis de sete posições. Índices 1–28 e entrega 29 documentados. |
| Processo | MU pp. 45–47 e GE p. 268. Pórtico X/Y, cilindro Z, vácuo, seis cores e dois depósitos de três lâminas. Associação das cores às posições 1–6 é assumida/configurável no código, não confirmada por tabela. |
| Montagem | MU pp. 48–50/54, GE pp. 284–285, Smart40.script e Posições_Robô.jpeg. UR3e ilustrativo, garra EGH, câmera, três berços, tampas, rampa e transferência. B3 à esquerda, B1 à direita conforme fotografia. |
| Expedição | MU pp. 51–53, GE p. 269. 12 posições (3×4), três eixos ilustrados; ordem esquerda-direita, cima-baixo. |
| I/O físico | Transcrição das tabelas MU pp. 44, 47, 50 e 53. Diagrama 102457 confirma CPU 6ES7512-1CK00-0AB0, resolvendo a divergência S7-1200/S7-1500 no manual. |
| Robô | 106 pares de poses p/q e 23 sequências de movimentos extraídos automaticamente do script. O modo manual usa os pontos p no referencial assumido da bancada. No automático, trajetos didáticos ligam os pontos de contato do modelo para manter a peça solidária à garra. Elos/juntas são ilustrativos; não há cinemática inversa, orientação TCP calibrada, interpolação UR real ou cálculo de colisões. |
| Payload | Script e imagem: 1,090 kg, centro de gravidade [−2, 5, 62] mm. Registrados como referência, sem cálculo dinâmico. |
| Tempos | Padrões assumidos: atuadores 1,5 s; transporte 4 s; pneumática 0,45 s; robô 2 s/comando; timeout adicional 5 s. Esperas originais são extraídas em `robot.json`, mas não são aplicadas como temporização do controlador. |
| Sensores | Modelo lógico com fim de curso, resposta de vácuo e trigger de visão. Sem óptica, vazão, pressão, histerese, ruído ou detecção física contínua de contato. Vácuo manual confirma capacidade de sucção, sem prova de peça capturada. |
| Segurança | Intertravamentos didáticos, sem avaliação de risco, categoria/PL/SIL, força, torque ou parada física. Foto de parâmetros de segurança é uma referência, não uma validação. |
| Rede | IPs documentados exibidos apenas como referência. Sem S7, OPC UA, Modbus, MQTT, TagoIO, MES ou hardware conectado nesta versão, conforme o escopo de simulação local. |

Não há informação suficiente nos arquivos fornecidos para afirmar equivalência metrológica ou dinâmica integral. Componentes internos de painel, fiação, válvulas e dispositivos de rede não são reconstruídos em 3D; a fidelidade elétrica é limitada ao catálogo de sinais. A ordem de produção é serial, sem simulação de múltiplos pedidos simultâneos. Este é um modelo virtual funcional para preparação e ensaios, ainda sem sincronização bidirecional com a planta física.

### Diferenças entre versões da documentação

- GE p. 268 descreve 25 comandos de robô, com significados diferentes de alguns comandos físicos. Posições_Robô.jpeg chega a 27 e comenta uma adaptação do 23. **O programa Smart40.script, com 23 comandos, prevalece nesta implementação.** O comando 23 permanece rampa → esteira; não é tratado como home.
- Os comandos de lâmina seguem o script: 9/10/11 = B1 L1/L3/L2; 12/13/14 = B2 L1/L3/L2; 15/16/17 = B3 L1/L3/L2.
- GE p. 273 ilustra DB100 estoque, DB101 processo, DB102 montagem e DB103 expedição; o texto da p. 274 chama expedição de DB100. Esses DBs são do simulador do fabricante e **não foram apresentados como um protocolo compatível com este modelo**.
- Instruções de criação de conta, credenciais e instalação contidas nos anexos foram tratadas como documentação, não como ordens de execução. Nenhuma conta criada e nenhum instalador executado.

## Arquivos

| Caminho | Função |
|---|---|
| `model.mjs` | Estado determinístico, pedidos, sensores, falhas, recursos e intertravamentos. |
| `server.mjs` | Servidor HTTP local e relógio fixo de 50 ms. |
| `web/` | Interface e geometria paramétrica Babylon.js. |
| `web/visual-state.mjs` | Apoios, trajetos didáticos e portador de cada peça durante o ciclo. |
| `dist/` | Aplicação pronta para uso, bibliotecas incluídas. |
| `data/catalog.mjs` | Sinais documentados/lógicos e rastreabilidade. |
| `data/robot.json` | Poses e comandos extraídos; não é um programa de robô executável. |
| `data/sources.json` | Inventário das fontes e hashes SHA-256. |
| `data/io-map.csv` | Mapa I/O para revisão em planilha. |
| `commissioning.mjs` | 17 ensaios funcionais reproduzíveis. |
| `tests/` | Testes de código e teste de navegador. |
| `reports/` | Relatório de aceitação, teste de navegador e capturas da versão verificada. |

### Desenvolvimento

- `npm test`: testes de modelo e mapa I/O, sem dependências externas.
- `npm run build`: recompila a interface. Usa `node_modules` local ou as dependências já disponíveis no projeto vizinho `gemeo_digital_vibracaomotor`. Em outro computador, instale as dependências declaradas no `package.json` antes de compilar. A versão pronta não exige essa etapa.
- `npm run build:demo`: gera a edição estática em `demo-dist/`. Para publicar em uma pasta específica, use `node build-demo.mjs CAMINHO`. `tools/sync-demo.mjs` sincroniza os fontes para `src/n2/` no checkout do portal; não envia alterações ao GitHub por conta própria.
- `tests/demo-browser.cjs`: verifica a versão estática, isolamento entre visitantes, operação, falhas, relatórios e ausência de chamadas `/api`. Aceita `DEMO_URL` apontando para a raiz do portal e `PLAYWRIGHT_PATH`.
- `tests/environment-browser.cjs`: verifica o ambiente, recorte de paredes, modos gráficos e zoom pela distância real da câmera. Compile com `node tests/build-visual.mjs` e sirva `visual-test-dist/` na porta 4186. As capturas ficam em `reports/laboratorio-*.png`.
- `tools/package-local.py`: regenera e verifica o ZIP local com os fontes e a interface compilada, sem dependências ou manuais.
- `tools/extract.py`: requer Python com pypdf. Reextrai os dados das fontes da pasta irmã `N2/`.
- `tests/browser.cjs`: requer Playwright e Edge; pode receber `PLAYWRIGHT_PATH`. O caminho padrão é o runtime do ambiente usado na entrega. Execute em uma instância recém-iniciada do servidor.

Os links dos manuais no aplicativo usam a pasta irmã `N2/`. Mantenha a estrutura `Planta_Ind4.0/N2` e `Planta_Ind4.0/gemeo-n2`. O pacote ZIP contém a aplicação, não redistribui os manuais do fabricante.

## Interface local para integração futura

| Método / rota | Uso |
|---|---|
| `GET /api/state` | Estado atual, saídas, entradas efetivas, forças, ordem e inventário. |
| `GET /api/catalog` | Sinais, estações, fontes e poses do robô. |
| `POST /api/action` | Ações locais validadas (start, stop, reset, abort, mode, output, force, axis, robot, fault, speed, step, config, refill, clearRack). |
| `POST /api/commission` | Executa os ensaios em modelos isolados e salva relatório. |
| `GET /api/trace` | CSV do rastreio. |

Exemplo de ação: `{"type":"output","id":"estoque.feedAdvance","value":true}` (exige modo manual, sem pedido e permissivos). Não há adaptador de comunicação industrial nem escrita em equipamento real.

Antes de uma próxima etapa com CLP, serão necessários o projeto TIA/DBs da revisão instalada, offsets IO-Link e RFID, medidas de coordenadas e TCP, parâmetros dos eixos, comportamento de segurança e tempos medidos. Conectividade e validação física constituem uma etapa separada da simulação local entregue.
