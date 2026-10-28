# Gêmeo digital da planta N2 · SMART 4.0

Simulação local da planta didática XL4002: estoque, processo, montagem e expedição. Inclui visualização 3D, receitas de 1–3 andares, operação manual, monitoramento de I/O, injeção de falhas e ensaios de comissionamento virtual.

**Demo pública:** [Planta N2 no navegador](https://tonymarim.github.io/cmvi-demos/n2/). O [portal de demonstrações](https://tonymarim.github.io/cmvi-demos/) mantém o endereço do QR Code anterior e oferece nível, vibração e planta N2. Cada visitante tem sua própria simulação; recarregar reinicia a sessão. Não exige Node.js no dispositivo do visitante.

![Planta 3D](reports/planta-3d.png)

## Executar

Requer **Node.js 22.12 ou superior** e navegador com WebGL.

```sh
git clone https://github.com/tonymarim/gemeo-digital-planta-N2.git
cd gemeo-digital-planta-N2
npm start
```

Abra **http://127.0.0.1:4173**. No Windows também é possível executar `INICIAR.cmd`.

A versão compilada está em `dist/`: não é necessário instalar dependências para executar. Não abra o HTML diretamente, pois a interface depende do servidor local. A sessão fica na memória; exporte os resultados antes de encerrar.

## Recursos

- Quatro estações em 3D, com navegação e seleção de vistas.
- Zoom gradual, renderização em alta densidade, antisserrilhamento, sombras e opção de qualidade econômica. A linha de trajetória TCP não é exibida automaticamente.
- Receitas de um a três andares, três lâminas por andar, inspeção, tampa e expedição.
- 73 sinais: 52 com endereços documentados e 21 lógicos.
- 106 poses e 23 comandos extraídos do programa de robô fornecido.
- Operação manual, forças de entrada, falhas, rearme e execução por etapas.
- Bases, lâminas, tampa e montagem acompanham seus portadores durante as transferências; os apoios dos magazines, garra e elevadores são explícitos.
- 17 ensaios funcionais no painel e um teste adicional do mapa I/O.
- Rastreio CSV e relatório de comissionamento JSON.

## Documentação e evidências

- [Guia completo, fontes, decisões e limitações](LEIA-ME.md)
- [Mapa I/O](data/io-map.csv)
- [Relatório dos ensaios](reports/commissioning-latest.json)
- [Resultado do teste de navegador](reports/browser.json)
- [Verificação de zoom e qualidade gráfica](reports/graphics-browser.json)
- [Verificação das peças na garra e no elevador](reports/payload-browser.json)
- [Pacote ZIP da entrega](entrega/N2-gemeo-digital-local.zip)

## Testar e desenvolver

```sh
npm test
```

Para modificar e recompilar a interface:

```sh
npm install
npm run build
npm start
```

O servidor e o modelo usam módulos nativos do Node.js. Babylon.js e Vite são necessários apenas para recompilar a interface. Consulte o guia para executar os testes de navegador e reextrair os dados documentais.

`npm run build:demo` gera a versão estática em `demo-dist/`, com caminhos relativos para hospedagem em subpastas. Essa versão executa o mesmo modelo e os 17 ensaios no navegador, sem rotas de servidor `/api`. Os downloads CSV e JSON permanecem locais. O código da demo também está no [repositório do portal](https://github.com/tonymarim/cmvi-demos/tree/main/src/n2).

## Escopo e fidelidade

A renderização foi revisada com as dez fotografias reais de `X:\Imagens\N2`, de 28/10/2026. O ambiente inclui piso amadeirado, divisória de vidro com faixas vermelhas, sala adjacente, janela, rack de rede, nobreak, quadro elétrico e TV. A máquina recebeu consoles inclinados, IHMs ilustrativas, acabamento escuro dos gabinetes, motores, conexões pneumáticas, cabeamento e juntas do robô. Sombras de 2048 pixels, reflexos locais e oclusão de contato complementam a resolução adaptativa e a suavização das bordas.

Use **Ambiente** para enquadrar a sala e **Sala visível/oculta** para inspecionar os mecanismos. Paredes próximas se ocultam ao orbitar para fora da sala. O modo **Econômica** desliga sombras, reflexos e oclusão de contato. A configuração Alta limita a imagem a três milhões de pixels para equilibrar definição e custo gráfico.

As dimensões do cômodo, mobiliário, materiais e detalhes sem cotas são aproximações visuais. As texturas são procedurais, sem serviços externos. As IHMs são ilustrações; o estoque inicial e a cinemática didática foram preservados. O inventário e os hashes das fotos estão em [data/visual-references.json](data/visual-references.json); os arquivos fotográficos não foram incorporados à demo.

Esta versão realiza **simulação e comissionamento do modelo local**. Não está conectada a CLPs, robô, MES ou serviços externos. Geometria sem cotas e tempos são aproximações; no automático, o robô usa trajetos didáticos entre os pontos de contato da geometria. Os comandos manuais reproduzem os pontos extraídos. Não há cinemática UR, dinâmica ou validação de colisões. Não equivale a uma réplica física calibrada nem valida segurança funcional.

Os manuais e demais anexos originais do fabricante **não estão neste repositório**. Para usar os links de consulta no aplicativo e a extração documental, coloque a pasta `N2` ao lado da pasta do projeto, conforme o guia. A simulação funciona sem esses anexos; seus hashes e as referências técnicas usadas estão em `data/`.

As dependências mantêm suas próprias licenças; a licença do Babylon.js incluído está em `dist/licenses/babylon.md`.
