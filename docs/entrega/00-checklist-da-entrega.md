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

## Dados empresariais e identificação

Identificação do aluno, RA, instituição, cidade, início das atividades, proprietário, equipe, produtos, clientes, canais, concorrentes, processos anteriores e objetivos foram incorporados a partir dos documentos anteriores e das informações fornecidas pelo proprietário em 23/11/2026. A documentação anterior do FarmaSync foi utilizada apenas para identificação do trabalho; seus fatos empresariais fictícios não foram transferidos.

**Informações ainda não confirmadas:** existência de filiais e perfil demográfico (idade, renda, sexo e escolaridade) dos clientes. A fase 1 declara essas limitações, sem campos genéricos a preencher nem dados inventados. A missão está explicitamente identificada como proposta. O porte jurídico/fiscal não foi informado.

O cálculo completo de custos e lucratividade é um objetivo de evolução: a versão atual registra custo de filamento e faturamento bruto, sem financeiro completo. Revisar essas limitações com a professora caso exija caracterização empresarial adicional.

## Conferências do grupo

1. Conferir os dados incorporados e, quando disponíveis, confirmar filiais e perfil demográfico dos clientes.
2. Conferir se a professora deseja capa separada ou modelo institucional; a fase 1 produzida tem quatro páginas de conteúdo, sem capa adicional.
3. Confirmar a substituição de MySQL Workbench por PostgreSQL na fase 3.
4. Abrir os PDFs e conferir a leitura das figuras; o atlas usa páginas maiores para os diagramas detalhados.
5. Executar o roteiro da fase 4 e abrir os relatórios exportados.
6. Conferir o commit e os testes da versão apresentada no GitHub.
7. Não enviar .env, backups locais, senhas, node_modules, logs ou dados reais de operação junto do pacote de documentação.
