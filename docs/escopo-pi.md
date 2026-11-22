# Escopo acadêmico — AVS Labs 3D

Sistema local para controlar materiais e produção de uma empresa de impressão 3D. Ator principal: **operador da AVS Labs 3D**, responsável por cadastros, entradas e ordens. Sem distinção de papéis nesta edição.

## Lista de eventos — 20 funcionalidades

Todos são eventos externos, estimulados por uma ação do operador. A resposta externa inclui confirmação ou mensagem de erro; a tabela descreve a resposta interna e a informação exibida quando há sucesso. As entradas são validadas antes da gravação.

| ID | Evento | Estímulo | Ação e resposta interna | Resposta externa |
|---|---|---|---|---|
| 01 | Cadastrar material | Envio do formulário | Gravar marca, material, cor e custo/kg, saldo zero | Material na lista |
| 02 | Consultar materiais | Abrir Materiais ou buscar | Ler e filtrar cadastros | Lista e saldo em gramas |
| 03 | Alterar material | Salvar edição | Atualizar dados descritivos e custo, preservar saldo | Cadastro atualizado |
| 04 | Excluir material | Confirmar exclusão | Excluir somente sem vínculos | Lista atualizada ou impedimento |
| 05 | Cadastrar impressora | Envio do formulário | Gravar código único, marca, modelo e situação | Impressora na lista |
| 06 | Consultar impressoras | Abrir Impressoras ou buscar | Consultar cadastros e ocupação | Lista e situação |
| 07 | Alterar impressora | Salvar edição | Atualizar cadastro; impedir manutenção se ocupada | Dados e situação atualizados |
| 08 | Excluir impressora | Confirmar exclusão | Excluir somente sem ordens vinculadas | Lista atualizada ou impedimento |
| 09 | Cadastrar produto | Envio do formulário | Gravar nome e SKU único, saldo zero | Produto na lista |
| 10 | Consultar produtos | Abrir Produtos ou buscar | Consultar cadastros | Lista e unidades disponíveis |
| 11 | Alterar produto | Salvar edição | Atualizar nome e SKU, preservar saldo | Cadastro atualizado |
| 12 | Excluir produto | Confirmar exclusão | Excluir somente sem vínculos | Lista atualizada ou impedimento |
| 13 | Registrar entrada de material | Confirmar entrada | Somar gramas e gravar movimento na mesma transação | Saldo e histórico atualizados |
| 14 | Consultar movimentações | Abrir Movimentações ou buscar | Ler entradas, consumos e produtos gerados | Histórico com data, motivo e ordem |
| 15 | Planejar produção | Enviar nova ordem | Selecionar marca/modelo e uma impressora livre; vincular de um a quatro filamentos (marca, material e cor), produto, quantidade e consumo estimado por cor | Ordem planejada |
| 16 | Consultar ordens | Abrir Produção ou buscar | Ler ordens com nomes dos cadastros | Lista, estados, quantidades e custo |
| 17 | Iniciar produção | Acionar Iniciar | Verificar estado e disponibilidade da impressora; alterar ordem | Ordem em produção |
| 18 | Concluir produção | Informar consumo real e aprovadas | Validar o saldo de cada cor, consumir filamentos, gerar produto, gravar movimentos e custo em transação única | Ordem concluída e estoques atualizados |
| 19 | Cancelar planejamento | Confirmar cancelamento | Cancelar somente ordem planejada | Ordem cancelada sem movimentar estoque |
| 20 | Consultar painel | Abrir Visão geral | Contar materiais, impressoras, produtos e ordens abertas | Indicadores da operação |

## Relação com as fases

1. **Caracterização da empresa:** confirmar missão, porte, localização, histórico, público e concorrência. Descrever o processo atual real antes de redigir as quatro páginas. Não presumir fatos sobre a AVS Labs 3D.
2. **UML:** usar estes eventos para descrever casos de uso e fluxos alternativos. Produzir diagrama de casos de uso, classes, objetos e uma sequência para cada caso de uso. Os dois estados iniciais estão em `estado-ordem.mmd` e `estado-impressora.mmd`; precisam ser revisados no conjunto final da documentação.
3. **Banco:** seis tabelas PostgreSQL em `database/schema.sql`; gerar o diagrama relacional no pgAdmin/DBeaver se necessário. A orientação posterior do professor para PostgreSQL foi informada pelo aluno; o PDF original mencionava MySQL Workbench.
4. **Aplicativo:** demonstrar cadastros, entrada, produção e integridade do banco com o roteiro do README.

As “fases 1 e 2” do repositório original eram etapas internas do desenvolvimento, diferentes das quatro fases acadêmicas.
