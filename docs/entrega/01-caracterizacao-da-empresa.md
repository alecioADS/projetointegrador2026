# AVS Labs 3D - Caracterização da empresa e proposta do sistema

**Instituição:** [PREENCHER INSTITUIÇÃO]. **Curso:** Tecnologia em Análise e Desenvolvimento de Sistemas. **Disciplina:** PI - Projeto e Implementação, 2026/02. **Professora:** Ms. Cristiane Divina Lemes Hamawaki. **Integrantes:** [PREENCHER GRUPO].

## Identificação da organização

A organização escolhida é identificada pela marca AVS Labs 3D, associada à produção de peças por impressão 3D. O sistema desenvolvido utiliza o mesmo nome e a identidade visual oficial disponibilizada pelo responsável pelo projeto. Seu propósito é organizar o uso de filamentos, a utilização de impressoras, os produtos fabricados e a saída de produtos por venda.

**Localização:** [PREENCHER CIDADE E UF]. **Início das atividades:** [PREENCHER ANO OU DATA APROXIMADA]. **Sócios ou responsáveis:** [PREENCHER RESPONSÁVEIS]. **Quantidade de pessoas:** [PREENCHER QUANTIDADE DE PESSOAS]. **Filiais:** [PREENCHER FILIAIS]. Esses dados deverão ser confirmados pela organização antes da entrega, pois a implantação do software não determina a existência de filiais, o enquadramento jurídico ou o porte empresarial.

O ramo contemplado é a fabricação de produtos por impressão 3D com filamentos. O escopo operacional inclui identificar matérias-primas por marca, material e cor, planejar ordens de até quatro filamentos, acompanhar a disponibilidade das máquinas e registrar peças aprovadas. O sistema foi delimitado para uma operação local, com um único ambiente de dados e sem autenticação por pessoa.

**Missão proposta para validação:** transformar demandas de fabricação em peças impressas com organização operacional, rastreabilidade de materiais e controle das entregas comerciais. Essa formulação é uma proposta de alinhamento ao sistema e deverá ser substituída pela missão declarada da empresa, caso exista.

<!-- PAGEBREAK -->

# Mercado, público e ambiente de atuação

Os canais comerciais previstos no aplicativo são Marketplace e Varejo. Eles representam a origem de cada venda registrada pelo operador; o software não se conecta às plataformas nem realiza a venda online. O registro permite acompanhar quantidade vendida, preço unitário e faturamento bruto por canal.

O público consumidor efetivo deverá ser descrito com base nos produtos e clientes reais da AVS Labs 3D: [PREENCHER PRINCIPAIS PRODUTOS E NECESSIDADES ATENDIDAS]. Informações de poder aquisitivo, faixa etária, sexo e escolaridade do público deverão ser levantadas com a organização. Não se presume um perfil demográfico apenas pelo uso de impressão 3D. Para produtos destinados a empresas, é pertinente registrar o segmento e o tipo de necessidade produtiva atendida, além do perfil do responsável pela compra.

A concorrência também precisa ser caracterizada no contexto real da organização: [PREENCHER CONCORRENTES LOCAIS OU DIGITAIS E DIFERENCIAIS]. Como referência para o levantamento, podem ser observados outros fabricantes de peças impressas, prestadores de serviços de impressão 3D e vendedores de produtos equivalentes nos canais utilizados. Esses grupos são critérios de pesquisa, não uma lista de concorrentes confirmados.

No ambiente interno modelado, o operador utiliza navegador, servidor Node.js e PostgreSQL no mesmo computador. O programa funciona localmente, com dados persistentes. Após instalar dependências e a imagem do banco, a operação cotidiana não depende de internet. A abertura foi facilitada por um iniciador macOS que prepara o ambiente e abre a interface no navegador.

A proposta não exige criar departamentos formais na empresa. As funções de cadastro, produção, controle de estoque e registro de vendas podem ser realizadas pela mesma pessoa. A interface entre essas funções é feita pelos registros compartilhados: filamentos alimentam a produção; ordens concluídas alimentam o estoque de produtos; vendas reduzem o estoque e compõem o faturamento bruto.

<!-- PAGEBREAK -->

# Processos considerados e funcionamento proposto

O procedimento anterior deve ser confirmado pelo responsável: [PREENCHER COMO ERAM FEITOS CADASTROS, CONTAGENS, PLANEJAMENTO E REGISTRO DE VENDAS]. Não se afirma que a empresa utilizava caderno, planilha ou outro programa sem esse levantamento. A descrição abaixo apresenta os procedimentos que o novo aplicativo passa a oferecer, inclusive quando a função informatizada for nova.

No cadastro de filamentos, marca, material e cor são campos independentes. O operador informa custo por quilograma e saldo inicial em gramas. Uma reposição é registrada como entrada com motivo. Quando uma contagem exige corrigir o saldo total, a edição gera uma movimentação da diferença, preservando os registros anteriores.

As impressoras são identificadas por código da unidade, marca e modelo. A situação cadastral diferencia máquina disponível de máquina em manutenção. A disponibilidade operacional mostra Livre ou Ocupada conforme a existência de uma produção em execução. Isso permite distinguir duas máquinas do mesmo modelo.

O produto é cadastrado com nome e SKU. Uma ordem associa produto, quantidade planejada, impressora e de um a quatro filamentos distintos. A seleção da matéria-prima é feita separadamente por marca, material e cor. O operador informa a estimativa de consumo por filamento. O planejamento não reserva materiais; a baixa ocorre ao concluir a fabricação.

Ao iniciar a ordem, a impressora fica ocupada. Na conclusão, o operador informa consumo real de cada filamento e número de peças aprovadas. O sistema valida os saldos e confirma consumos, custos, movimentações e entrada do produto em conjunto. Se uma cor estiver sem saldo suficiente, a conclusão inteira é revertida. A ordem encerrada libera a impressora automaticamente.

O cancelamento é permitido antes do início. Produção iniciada deve ter seu consumo registrado mesmo em falha total, com zero peças aprovadas. Ordens canceladas sem movimentação podem ser apagadas após confirmação; ordens concluídas permanecem no histórico.

<!-- PAGEBREAK -->

# Problemas tratados, motivação e resultados esperados

A motivação da proposta é concentrar informações que precisam manter coerência durante a fabricação e a venda. Até a confirmação dos procedimentos anteriores, os itens abaixo são necessidades tratadas pelo sistema, e não alegações de falhas ocorridas na empresa.

Uma identificação baseada somente em marca não distingue filamentos de materiais e cores diferentes nem impressoras de um mesmo fabricante. A solução separa os três aspectos do filamento e utiliza código único por máquina. A seleção por modelo e unidade reduz a ambiguidade no planejamento.

O consumo de várias cores exige registrar a participação de cada filamento. A solução admite até quatro itens por ordem e grava consumo e custo por item. A baixa transacional evita concluir apenas parte das cores quando existe insuficiência em uma delas. A proteção de estado impede repetir a conclusão e duplicar a entrada de produtos.

A disputa por uma máquina é tratada ao iniciar a produção e reforçada por restrição do banco. A disponibilidade é derivada da ordem ativa, evitando a necessidade de lembrar de liberar a impressora manualmente. A edição de saldo também verifica se houve alteração desde a abertura do formulário, protegendo uma reposição ou consumo ocorrido no intervalo.

Na saída de produtos, a venda registra quantidade, canal e preço unitário, baixa o estoque e calcula o bruto. Esse valor não representa lucro, pois não desconta taxas ou despesas. A exportação geral reúne todas as seções em CSVs separados dentro de um ZIP, permitindo conferência externa sem criar um módulo financeiro completo.

Os resultados esperados são maior clareza do estoque disponível, rastreabilidade dos consumos, distinção das unidades de impressora e visibilidade do faturamento bruto. A comprovação operacional é feita por roteiro de demonstração e testes automatizados. Antes da entrega, o grupo deverá completar os campos de identificação e validar missão, público, concorrentes e procedimentos anteriores com dados reais da organização.
