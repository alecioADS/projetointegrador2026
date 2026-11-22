# Testes e rastreabilidade

## Estratégia e execução

A suíte usa node:test/assert, Supertest e Playwright. Regras são verificadas pela API e pelas jornadas de interface; não existe suíte separada de domínio puro nem percentual de cobertura medido.

Sem TEST_DATABASE_URL, a API é testada com PGlite em memória. Isso executa SQL PostgreSQL, mas serializa transações de forma diferente de várias conexões nativas. Com TEST_DATABASE_URL, os testes criam uma base temporária própria, usam conexões PostgreSQL reais e removem essa base no encerramento. A conta de testes precisa de permissão para criar/remover esse banco.

```sh
npm run format:check
npm run build
npm test
npm run test:e2e
```

Definir TEST_DATABASE_URL antes de npm test para usar PostgreSQL nativo. Playwright espera o app aberto e insere dados demonstrativos: usar base de teste vazia, nunca a base de trabalho. UI_BASE_URL pode definir o endereço. No Mac local, usa Chrome; no CI, Chromium instalado pelo workflow.

## Cobertura comportamental

| Área | Cenários |
|---|---|
| Cadastros | Criar, consultar, editar, excluir; validar campos; impedir código/SKU duplicado e remoção com vínculos |
| Filamentos | Saldo inicial positivo/fracionário/zero, entrada, ajuste para cima/baixo/zero e movimento da diferença |
| Edição concorrente | Rejeitar referência de saldo antiga após uma reposição |
| Impressoras | Disponibilidade, manutenção e exclusividade da execução |
| Produção | Transições, saldos, aprovadas, falha total e conclusão repetida |
| Multicor | De 1 a 4 itens, IDs distintos, composição exata, custo por cor e rollback integral |
| Concorrência | Duas conclusões do mesmo trabalho e disputa por saldo entre ordens |
| Canceladas | Apagar somente elegível, 404 após remover e confirmação no navegador |
| Vendas | Cálculo bruto, baixa, canais, preço/quantidade, insuficiência, reenvio e concorrência |
| Relatórios | ZIP, oito CSVs, acentos, aspas, ponto e vírgula, quebra de linha, decimal e proteção de texto-fórmula |
| Migração | Renomeações, preservação de IDs/saldo/custo e reaplicação sem duplicar itens |

## Jornadas de interface

1. Cadastro, entrada de material, impressoras, produto, produção, conclusão e conferência dos saldos em desktop e viewport móvel.
2. Seleção independente de marca/material/cor e conclusão com quatro filamentos.
3. Cancelamento, confirmação de exclusão e opção de voltar.
4. Edição do saldo com reflexo na tabela e no histórico.
5. Venda em Marketplace e Varejo, faturamento e bloqueio de quantidade excedente.
6. Download real do ZIP e conferência dos arquivos CSV.

Os dados de teste não são operações reais da empresa. Capturas ficam em test-results e no artefato verificacao-interface do CI. Não são backups.

## GitHub Actions

O workflow usa PostgreSQL 18, Node 24, npm ci, format:check, build e integração com banco nativo temporário. Também valida a integridade dos PDFs, a fase 1 com quatro páginas/Arial, os vinte casos e sequências, os campos/endpoints e o conteúdo seguro do ZIP. Depois instala Chromium, aplica o esquema no banco de demonstração e executa as jornadas Playwright. Os artefatos permitem conferir telas e downloads.

O resultado válido é o da execução vinculada ao commit apresentado. Um sucesso antigo não comprova uma revisão nova. Não foram medidos carga, dispositivos físicos, todos os leitores de planilhas ou cobertura percentual.

## Matriz entre casos de uso e código

| Casos | Implementação | Evidência principal |
|---|---|---|
| UC01 a UC03 | Formulários de filamento; rotas materials | API de saldo/ajustes e jornada de edição |
| UC04 a UC06 | Impressoras e disponibilidade | API de código/manutenção e seleção por modelo/unidade |
| UC07 a UC09 | Produtos | API de SKU/saldo e jornada de produção |
| UC10 | DELETE de cadastros e ordens | Vínculos/estados na API; confirmação/voltar na interface |
| UC11, UC12 | stock-entry e movements | Quantidades, motivos e conciliação de movimentos |
| UC13 a UC17 | Ordens, itens e transações | Concorrência, multicor, falha total e jornadas |
| UC18, UC19 | sales/products/movimentos; SalesPanel | Idempotência, disputa de saldo e venda por canal |
| UC20 | reports.js; downloadReports | Formato/conteúdo da API e download no navegador |

O modelo UML de classes é conceitual. O modelo físico corresponde às sete tabelas. Os estados diferenciam coluna persistida e disponibilidade derivada. Funcionalidades futuras são identificadas como evolução, não como comportamento implementado.
