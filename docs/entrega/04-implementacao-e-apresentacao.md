# Implementação e roteiro de apresentação

## Resultado implementado

O aplicativo entregue é web responsivo, com interface React, API Node.js/Express e PostgreSQL local. O nome e a identidade visual permanecem AVS Labs 3D. A interface tem fundo claro e não exibe identificação de versão acadêmica. Esta documentação identifica o contexto da disciplina separadamente.

O escopo permite demonstrar cadastro, consulta, edição e exclusão protegida, relacionamento entre entidades, regras de estoque, transações, produção multicor, disponibilidade de impressora, vendas e exportação. O sistema não possui módulo financeiro completo; apenas faturamento bruto das vendas registradas.

## Preparação antes da aula

- No mesmo Mac usado no desenvolvimento, manter a pasta do projeto no caminho utilizado pelo iniciador.
- Testar o ícone AVS Labs 3D ou o arquivo Abrir AVS Labs 3D.command com antecedência.
- Confirmar Node.js, dependências, Docker Desktop e imagem postgres:18 instalados; fazer essa preparação com internet antes da apresentação.
- Confirmar conexão ao banco e acesso a http://127.0.0.1:3001.
- Fazer backup dos dados que precisar preservar. Não zerar a base real apenas para uma demonstração sem decidir isso explicitamente.
- Levar a documentação em PDF, as fontes UML e o SQL; o repositório contém a versão do código correspondente.

## Roteiro principal com valores verificáveis

1. Apresentar o problema: diferenciar matéria-prima por marca/material/cor e máquinas por código, mantendo coerência entre produção, estoque e venda.
2. Cadastrar um filamento de demonstração com marca Exemplo, material PLA, cor Azul, custo R$ 100/kg e saldo inicial de 1000 g.
3. Mostrar a entrada inicial no histórico. Se necessário, demonstrar uma correção de saldo e sua movimentação de diferença; depois retornar ao saldo esperado usando outro ajuste registrado.
4. Cadastrar Impressora 01, marca Bambu Lab e modelo A1, disponível. Se usar outra máquina real, manter os dados reais do cadastro.
5. Cadastrar Suporte, SKU SUP-DEMO. O estoque do produto começa em zero.
6. Planejar 10 peças, escolhendo modelo e unidade da impressora, um filamento e estimativa de 200 g.
7. Iniciar e mostrar a máquina como Ocupada. Uma nova seleção não permite usar aquela máquina enquanto executa.
8. Concluir informando consumo real 200 g e 8 peças aprovadas.
9. Conferir filamento em 800 g, produto em 8 unidades e custo do material da ordem de R$ 20. Mostrar a máquina Livre.
10. Registrar venda de 2 unidades a R$ 25, canal Marketplace.
11. Conferir produto em 6 unidades e faturamento bruto de R$ 50 para essa venda. Outros registros da base também compõem os acumulados.
12. Exportar relatórios e abrir o ZIP. Mostrar CSVs de produção, consumo, movimentações e vendas relacionados pelos IDs.

## Variação para quatro cores

Cadastrar quatro filamentos com cores diferentes e saldo suficiente. Em Nova ordem, usar Adicionar filamento até quatro linhas. Selecionar separadamente marca, material e cor em cada linha e informar a estimativa. Na conclusão, preencher o consumo real de todas as linhas. Uma cor não usada pode receber zero, desde que a soma dos consumos seja positiva.

Se faltar estoque em uma cor, a conclusão deve falhar sem baixar parcialmente as outras. Para não comprometer os dados da apresentação, demonstrar o erro em uma ordem preparada para esse teste e depois corrigir os valores ou o estoque por uma entrada registrada.

## Demonstração de CRUD e proteções

- Cadastro: criar um filamento ou produto temporário.
- Consulta: buscar por marca, cor, código ou SKU nas seções correspondentes.
- Alteração: editar a descrição e mostrar que um ajuste de saldo gera histórico.
- Exclusão: apagar um cadastro temporário sem vínculos; tentar excluir um cadastro com histórico e mostrar o bloqueio.
- Ordem cancelada: criar planejamento, cancelar e usar Apagar com confirmação. A ação não é permitida para ordem concluída.

## Perguntas técnicas previstas

**Onde os dados ficam?** No PostgreSQL local; com Compose, em volume persistente. Fechar o navegador não apaga registros.

**Por que há uma API?** Para centralizar validação e transações e impedir que o navegador acesse diretamente a senha do banco.

**Como evita estoque negativo?** A API bloqueia os registros relevantes e confirma todas as alterações em uma transação; o banco também possui restrições de saldo não negativo.

**Como a impressora fica livre?** Sua disponibilidade depende da existência de uma ordem em_producao; concluir remove essa condição automaticamente.

**O faturamento é lucro?** Não. É quantidade vendida multiplicada pelo preço unitário; taxas, despesas, custos e recebimento não são deduzidos.

**Por que ZIP em vez de abas CSV?** CSV não possui abas. Cada seção é exportada como um CSV, dentro de um pacote único.

**O sistema é desktop?** É uma aplicação web local. O ícone é um iniciador macOS, e não uma implementação nativa das regras de negócio.

