# AVS Labs 3D - Caracterização da empresa e proposta do sistema

**Instituição:** IMEPAC. **Curso:** Tecnologia em Análise e Desenvolvimento de Sistemas. **Disciplina:** PI - Projeto e Implementação, 2026/02. **Professora:** Ms. Cristiane Divina Lemes Hamawaki. **Integrante:** Alécio Vieira da Silva, RA 2426510402. Projeto individual.

## Identificação da organização

A AVS Labs 3D é a área da AVS Labs dedicada à impressão 3D, sediada em Araguari, Minas Gerais. Começou em 2026, com planejamento comercial registrado desde setembro, para desenvolver produtos próprios e fabricar peças personalizadas sob encomenda. Sua estrutura inicial contou com duas impressoras Bambu Lab A1 Combo.

Alécio Vieira da Silva é o proprietário. A operação conta com duas pessoas, Alécio e Mariana, e tem sua base em Araguari. A existência de filiais ainda não foi confirmada pelo responsável. A equipe reduzida caracteriza a dimensão operacional relatada, sem determinar enquadramento jurídico, porte fiscal ou faturamento da organização.

A empresa fabrica chaveiros personalizados, lembrancinhas, vasos, enfeites, peças decorativas, suportes, organizadores e cases. Também desenvolve peças sob medida e itens personalizados com QR Code e NFC. Seu ramo é a fabricação de produtos por impressão 3D, com atendimento de demandas de personalização e utilidade cotidiana.

**Missão proposta:** desenvolver e fabricar produtos personalizados e utilitários por impressão 3D, com atenção às necessidades de cada cliente e organização da produção. Essa formulação foi elaborada para o trabalho a partir dos objetivos informados; não é apresentada como missão institucional já declarada pela empresa.

<!-- PAGEBREAK -->

# Mercado, público e ambiente de atuação

A AVS Labs 3D atende principalmente consumidores finais e clientes que encomendam produtos para eventos, como casamentos e feiras escolares. Seus produtos combinam personalização, decoração e utilidade. Não foram levantadas faixas de renda, idade, sexo ou escolaridade dos consumidores; não se atribui à clientela um perfil demográfico sem pesquisa.

Os canais atuais são venda direta, atendimento pelo WhatsApp e pelo Instagram @avslabs3d, Shopee e TikTok Shop. No aplicativo, as vendas são classificadas em Marketplace ou Varejo. Essa classificação permite acompanhar quantidade, preço unitário e faturamento bruto por canal; não existe conexão automática com plataformas, mensagens, pagamentos ou anúncios.

A concorrência inclui ateliês de impressão 3D, vendedores de personalizados nos marketplaces e lojas de presentes e lembrancinhas. Na pesquisa de mercado relatada pelo proprietário foram mapeadas Ateliê Mestre Criativo, Flayart3D e PrintaColor3D, em segmentos como decoração e acessórios. Esses nomes são referências fornecidas pela organização, sem afirmação de localização, participação de mercado ou comparação de desempenho.

A empresa pretende consolidar a marca, ampliar as vendas pela internet e estabelecer parcerias com lojas locais. O atendimento sob encomenda e o desenvolvimento de peças próprias compõem sua proposta comercial. A expansão exige organizar materiais, capacidade das máquinas, produção e produtos disponíveis para venda.

O sistema funciona localmente com navegador, servidor Node.js e PostgreSQL. Após instalar dependências e a imagem do banco, a operação cotidiana não depende de internet. Cadastro, fabricação, estoque e vendas compartilham os mesmos registros, sem exigir departamentos formais. O programa não possui autenticação individual nem separação de dados por filial.

<!-- PAGEBREAK -->

# Processos anteriores e funcionamento proposto

Antes do aplicativo, os controles eram feitos com planilhas e lançamentos manuais. Elas reuniam vendas, caixa, estoque, produção e custos. Recebimentos e pagamentos também exigiam registro manual. As dificuldades relatadas incluíam atualizar os registros, acompanhar o consumo de filamento e calcular o custo e a margem dos pedidos considerando material, tempo de máquina, energia, embalagem e taxas.

No novo cadastro de filamentos, marca, material e cor são campos independentes. O operador informa custo por quilograma e saldo inicial em gramas. Reposições geram entradas com motivo. Uma correção do saldo total registra a diferença no histórico, preservando os movimentos anteriores e permitindo conferir a contagem física.

As impressoras são identificadas por código da unidade, marca e modelo, distinguindo máquinas iguais. A situação cadastral indica disponibilidade ou manutenção. A indicação Livre ou Ocupada é calculada conforme a existência de uma ordem em execução. O produto é identificado por nome e SKU e recebe saldo quando uma fabricação é concluída.

Uma ordem associa produto, quantidade planejada, impressora e até quatro filamentos distintos, selecionados por marca, material e cor. O operador informa consumo estimado por item. O planejamento não reserva materiais. Ao iniciar a ordem, a impressora fica ocupada; na conclusão são informados o consumo real de cada filamento e a quantidade de peças aprovadas.

A conclusão valida os saldos e confirma consumos, custos de material, movimentações e entrada do produto em conjunto. Se uma cor tiver saldo insuficiente, toda a operação é revertida. A máquina é liberada ao encerrar a produção. Planejamentos podem ser cancelados; produções iniciadas devem registrar consumo mesmo em falha total, com zero peças aprovadas.

<!-- PAGEBREAK -->

# Problemas tratados, motivação e resultados esperados

A motivação é reunir informações operacionais antes mantidas em planilhas e reduzir a necessidade de lançamentos desconectados. A solução atende parte das dificuldades relatadas e estabelece uma base organizada para aumentar o volume de pedidos. Não substitui todas as planilhas financeiras nem calcula a margem completa de cada encomenda.

O acompanhamento manual de filamentos é apoiado por saldos em gramas, entradas, ajustes e consumos associados às ordens. A identificação separada por marca, material e cor evita confundir matérias-primas. Até quatro cores podem participar da fabricação, cada uma com consumo real e custo de material próprios. O histórico facilita a conferência das alterações de estoque.

A utilização de máquinas iguais é organizada pelo código de cada unidade. A disponibilidade deriva da produção ativa e impede iniciar outra ordem na mesma impressora. As validações transacionais e as restrições do banco protegem contra saldo negativo, repetição da conclusão e duplicação da entrada de peças no estoque.

A venda registra produto, quantidade, canal e preço unitário; reduz o estoque e calcula o faturamento bruto. Esse valor não representa lucro ou confirmação de recebimento. O custo registrado na produção abrange filamento, sem incluir energia, tempo de máquina, embalagem, taxas, despesas ou pagamentos. A apuração completa de custos e lucratividade permanece como objetivo de evolução da empresa.

A exportação geral disponibiliza CSVs separados em um ZIP para conferência e análise externa. Esperam-se maior clareza dos saldos, rastreabilidade do consumo, organização das máquinas e visibilidade das vendas. O funcionamento é demonstrado por roteiro e testes automatizados; não se afirma redução de custos ou aumento de lucro sem medição posterior.

Os dados empresariais desta caracterização foram fornecidos pelo proprietário em 23/11/2026. Permanecem sem levantamento o perfil demográfico dos clientes e a confirmação de filiais. O sistema utiliza a marca oficial AVS Labs 3D e foi delimitado para atender à operação local descrita, mantendo possibilidades de evolução separadas das funções implementadas.
