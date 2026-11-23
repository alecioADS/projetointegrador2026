# Documentação do AVS Labs 3D

## Pacote e PDFs

A entrega está em [output/entrega/AVS-Labs-3D-Documentacao-Entrega.zip](../output/entrega/AVS-Labs-3D-Documentacao-Entrega.zip). Os documentos para leitura/impressão estão em [output/pdf](../output/pdf). O pacote exclui .env, dados reais, backups, logs e dependências.

| Documento | Fonte editável | Resultado |
|---|---|---|
| Checklist e campos a confirmar | [Checklist](entrega/00-checklist-da-entrega.md) | Conferir antes de submeter |
| Fase 1: empresa e proposta | [Caracterização](entrega/01-caracterizacao-da-empresa.md) | [PDF de quatro páginas](../output/pdf/01-Fase-1-Empresa-e-Proposta.pdf) |
| Fase 2: UML e casos de uso | [Modelagem](entrega/02-modelagem-uml.md) | [PDF](../output/pdf/02-Fase-2-Modelagem-UML.pdf) |
| Fase 3: banco | [Modelo e implementação](entrega/03-modelo-de-dados.md) | [PDF](../output/pdf/03-Fase-3-Banco-de-Dados.pdf) |
| Fase 4: aplicativo/apresentação | [Roteiro](entrega/04-implementacao-e-apresentacao.md) | [PDF](../output/pdf/04-Fase-4-Apresentacao.pdf) |
| Técnica completa | [Índice abaixo](#documentação-técnica) | [PDF completo](../output/pdf/05-Documentacao-Tecnica-Completa.pdf) |
| Manual do usuário | [Manual](tecnica/06-manual-do-usuario.md) | [PDF](../output/pdf/06-Manual-do-Usuario.pdf) |
| Atlas de diagramas | [Fontes e imagens](uml) | [PDF em páginas A3](../output/pdf/07-Atlas-Diagramas-UML.pdf) |

A fase 1 usa Arial 12 e entrelinha de 18 pontos (1,5). Identificação acadêmica e dados empresariais foram incorporados em 23/11/2026. Filiais e perfil demográfico dos clientes não foram confirmados e estão indicados como limitações; a missão é uma proposta. A parte técnica e os diagramas refletem o aplicativo implementado.

## Documentação técnica

1. [Visão geral, stack e estrutura](tecnica/01-visao-geral-e-stack.md).
2. [Arquitetura, transações e fluxos](tecnica/02-arquitetura-e-fluxos.md).
3. [Requisitos e regras de negócio](tecnica/03-regras-e-requisitos.md).
4. [Banco e dicionário dos 49 campos](tecnica/04-banco-de-dados.md).
5. [API HTTP e exemplos dos 25 endpoints](tecnica/05-api-http.md).
6. [Manual do usuário](tecnica/06-manual-do-usuario.md).
7. [Instalação, operação, manutenção e backup](tecnica/07-instalacao-operacao-e-manutencao.md).
8. [Testes e rastreabilidade](tecnica/08-testes-e-rastreabilidade.md).

Os modelos de classes/objetos são conceituais. O código real usa componentes React e funções/rotas JavaScript. Disponibilidade de impressora é derivada de ordens, não um terceiro valor gravado no cadastro. O modelo físico contempla os campos legados explicitamente.

## Editar e gerar novamente

```sh
python3 -m venv .venv-docs
.venv-docs/bin/pip install -r requirements-docs.txt
.venv-docs/bin/python scripts/build_docs.py
```

A geração exige Arial.ttf, Arial Bold.ttf, Arial Italic.ttf e Arial Bold Italic.ttf. No Mac, procura em /System/Library/Fonts/Supplemental. Em outro ambiente, defina ARIAL_FONT_DIR para a pasta com essas fontes. Não substituir a fonte da fase 1 silenciosamente, pois Arial 12 é exigência do enunciado.

Para editar casos de uso, usar entrega/casos-de-uso.json e executar `python3 scripts/sync_case_docs.py`. Isso atualiza as descrições essenciais e os vinte arquivos de sequência. A lista de eventos e o diagrama global devem continuar refletindo os mesmos vinte casos.

Para atualizar diagramas, editar os .puml e usar o PlantUML oficial. A versão usada nesta entrega é 1.2026.10, da distribuição em https://github.com/plantuml/plantuml/releases/tag/v1.2026.10. Com Java instalado:

```sh
PLANTUML_JAR=/caminho/plantuml.jar sh scripts/render-uml.sh
.venv-docs/bin/python scripts/build_docs.py
```

Smetana faz o layout Java dos diagramas sem exigir Graphviz externo. PNG é usado nos PDFs e SVG permite ampliar sem perda. O atlas usa A3 para facilitar leitura. O gerador verifica que a fase 1 tenha exatamente quatro páginas e cria o manifesto com contagens e campos pendentes.

O script não acessa o banco. Dados pessoais/empresariais podem ser preenchidos em entrega/dados-do-trabalho.json; passagens narrativas sobre missão, público, concorrência e processos também devem ser revistas no Markdown. Não há coleta automática dessas informações.

Para validar os artefatos sem regenerá-los, execute `.venv-docs/bin/python scripts/check_docs.py`. A mesma conferência é executada no CI após instalar requirements-docs.txt; ela não exige Arial instalada no runner porque inspeciona a fonte já embutida no PDF.
