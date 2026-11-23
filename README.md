# AVS Labs 3D | Gestão — Projeto Integrador 2026

Versão acadêmica independente do [AvsLabs3D](https://github.com/alecioADS/AvsLabs3D), origem `833a825010df496cf2cbcd32a7f4c91cb64a4fd9`. Mantém nome e paleta da marca; simplifica a arquitetura e os fluxos para a disciplina PI — Projeto e Implementação. Os ícones copiados são os provisórios do projeto original.

## Escopo

Uma empresa e um operador local. CRUD de materiais, impressoras e produtos; entrada e histórico de estoque; planejamento, início, conclusão e cancelamento de ordens; vendas com faturamento bruto; painel de indicadores. Sem Supabase, contas, serviços de nuvem ou autenticação. Sem compras, contas a pagar/receber, variantes, montagem ou sincronização offline. Uma ordem usa de um a quatro filamentos, uma impressora e um produto. Cada filamento possui marca, material (PLA, PETG etc.) e cor, selecionados separadamente na produção.

**Stack:** React + Vite, API Node.js/Express e PostgreSQL. Impressoras têm código único, marca e modelo. Ao planejar uma produção, selecione o modelo e uma unidade livre; unidades ocupadas ou em manutenção ficam indisponíveis. A conclusão da ordem libera a unidade automaticamente.

O navegador chama a API; somente a API acessa o banco, usando consultas parametrizadas. Banco com sete tabelas e chaves estrangeiras. Servidor e banco expostos apenas em `127.0.0.1`.

## Abrir no dia da apresentação

No Mac, dê dois cliques em `Abrir AVS Labs 3D.command`. O iniciador abre o Docker Desktop se necessário, inicia o PostgreSQL, prepara a estrutura sem apagar dados, gera a interface e abre o navegador. Se o sistema já estiver funcionando, apenas abre a página. Pode fechar o Terminal depois da mensagem de sucesso.

Antes da apresentação, execute o iniciador uma vez com internet para garantir que a imagem do PostgreSQL esteja disponível. Depois disso, a operação local não depende de internet. Mantenha Node.js, Docker Desktop e as dependências instalados. Os dados permanecem no volume do PostgreSQL entre reinicializações; não use `docker compose down -v` se quiser preservá-los.

## Executar

Requer Node.js 22.12+ (validado com Node 24), npm e PostgreSQL. Docker é opcional: serve apenas para executar um PostgreSQL comum.

```sh
npm ci
cp .env.example .env
```

Escolha **uma** forma de preparar o banco:

### PostgreSQL instalado na máquina

Crie um banco vazio chamado `avslabs_pi` usando pgAdmin ou `createdb avslabs_pi`. Ajuste `DATABASE_URL` em `.env` para seu usuário e senha. Exemplo: `postgresql://SEU_USUARIO:SUA_SENHA@127.0.0.1:5432/avslabs_pi`. Não é obrigatório usar o usuário `postgres`.

### PostgreSQL via Docker

```sh
docker compose up -d --wait
```

A configuração padrão do `.env.example` corresponde ao container. Se a porta 5432 já estiver ocupada, use seu PostgreSQL existente ou altere tanto a porta do Compose quanto a URL. A senha do exemplo destina-se ao ambiente local de aula.

### Criar estrutura e abrir o aplicativo

```sh
npm run db:setup
npm run dev
```

Abra **http://127.0.0.1:5173**. Banco inicialmente vazio. `db:setup` cria as tabelas sem apagar registros e aplica as atualizações de impressoras (código e marca), de filamentos (nome passa a marca) e de ordens (até quatro filamentos). As ordens antigas são convertidas em ordens com um único filamento, sem alterar consumo, custo ou estoque. Nos cadastros anteriores, o antigo nome é preservado como código; a marca fica “Não informada” até ser corrigida na edição. Códigos antigos repetidos recebem o ID como sufixo.

Para a apresentação, também é possível servir tudo em uma porta:

```sh
npm run build
npm start
```

Abra **http://127.0.0.1:3001**. A API se recusa a iniciar se não conseguir conectar ao banco.

## Demonstração

1. Materiais: cadastrar PLA azul a R$ 100/kg e registrar entrada de 1.000 g.
2. Impressoras: cadastrar uma impressora disponível.
3. Produtos: cadastrar um suporte com SKU `SUP-001`.
4. Produção: planejar 10 peças com 200 g estimados e iniciar a ordem.
5. Concluir com 200 g reais e 8 peças aprovadas.
6. Verificar: material = 800 g; produto = 8 unidades; custo do material da ordem = R$ 20; três movimentos (entrada, consumo e produção).
7. Tentar concluir novamente e excluir o material: as operações são impedidas.
8. Em Vendas, vender 2 suportes a R$ 25 por Marketplace: estoque de produtos passa de 8 para 6 e o faturamento bruto aumenta R$ 50.

## Vendas

Na aba **Vendas**, selecione o produto disponível, informe quantidade, canal (Marketplace ou Varejo) e preço unitário. O total bruto é calculado automaticamente e a venda dá baixa no estoque na mesma transação. As vendas são exibidas com data, produto, quantidade, canal, preço unitário e total. Os indicadores somam todo o histórico, com bruto total, bruto por canal e unidades vendidas.

Não há contas a receber, taxas, despesas, comissões, lucro ou emissão fiscal. O valor é faturamento bruto registrado, não resultado líquido nem confirmação de recebimento. Vendas registradas permanecem no histórico. A mesma solicitação reenviada não duplica venda ou estoque. Estoque insuficiente impede o registro completo.

## Exportar relatórios

O botão **Exportar relatórios (CSV)** está disponível em todas as telas. Ele baixa um ZIP com oito CSVs: visão geral, filamentos, impressoras, produtos, produção, filamentos da produção (consumos por cor), movimentações e vendas. CSV não possui abas; cada seção fica em um arquivo próprio. O arquivo LEIA-ME explica o formato e os vínculos pelos IDs.

A exportação inclui todo o histórico, sem aplicar a busca da tela, em uma leitura consistente do banco. Os CSVs usam UTF-8 com BOM, ponto e vírgula como separador e vírgula decimal, para leitura em Excel e LibreOffice configurados em português. Datas são exportadas em UTC (ISO 8601). Valores de faturamento são brutos. Textos que poderiam ser interpretados como fórmulas são neutralizados.

## Regras e limites

- Saldo de material em gramas; produto em unidades inteiras. Entradas só em materiais; o produto entra pela produção.
- O cadastro aceita saldo inicial em gramas (zero por padrão). Se maior que zero, gera uma entrada de estoque na mesma transação do cadastro. A edição permite ajustar o saldo total, registrando a diferença no histórico e verificando se o saldo mudou durante a edição. Reposições também podem ser feitas em Entrada de estoque.
- Conclusão bloqueia a ordem e os filamentos em ordem de ID para impedir consumo duplicado, saldo negativo e deadlocks. Cada cor recebe consumo real e custo próprios; todos os estoques e o produto são atualizados em uma única transação. Se qualquer cor tiver saldo insuficiente, nenhuma alteração é confirmada.
- Uma ordem aceita de um a quatro filamentos distintos. Na conclusão, é permitido informar zero em cores não utilizadas, desde que o consumo total seja maior que zero.
- Apenas uma ordem em produção por impressora. Impressora em manutenção não inicia produção; impressora ocupada não entra em manutenção.
- Ordem planejada pode ser cancelada. Após iniciar, deve ser concluída com o consumo real, inclusive falha total (zero peças aprovadas).
- Não há reserva de material ao planejar ou iniciar. Saldo suficiente é exigido na conclusão.
- O custo gravado é somente o material consumido, usando custo/kg vigente na conclusão; não representa preço de venda nem custo industrial completo.
- Cadastro sem vínculos pode ser excluído. Chaves estrangeiras impedem excluir registros com histórico. Movimentações não têm exclusão na interface. Ordens canceladas sem movimentação podem ser apagadas após confirmação; os vínculos dos filamentos são removidos na mesma transação. Ordens planejadas, em produção ou concluídas permanecem protegidas.
- Sem login: edição acadêmica destinada ao uso local. Não publicar esta API na internet como sistema multiusuário.
- A lista de eventos acadêmica tem 20 itens. Diagramas e documentos finais precisam refletir esta versão, não o escopo do produto original.

## Verificação

```sh
npm run build
npm test # PostgreSQL embarcado via PGlite, apenas para testes
TEST_DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/postgres npm test
```

Sem `TEST_DATABASE_URL`, os testes executam o SQL no PGlite (PostgreSQL embarcado em WebAssembly, dependência apenas de desenvolvimento). Essa modalidade verifica fluxos e transações serializadas, mas não comprova bloqueios de múltiplas conexões PostgreSQL. Com `TEST_DATABASE_URL`, o mesmo teste usa o servidor PostgreSQL real, cria um banco temporário próprio e o remove ao finalizar. O usuário de testes precisa de `CREATE DATABASE`. Não aponta o teste para dados de produção. Cobre CRUD, validação, integridade referencial, transições, perdas, custo e conclusões concorrentes.

O workflow `.github/workflows/ci.yml` executa build, integração com PostgreSQL 18 e jornada de interface. Para testar a interface localmente, use um banco de demonstração vazio, deixe o aplicativo aberto e execute `npm run test:e2e` (Google Chrome instalado). O teste insere dados e não os remove; não use seu banco de trabalho.

## Organização

- `src/`: interface e identidade visual.
- `server/`: API, validação e transações PostgreSQL.
- `database/schema.sql`: estrutura relacional executável.
- `docs/escopo-pi.md`: 20 eventos, atores e correspondência com as fases.
- `docs/modelagem.mmd`: modelo de dados; `docs/estado-*.mmd`: dois diagramas de estados em Mermaid.
- `docs/validacao.md`: verificações realizadas e limitações.

## Documentação de entrega e manutenção

O índice completo está em [docs/README.md](docs/README.md). Os PDFs estão em [output/pdf](output/pdf) e o pacote consolidado em [output/entrega](output/entrega). A fase 1 tem quatro páginas em Arial 12 e espaçamento 1,5; incorpora os dados fornecidos pelo proprietário e identifica como não confirmadas a existência de filiais e a demografia dos clientes. A fase 2 contém vinte casos de uso e vinte sequências, classes, objetos e dois diagramas de estados. A fase 3 acompanha SQL e dicionário; a fase 4 traz o roteiro da apresentação.

A documentação técnica inclui stack com versões do lockfile, arquitetura, requisitos/regras, dicionário das sete tabelas, referência dos 25 endpoints, manual do usuário, instalação, operação, backup/restauração, limites e rastreabilidade dos testes. Diagramas possuem fontes PlantUML e versões PNG/SVG. Não há funcionalidade futura descrita como implementada.

Para gerar novamente os PDFs, instale as dependências de requirements-docs.txt em um ambiente Python e execute scripts/build_docs.py, com fontes Arial disponíveis. Para renderizar UML, informe PLANTUML_JAR e execute scripts/render-uml.sh. Instruções detalhadas ficam no índice da documentação.
