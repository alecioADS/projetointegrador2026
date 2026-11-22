# Requisitos e regras de negócio

## Atores e ambiente

O único ator funcional é o Operador da AVS Labs 3D. Não existem contas ou papéis autenticados. Uma pessoa pode executar atividades de cadastro, produção e venda no mesmo ambiente. Banco, servidor e interface são locais.

## Requisitos funcionais

| Código | Requisito | Referência principal |
|---|---|---|
| RF01 | Cadastrar e consultar filamentos com marca, material e cor separados | UC01, UC02 |
| RF02 | Registrar saldo inicial auditável | UC01 |
| RF03 | Editar cadastro e saldo sem apagar histórico | UC03 |
| RF04 | Identificar impressoras por código único, marca e modelo | UC04, UC05, UC06 |
| RF05 | Cadastrar, consultar e editar produtos com SKU único | UC07, UC08, UC09 |
| RF06 | Impedir exclusão de registros com vínculos | UC10 |
| RF07 | Registrar reposição de filamento com motivo | UC11 |
| RF08 | Consultar histórico com entradas e saídas | UC12 |
| RF09 | Planejar de um a quatro filamentos distintos por ordem | UC13 |
| RF10 | Selecionar marca, material e cor separadamente | UC13 |
| RF11 | Selecionar modelo e unidade de impressora livre | UC13 |
| RF12 | Consultar ordens com consumos e estados | UC14 |
| RF13 | Iniciar somente uma execução por impressora | UC15 |
| RF14 | Registrar consumo real por cor e peças aprovadas | UC16 |
| RF15 | Concluir sem movimentações parciais ou duplicadas | UC16 |
| RF16 | Cancelar somente planejamento; apagar cancelada sem movimentos | UC17, UC10 |
| RF17 | Registrar venda por Marketplace ou Varejo | UC18 |
| RF18 | Dar baixa de produto e calcular total bruto | UC18 |
| RF19 | Consultar vendas, unidades e bruto acumulado por canal | UC19 |
| RF20 | Exportar todos os dados em CSVs separados dentro de ZIP | UC20 |
| RF21 | Exibir contagens auxiliares na visão geral | Página inicial |

## Regras de domínio

- RN01: marca, material e cor são três aspectos diferentes do filamento. Um cadastro representa um saldo agregado daquele registro; não há código de rolo físico.
- RN02: gramas usam centésimos; unidades de produto são inteiras. Quantidades de entrada, planejamento e preço são positivas. Saldo inicial e ajustes aceitam zero.
- RN03: cada movimento possui exatamente um alvo: material_id ou product_id. Quantidade positiva é entrada e negativa é saída.
- RN04: alterar saldo produz movimento da diferença. Salvar o mesmo saldo não produz um movimento vazio.
- RN05: o saldo enviado como referência deve coincidir com o saldo corrente ao editar.
- RN06: código de impressora é único sobre lower(trim(code)). SKU de produto possui restrição unique; não há normalização de caixa para o SKU no banco.
- RN07: uma impressora em manutenção não planeja/inicia uma ordem. Uma impressora ocupada não é selecionável nem aceita uma nova ordem pela API enquanto está executando.
- RN08: uma impressora disponível pode ter vários planejamentos; o início exige exclusividade efetiva.
- RN09: uma ordem utiliza de um a quatro IDs de filamento distintos. Não há verificação física de compatibilidade de materiais ou de AMS na máquina.
- RN10: planejar e iniciar não reservam nem baixam estoque. O saldo é exigido na conclusão.
- RN11: consumos enviados na conclusão devem corresponder exatamente aos itens planejados. Uma cor pode ter consumo zero, mas o total não pode ser zero.
- RN12: peças aprovadas variam de zero à quantidade planejada. Não existe campo separado para reprovadas; a diferença pode ser calculada para análise.
- RN13: falha total é uma ordem concluída com consumo positivo e zero aprovadas; não existe estado falha_total nesta versão.
- RN14: concluir atualiza todas as cores, produto, movimentos e custo em uma transação. Qualquer erro reverte o conjunto.
- RN15: ordem em execução não pode ser cancelada. A conclusão registra material consumido mesmo quando não houve peças aprovadas.
- RN16: apagar ordem exige estado cancelada e ausência de movimentos; as ordens concluídas permanecem como histórico.
- RN17: a venda usa produto com estoque suficiente, quantidade inteira e preço positivo com duas casas decimais.
- RN18: total bruto é calculado no banco como quantidade multiplicada por preço unitário. Não são calculados taxas, lucro ou recebimento.
- RN19: UUID da venda identifica uma tentativa de operação. Reenviar os mesmos dados devolve a venda existente; mudar os dados com a mesma chave causa conflito.
- RN20: vendas e movimentações não possuem exclusão ou estorno no fluxo implementado.
- RN21: relatório geral inclui todo o histórico, com leituras consistentes. CSVs são separados por seção porque CSV não suporta abas.
- RN22: dados já vinculados não podem ser removidos por exclusão de cadastro. As restrições são reforçadas pelo banco.

## Requisitos não funcionais e limites verificáveis

| Código | Requisito ou decisão | Evidência/limite |
|---|---|---|
| RNF01 | Persistir registros em banco relacional local | PostgreSQL e volume Docker; não apenas memória do navegador |
| RNF02 | Garantir atomicidade das operações de estoque | BEGIN/COMMIT/ROLLBACK e testes de rollback |
| RNF03 | Validar os contratos no servidor | Objetos Zod estritos e testes de erro |
| RNF04 | Restringir a escuta ao computador local | listen em 127.0.0.1; Compose publica loopback |
| RNF05 | Suportar layouts de desktop e viewport móvel | CSS responsivo e jornadas Playwright |
| RNF06 | Preservar precisão monetária na persistência | numeric e cálculo SQL; interface soma centavos |
| RNF07 | Permitir manutenção e reprodução | package-lock, SQL, fontes UML, testes e documentação |
| RNF08 | Facilitar abertura na apresentação | iniciador macOS com verificações e navegador |
| RNF09 | Exportar dados em formato legível por planilhas | CSV UTF-8 com BOM e ZIP |
| RNF10 | Manter interface clara e marca oficial | tema claro neutro e assets oficiais |

Não foram estabelecidos nem medidos SLA, capacidade máxima de usuários, metas de latência, disponibilidade ininterrupta ou cobertura percentual de testes. Não há autenticação, trilha por autor, criptografia de aplicação, backup automático agendado, paginação ou monitoramento de produção. Essas características não devem ser apresentadas como implementadas.
