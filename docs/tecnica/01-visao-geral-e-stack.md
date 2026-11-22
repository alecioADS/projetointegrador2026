# Documentação técnica do AVS Labs 3D

## Finalidade e versão documentada

O AVS Labs 3D é uma aplicação web responsiva executada localmente para gerir filamentos, impressoras, produtos, produção de até quatro cores, movimentações e vendas com faturamento bruto. A documentação descreve a implementação atual do repositório `alecioADS/projetointegrador2026`. A origem do projeto é o AvsLabs3D; o aplicativo atual possui arquitetura própria simplificada, sem Supabase.

O navegador é o cliente. Node.js serve a interface compilada e a API HTTP. PostgreSQL persiste os dados. O ícone macOS e o arquivo `.command` são iniciadores: não convertem a aplicação em programa nativo. O negócio continua executado na API e no banco. A interface pode ser visualizada em telas menores, mas o servidor escuta somente o computador local; não foi habilitado acesso remoto de celulares pela rede.

## Escopo funcional

1. Filamentos: marca, material, cor, custo por kg, saldo inicial, consulta, edição, ajuste de saldo e exclusão quando não houver vínculos.
2. Impressoras: código único, marca, modelo, situação cadastral e disponibilidade derivada de ordens em execução.
3. Produtos: nome, SKU único e estoque em unidades, incrementado pela produção e reduzido pelas vendas.
4. Produção: planejar, consultar, iniciar, concluir, cancelar planejamento e apagar ordens canceladas sem movimentação.
5. Multicor: de um a quatro filamentos distintos por ordem, com consumos estimados e reais por cor.
6. Estoque: entradas, ajustes, consumo e produtos gerados ou vendidos, com referências aos registros de origem.
7. Vendas: produto, quantidade, canal Marketplace/Varejo e preço unitário; total bruto gerado pelo banco e indicadores acumulados.
8. Relatórios: download de ZIP com oito CSVs e instruções de leitura, obtidos em uma transação de leitura consistente.

Não fazem parte do escopo autenticação, permissões de usuários, clientes, fornecedores, compras, contas a pagar/receber, emissão fiscal, integrações com marketplaces, cálculo de comissões, apuração de lucro, reservas de material, múltiplas empresas, controle por lote físico ou sincronização offline.

## Stack efetivamente instalada

As versões abaixo foram extraídas do `package-lock.json`; as faixas do `package.json` podem ser menos específicas. Use `npm ci` para reproduzir as resoluções do lockfile.

| Componente | Versão resolvida | Papel |
|---|---|---|
| Node.js | 24.16.0 no ambiente de desenvolvimento | Runtime; engines permite >=22.12.0 |
| React / React DOM | 19.3.1 | Componentes, estado e renderização da interface |
| Vite | 7.3.8 | Servidor de desenvolvimento e build de produção |
| JavaScript | ESM + JSX | Código do frontend e backend; não há TypeScript nesta versão |
| Express | 5.3.0 | Rotas HTTP, JSON, arquivos estáticos e erros |
| pg | 8.23.1 | Pool de conexões e consultas parametrizadas PostgreSQL |
| Zod | 4.6.7 | Validação estrita dos contratos de entrada |
| dotenv | 17.4.2 | Leitura de configuração local em .env |
| fflate | 0.8.3 | Geração ZIP para relatórios CSV |
| PostgreSQL | 18 na configuração Docker e CI | Persistência relacional, restrições, locks e transações |
| Docker Compose | CLI disponível no host | Inicialização opcional do PostgreSQL |
| CSS | CSS nativo responsivo | Tema claro, layout, tabelas, diálogos e estados |
| Playwright | 1.65.1 | Jornadas reais no navegador e download |
| PGlite | 0.5.17, apenas desenvolvimento | PostgreSQL embarcado para testes quando não há URL nativa |
| Supertest | 7.3.2 | Requisições de integração contra a API |
| node:test / assert | Biblioteca padrão Node.js | Execução e asserções dos testes |
| Prettier | 3.10.1 | Formatação e verificação de estilo |
| concurrently | 9.2.5 | Executa API e Vite no desenvolvimento |

A imagem `postgres:18` fixa a versão principal, não um digest ou versão menor. Para reprodutibilidade bit a bit, seria necessário fixar o digest da imagem e as versões de runtime/OS. Docker é opcional: uma instalação PostgreSQL local compatível pode ser configurada pela URL de conexão.

## Estrutura de diretórios

```text
src/main.jsx                componentes, estado e formulários
src/style.css               identidade visual e responsividade
public/brand/               logo e símbolo oficiais
server/app.js               fábrica Express, validação e regras nas rotas
server/db.js                pool pg e helper transacional
server/index.js             inicialização e encerramento do servidor
server/setup.js             aplicação da estrutura SQL
server/reports.js          serialização CSV e exportação consistente
database/schema.sql         DDL e atualizações compatíveis
tests/api.test.js           integração e concorrência
tests/interface.spec.js     jornadas de interface
tests/migration.test.js     preservação de dados antigos
.github/workflows/ci.yml     verificação no GitHub Actions
Abrir AVS Labs 3D.command    iniciador macOS
.run/                       logs e backups locais ignorados pelo Git
docs/tecnica/               documentação técnica editável
docs/entrega/               documentos e dados da entrega
docs/uml/                  fontes e imagens UML
output/pdf/                 PDFs renderizados
```

## Configuração e persistência

`DATABASE_URL` existe somente no backend e deve apontar para o banco `avslabs_pi`. `PORT` é a porta do servidor, por padrão 3001. O frontend não recebe senha de banco. O arquivo `.env` não é versionado; `.env.example` contém valores de desenvolvimento local.

No Compose, a porta do PostgreSQL é publicada apenas em `127.0.0.1:5432`, o banco e o usuário de exemplo são definidos no serviço `db` e o volume `postgres_data` preserva registros entre reinicializações. O diretório `.run` guarda logs, PID do iniciador e backups locais. Esses arquivos não devem ser enviados como parte da documentação pública.
