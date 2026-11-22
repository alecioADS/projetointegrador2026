# Instalação, operação e manutenção

## Requisitos e instalação

Requer Node.js >=22.12.0, npm, PostgreSQL e navegador moderno. O ambiente validado usa Node 24, PostgreSQL 18 e Chrome/Chromium. Docker Desktop é opcional para o banco. O iniciador .command/ícone é específico de macOS; em outros sistemas, usar os comandos manuais.

```sh
git clone https://github.com/alecioADS/projetointegrador2026.git
cd projetointegrador2026
npm ci
cp .env.example .env
docker compose up -d --wait
npm run db:setup
npm run build
npm start
```

Abrir http://127.0.0.1:3001. Em desenvolvimento, usar npm run dev e http://127.0.0.1:5173. O proxy Vite encaminha /api para :3001; se mudar PORT, ajustar também o proxy no desenvolvimento. db:setup cria/atualiza a estrutura compatível, sem executar dados de demonstração.

## PostgreSQL instalado sem Docker

Criar banco vazio avslabs_pi por pgAdmin, DBeaver ou createdb. Configurar DATABASE_URL e executar db:setup. O SQL usa recursos de PostgreSQL: identity, DO blocks, índices parciais e coluna gerada. Não é um script MySQL.

Não executar o Compose se uma instância PostgreSQL adequada já atende a URL escolhida. O iniciador macOS atual, contudo, chama Docker Compose; quem usa banco fora do container deve executar manualmente ou adaptar o iniciador.

## Configurações

| Variável | Papel | Exemplo local |
|---|---|---|
| DATABASE_URL | Conexão apenas do backend | postgresql://postgres:postgres@127.0.0.1:5432/avslabs_pi |
| PORT | API e interface compilada | 3001 |
| TEST_DATABASE_URL | Base administrativa para testes temporários | postgresql://USUARIO:SENHA@127.0.0.1:5432/postgres |
| UI_BASE_URL | Endereço dos testes Playwright | http://127.0.0.1:3001 |
| CI | Escolha do navegador de teste | Definida pelo GitHub Actions |

O usuário/senha de exemplo é apenas de desenvolvimento local. Não enviar .env, senha real, backups ou logs ao Git. API e PostgreSQL escutam em loopback. Não há autenticação para acesso público.

## Persistência e iniciador

O volume postgres_data do Compose mantém os dados entre reinicializações. Fechar navegador ou Terminal depois da inicialização bem-sucedida não apaga o banco. docker compose down -v remove o volume e não deve ser usado para resolver erro de inicialização.

O .command resolve a pasta relativa ao próprio arquivo, inclui caminhos comuns no PATH, verifica Node/Docker/dependências, cria .env de exemplo quando ausente e valida a porta. Se o health e o título indicarem servidor existente, abre a página. Caso contrário, tenta abrir Docker Desktop, aguarda, executa Compose, db:setup e build e inicia a API com nohup.

Logs ficam em .run/servidor.log; o PID iniciado pelo script fica em .run/servidor.pid. A saída só é anunciada depois da resposta de health. O ícone .app local aponta para esse .command. O clone Git contém o .command, mas não necessariamente o pacote .app personalizado da área de trabalho. Se mudar a pasta do projeto, o caminho do ícone pode precisar ser atualizado. A logo aplicada pelo Finder é metadado local.

## Atualizações e reinício

1. Salvar e revisar as mudanças.
2. Rodar format:check, build e testes adequados.
3. Em mudança SQL, fazer backup antes e aplicar db:setup.
4. Encerrar somente o processo da API correspondente ao aplicativo e reiniciar por npm start/iniciador.
5. Recarregar o navegador.

O servidor de produção não monitora os arquivos. npm run dev usa node --watch na API e Vite na interface; não confundir esse processo com o servidor de apresentação.

## Backup e restauração em base separada

O aplicativo não agenda backups automaticamente. Com o serviço Docker ativo, salvar dump textual local:

```sh
mkdir -p .run
docker compose exec -T db pg_dump -U postgres avslabs_pi > .run/backup-avslabs.sql
```

Testar o backup e manter uma cópia em local definido pelo responsável. CSV é relatório, não restauração completa de restrições e sequências. Não imprimir dump real em logs compartilhados.

Com ferramentas PostgreSQL instaladas, uma verificação pode criar outra base:

```sh
createdb -h 127.0.0.1 -U postgres avslabs_restaurado
psql -h 127.0.0.1 -U postgres -d avslabs_restaurado -v ON_ERROR_STOP=1 -f .run/backup-avslabs.sql
```

O nome de restauração do exemplo é diferente da base de trabalho. Configurar a URL para o nome realmente criado e conferir a importação antes de utilizar. Restaurar sobre a base real exige planejar o impacto e não faz parte da inicialização cotidiana.

## Diagnóstico

| Sintoma | Verificar |
|---|---|
| Porta 3001 em uso | Identificar a API correta; reaproveitar o app aberto ou ajustar porta/proxy |
| Porta 5432 em uso | Conferir PostgreSQL instalado; evitar iniciar duas instâncias na mesma porta |
| Docker não encontrado | Instalar/iniciar Desktop ou usar comandos manuais com PostgreSQL local |
| API encerra no início | DATABASE_URL, banco existente, credenciais; index.js exige SELECT 1 |
| Tabela ou coluna ausente | Backup, db:setup e correspondência de versão do código/esquema |
| Interface antiga | Refazer build e recarregar |
| Saldo divergente | Executar consultas de conciliação e investigar movimentos/alterações manuais |
| Exportação falha | Logs, conexão e memória; o ZIP é montado integralmente em memória |

## Limites de operação e evolução

O sistema não possui usuários, autenticação, TLS próprio, autorização por perfil, trilha de autoria ou rotina de backup agendada. Não está pronto para exposição pública apenas trocando o bind. O administrador do PostgreSQL pode alterar dados fora dos fluxos; não existem triggers que impeçam todo tipo de intervenção administrativa.

As listas são completas e não paginadas. Não foram medidos SLA, carga ou limites de volume. A interface e a API concentram bastante lógica em módulos únicos. Uma evolução recomendada é separar componentes por seção e serviços de domínio preservando a suíte de testes.

Possíveis extensões são estorno compensatório de venda, migrations versionadas, paginação, reservas de produção, controle por rolo/lote e permissões. Não são funcionalidades da versão entregue.
