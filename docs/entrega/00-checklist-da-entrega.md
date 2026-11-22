# Checklist de entrega e informações a confirmar

## Correspondência com os enunciados

| Fase | Exigência | Material produzido |
|---|---|---|
| 1 | Quatro páginas, Arial 12, espaçamento 1,5; empresa, grupo, ambiente, problemas e proposta | 01-caracterizacao-da-empresa.md e PDF de quatro páginas |
| 2 | 15 a 20 eventos, tipo/estímulo/ação/respostas; atores e casos de uso | casos-de-uso.json, lista de 20 eventos e descrições essenciais |
| 2 | Casos de uso, classes, objetos, sequência por caso e pelo menos dois estados | 20 sequências e diagramas estruturais/estados em PlantUML, PNG, SVG e atlas PDF |
| 3 | Modelagem e implementação da base | SQL comentado, modelo físico e dicionário; PostgreSQL conforme orientação posterior relatada pelo aluno |
| 4 | Implementação e apresentação | Código, manual, roteiro demonstrável, testes e instruções de execução |

Os prazos escritos nos enunciados são 01/09/2026, 20/10/2026, 03/11/2026 e 01/12/2026. Não foram alterados nesta documentação. A regra de PostgreSQL foi fornecida pelo aluno depois da leitura do PDF que mencionava Workbench.

## Campos reais pendentes antes de submeter a fase 1

Preencher em docs/entrega/dados-do-trabalho.json e no texto da fase 1: instituição, integrantes, cidade/UF, início de atividades, responsáveis/sócios, quantidade de pessoas, filiais, missão declarada (se houver), produtos/público reais, concorrentes e processo anterior.

As menções a esses dados no texto estão identificadas como campos a preencher ou proposta para validação. Não submeter a fase 1 como caracterização empresarial validada enquanto esses campos permanecerem pendentes. O software, os diagramas e os demais documentos técnicos podem ser revisados independentemente dessa confirmação.

## Conferências do grupo

1. Completar identificação do grupo e fatos da empresa.
2. Conferir se a professora deseja capa separada ou modelo institucional; a fase 1 produzida tem quatro páginas de conteúdo, sem capa adicional.
3. Confirmar a substituição de MySQL Workbench por PostgreSQL na fase 3.
4. Abrir os PDFs e conferir a leitura das figuras; o atlas usa páginas maiores para os diagramas detalhados.
5. Executar o roteiro da fase 4 e abrir os relatórios exportados.
6. Conferir o commit e os testes da versão apresentada no GitHub.
7. Não enviar .env, backups locais, senhas, node_modules, logs ou dados reais de operação junto do pacote de documentação.
