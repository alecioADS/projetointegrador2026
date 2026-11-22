# Validação da versão acadêmica

## Verificado localmente

- Instalação das dependências e auditoria npm: sem vulnerabilidades reportadas no momento da instalação.
- Build de produção com Vite: aprovado.
- Formatação com Prettier: aprovada.
- Teste de integração da API com PGlite: aprovado. Executa o SQL real e verifica cadastro, edição, exclusão, SKU único, validação, entrada, impedimento de estoque negativo, estados de ordem, ocupação de impressora, custo de material, perda total e preservação do histórico.
- Requisições simultâneas no teste embarcado verificam a proteção por estado e saldo, com transações serializadas pelo PGlite. Bloqueios entre conexões precisam do teste no servidor PostgreSQL.

## Interface e execução com PostgreSQL real

- Jornada Playwright no Chrome local: aprovada (cadastros → entrada → ordem → início → conclusão → consulta de saldo e histórico).
- Capturas de desktop (1440 px) e celular (390 px): inspecionadas visualmente, sem transbordamento horizontal da página no celular. Navegação e tabelas podem rolar horizontalmente dentro de seus contêineres.
- A execução local de interface usou banco PGlite temporário somente para a verificação; a aplicação entregue exige PostgreSQL comum.
- GitHub Actions, execução inicial: instalação, formatação, build, integração com PostgreSQL 18 real e criação do esquema aprovados. O teste de interface identificou rótulos de seleção ambíguos, corrigidos com nomes acessíveis explícitos.
- O workflow executa a jornada de navegador sobre o PostgreSQL real em cada push. Consulte a aba Actions para o resultado do commit atual e o artefato `verificacao-interface` com as capturas.

O servidor PostgreSQL nativo não foi iniciado nesta sessão por restrição de memória compartilhada; o Docker estava desligado. Isso foi contornado para verificação pelo teste nativo no ambiente isolado do GitHub, sem alterar serviços da máquina do aluno.

## Entregas acadêmicas

O aplicativo e os arquivos de escopo/modelo de dados/estados são a base técnica. Ainda faltam a caracterização real da empresa em quatro páginas e o conjunto completo de UML: descrição dos casos de uso, diagrama de casos de uso, classes, objetos e sequências por caso de uso. Não há dados fictícios apresentados como fatos da empresa.

## Identificação e disponibilidade de impressoras

Cadastro com código único (sem distinção de maiúsculas), marca e modelo. Testes aprovados para filtro por modelo, reset da unidade ao trocar o modelo, bloqueio de ocupadas na interface e API, liberação automática na conclusão e migração repetível preservando os cadastros anteriores.

## Produção com até quatro filamentos

Testados limite de quatro linhas, bloqueio de repetição, filtros independentes de marca/material/cor, consumo real e custo por filamento, rollback de todas as cores em falta de saldo e preservação de ordens antigas. A jornada de navegador cobre seleção e conclusão de quatro cores, baixa independente de estoque, geração de produto uma única vez e liberação da impressora.
