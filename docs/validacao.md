# Validação do aplicativo e da documentação

## Verificação da revisão documentada

A revisão de comentários foi seguida de build, verificação de formatação, suíte de API/migração e jornadas de navegador. Não foram alteradas regras de negócio para produzir a documentação.

- Build de produção: aprovado.
- Prettier: aprovado.
- API e migração com PGlite: sete testes de nível superior aprovados, cobrindo os cenários detalhados em tecnica/08-testes-e-rastreabilidade.md.
- Navegador Chrome com base temporária isolada: seis jornadas aprovadas, incluindo multicor, vendas, edição de saldo, exclusão de cancelada e download ZIP.
- PostgreSQL real: o workflow .github/workflows/ci.yml executa a integração nativa a cada push. Consultar o resultado associado ao commit final na aba Actions.

O PGlite executa SQL PostgreSQL, mas não substitui a verificação de locks entre conexões nativas. Não foram medidos percentual de cobertura, carga, SLA ou uso em dispositivos físicos.

## Documentação gerada

Quatro fases em Markdown/PDF; fase 1 com quatro páginas em Arial 12 e entrelinha 18 pt; vinte casos de uso e vinte sequências; classes, objetos e dois estados; modelo físico; arquitetura; referência de API, dicionário dos 49 campos, manuais e checklist. O atlas usa páginas A3 para ampliar diagramas.

As figuras são renderizadas localmente a partir de PlantUML. Os PDFs são renderizados para inspeção visual. O manifesto em output/manifesto-documentacao.json registra páginas, contagens e campos institucionais/empresariais ainda pendentes.

A caracterização da empresa só pode ser submetida como factual depois de preencher e validar os dados indicados em entrega/dados-do-trabalho.json e no texto da fase 1. Não foram inventados integrantes, porte, histórico ou perfil demográfico de clientes.

## Segurança do pacote

O pacote inclui documentos, diagramas, SQL e metadados de dependências. Não contém .env, backups, logs, node_modules ou dados reais do banco. As imagens do manual usam dados ilustrativos dos testes automatizados.
