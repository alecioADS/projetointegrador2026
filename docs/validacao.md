# Validação da versão acadêmica

## Verificado localmente

- Instalação das dependências e auditoria npm: sem vulnerabilidades reportadas no momento da instalação.
- Build de produção com Vite: aprovado.
- Formatação com Prettier: aprovada.
- Teste de integração da API com PGlite: aprovado. Executa o SQL real e verifica cadastro, edição, exclusão, SKU único, validação, entrada, impedimento de estoque negativo, estados de ordem, ocupação de impressora, custo de material, perda total e preservação do histórico.
- Requisições simultâneas no teste embarcado verificam a proteção por estado e saldo, com transações serializadas pelo PGlite. Bloqueios entre conexões precisam do teste no servidor PostgreSQL.

## Restrições desta sessão

O servidor PostgreSQL nativo não pôde ser iniciado por restrição de memória compartilhada do ambiente. O Docker estava instalado, mas o daemon estava desligado. A tentativa de iniciar Chrome pelo Playwright foi encerrada pelo ambiente antes de abrir a página. Não foi possível concluir a inspeção visual local nem a jornada de navegador nesta execução.

## Verificação no GitHub

O workflow usa PostgreSQL 18 real, executa o mesmo teste de integração com conexões independentes e roda a jornada de navegador no Chromium. As capturas de desktop e celular ficam no artefato `verificacao-interface`. Consulte a aba Actions para o resultado associado a cada commit.

## Entregas acadêmicas

O aplicativo e os arquivos de escopo/modelo de dados/estados são a base técnica. Ainda faltam a caracterização real da empresa em quatro páginas e o conjunto completo de UML: descrição dos casos de uso, diagrama de casos de uso, classes, objetos e sequências por caso de uso. Não há dados fictícios apresentados como fatos da empresa.
