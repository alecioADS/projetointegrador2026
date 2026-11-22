# Escopo acadêmico — AVS Labs 3D

Sistema local para controlar materiais e produção de uma empresa de impressão 3D. Ator principal: **operador da AVS Labs 3D**, responsável por cadastros, entradas e ordens. Sem distinção de papéis nesta edição.

## Lista de eventos — 20 funcionalidades

Todos são eventos externos, estimulados por uma ação do operador. A resposta externa inclui confirmação ou mensagem de erro; a tabela descreve a resposta interna e a informação exibida quando há sucesso. As entradas são validadas antes da gravação.

| ID | Evento | Estímulo | Ação e resposta interna | Resposta externa |
|---|---|---|---|---|
| 01 | Cadastrar filamento | Enviar cadastro | Gravar marca, material, cor, custo e saldo inicial com entrada auditável | Filamento e saldo disponíveis |
| 02 | Consultar filamentos | Abrir Materiais ou buscar | Ler cadastro e estoque | Lista com marca, material, cor e saldo |
| 03 | Alterar filamento e ajustar saldo | Salvar edição | Atualizar dados e registrar diferença de saldo; impedir sobrescrita de saldo desatualizado | Cadastro e histórico atualizados |
| 04 | Cadastrar impressora | Enviar cadastro | Gravar código único, marca, modelo e situação | Impressora na lista |
| 05 | Consultar impressoras | Abrir Impressoras ou buscar | Ler cadastro e disponibilidade derivada das ordens | Lista com Livre/Ocupada/Manutenção |
| 06 | Alterar impressora | Salvar edição | Atualizar cadastro, impedir manutenção durante produção | Cadastro atualizado |
| 07 | Cadastrar produto | Enviar cadastro | Gravar nome e SKU único, saldo zero | Produto na lista |
| 08 | Consultar produtos | Abrir Produtos ou buscar | Ler produtos e unidades disponíveis | Lista e estoque |
| 09 | Alterar produto | Salvar edição | Atualizar nome e SKU preservando estoque | Cadastro atualizado |
| 10 | Excluir cadastro | Confirmar exclusão de filamento, impressora ou produto | Excluir o cadastro selecionado apenas se não possuir vínculos | Lista atualizada ou mensagem de impedimento |
| 11 | Registrar entrada de filamento | Confirmar entrada | Somar saldo e registrar movimentação em transação única | Saldo e histórico atualizados |
| 12 | Consultar movimentações | Abrir Movimentações ou buscar | Ler entradas, ajustes, produção e vendas | Histórico com referência à ordem ou venda |
| 13 | Planejar produção | Enviar nova ordem | Vincular produto, impressora livre e de um a quatro filamentos com consumo estimado por cor | Ordem planejada |
| 14 | Consultar ordens | Abrir Produção ou buscar | Ler ordens e seus filamentos | Lista com estados, quantidades e custos |
| 15 | Iniciar produção | Acionar Iniciar | Validar estado e disponibilidade da impressora | Ordem em produção; impressora ocupada |
| 16 | Concluir produção | Enviar consumo real e peças aprovadas | Validar todas as cores, registrar consumos e produto em transação única e liberar a impressora | Estoques, custos e estado atualizados |
| 17 | Cancelar planejamento | Confirmar cancelamento | Cancelar somente ordens planejadas | Ordem cancelada sem movimentação |
| 18 | Apagar ordem cancelada | Confirmar exclusão da ordem | Excluir somente ordem cancelada sem movimentação e seus vínculos de filamentos | Ordem removida da lista |
| 19 | Registrar venda | Enviar produto, quantidade, canal e preço unitário | Validar saldo, calcular bruto, gravar venda e saída de estoque na mesma transação; impedir duplicação do reenvio | Venda registrada e estoque reduzido |
| 20 | Consultar vendas e faturamento bruto | Abrir Vendas ou buscar | Ler vendas e acumular bruto geral e por canal e unidades vendidas | Histórico de vendas e indicadores brutos |

A página inicial reúne contagens auxiliares. A exclusão de cadastros é uma funcionalidade comum parametrizada pelo tipo do cadastro. As vendas não incluem módulo financeiro, taxas ou despesas.

## Relação com as fases

1. **Caracterização da empresa:** confirmar missão, porte, localização, histórico, público e concorrência. Descrever o processo atual real antes de redigir as quatro páginas. Não presumir fatos sobre a AVS Labs 3D.
2. **UML:** usar estes eventos para descrever casos de uso e fluxos alternativos. Produzir diagrama de casos de uso, classes, objetos e uma sequência para cada caso de uso. Os dois estados iniciais estão em `estado-ordem.mmd` e `estado-impressora.mmd`; precisam ser revisados no conjunto final da documentação.
3. **Banco:** sete tabelas PostgreSQL em `database/schema.sql`; gerar o diagrama relacional no pgAdmin/DBeaver se necessário. A orientação posterior do professor para PostgreSQL foi informada pelo aluno; o PDF original mencionava MySQL Workbench.
4. **Aplicativo:** demonstrar cadastros, entrada, produção e integridade do banco com o roteiro do README.

As “fases 1 e 2” do repositório original eram etapas internas do desenvolvimento, diferentes das quatro fases acadêmicas.
