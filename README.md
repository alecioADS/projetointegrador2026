# AVS Labs 3D | Gestão — Projeto Integrador 2026

Versão acadêmica independente do [AvsLabs3D](https://github.com/alecioADS/AvsLabs3D), origem `833a825010df496cf2cbcd32a7f4c91cb64a4fd9`. Mantém nome e paleta da marca; simplifica a arquitetura e os fluxos para a disciplina PI — Projeto e Implementação. Os ícones copiados são os provisórios do projeto original.

## Escopo

Uma empresa e um operador local. CRUD de materiais, impressoras e produtos; entrada e histórico de estoque; planejamento, início, conclusão e cancelamento de ordens; painel de indicadores. Sem Supabase, contas, serviços de nuvem ou autenticação. Sem compras, vendas, financeiro, variantes, montagem ou sincronização offline. Uma ordem usa um material, uma impressora e um produto.

**Stack:** React + Vite, API Node.js/Express e PostgreSQL. Impressoras têm código único, marca e modelo. Ao planejar uma produção, selecione o modelo e uma unidade livre; unidades ocupadas ou em manutenção ficam indisponíveis. A conclusão da ordem libera a unidade automaticamente.

O navegador chama a API; somente a API acessa o banco, usando consultas parametrizadas. Banco com cinco tabelas e chaves estrangeiras. Servidor e banco expostos apenas em `127.0.0.1`.

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

Abra **http://127.0.0.1:5173**. Banco inicialmente vazio. `db:setup` cria as tabelas sem apagar registros e aplica a atualização de impressoras (código e marca). Nos cadastros anteriores, o antigo nome é preservado como código; a marca fica “Não informada” até ser corrigida na edição. Códigos antigos repetidos recebem o ID como sufixo.

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

## Regras e limites

- Saldo de material em gramas; produto em unidades inteiras. Entradas só em materiais; o produto entra pela produção.
- Saldo inicial zero. Toda alteração de estoque feita pela aplicação gera movimento na mesma transação.
- Conclusão bloqueia ordem e material para impedir consumo duplicado ou saldo negativo sob concorrência.
- Apenas uma ordem em produção por impressora. Impressora em manutenção não inicia produção; impressora ocupada não entra em manutenção.
- Ordem planejada pode ser cancelada. Após iniciar, deve ser concluída com o consumo real, inclusive falha total (zero peças aprovadas).
- Não há reserva de material ao planejar ou iniciar. Saldo suficiente é exigido na conclusão.
- O custo gravado é somente o material consumido, usando custo/kg vigente na conclusão; não representa preço de venda nem custo industrial completo.
- Cadastro sem vínculos pode ser excluído. Chaves estrangeiras impedem excluir registros com histórico. Movimentações e ordens não têm exclusão na interface.
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

A documentação acadêmica final das fases 1 e 2 (incluindo quatro páginas de caracterização da empresa e todos os diagramas UML solicitados) ainda precisa ser elaborada com dados confirmados pelo grupo.
