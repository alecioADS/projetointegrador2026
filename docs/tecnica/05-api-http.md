# Referência da API HTTP

## Convenções

A URL local padrão é `http://127.0.0.1:3001`. Entradas JSON usam `Content-Type: application/json`. O parser limita o corpo a 32 KB. Objetos são validados de forma estrita: propriedades extras não fazem parte do contrato. Exemplos abaixo são didáticos; IDs precisam existir na base usada.

Valores decimais de entrada são números JSON com ponto, por exemplo 12.35. Campos numeric retornados pelo PostgreSQL podem ser strings, como "12.35". IDs em parâmetros são convertidos para inteiro positivo e limitados ao intervalo de integer do PostgreSQL. Textos recebem trim e precisam ser não vazios. O frontend normalmente formata valores para pt-BR.

Respostas de erro possuem a forma `{"error":"mensagem"}`. Código 400 indica dados inválidos; 404 indica recurso ou rota inexistente; 409 indica conflito de saldo, estado, unicidade ou vínculo; 500 indica falha não mapeada. A API não possui autenticação e não deve ser tratada como serviço público.

Os exemplos de resposta mostram campos relevantes, não necessariamente todos os campos retornados. Consulte o dicionário de dados para o registro completo.


## GET /api/health

Verifica a conexão com SELECT 1. Não contém versão ou dados de cadastro.

### Resposta ilustrativa

```json
{
  "ok": true
}
```


## GET /api/dashboard

Contagens de cadastros e ordens planejadas/em produção. Não inclui totais financeiros.

### Resposta ilustrativa

```json
{
  "materials": 2,
  "printers": 1,
  "products": 1,
  "open_orders": 1
}
```


## GET /api/materials

Lista completa, em ID decrescente. Sem paginação ou filtros de query string. Filamentos incluem stock_g; produtos stock_units; impressoras availability derivada.

### Resposta ilustrativa

```json
[
  {
    "id": 1,
    "brand": "Marca Exemplo",
    "family": "PLA",
    "color": "Azul",
    "cost_per_kg": 100
  }
]
```


## POST /api/materials

201 na criação. Filamentos aceitam initial_stock_g opcional, padrão zero; saldo positivo cria movimento. Demais cadastros têm apenas os campos mostrados.

### Requisição

```json
{
  "brand": "Marca Exemplo",
  "family": "PLA",
  "color": "Azul",
  "cost_per_kg": 100,
  "initial_stock_g": 1000
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "brand": "Marca Exemplo",
  "family": "PLA",
  "color": "Azul",
  "cost_per_kg": 100
}
```


## PUT /api/materials/:id

200 na edição. PUT de filamento exige os dados cadastrais; ajuste de saldo é opcional, mas exige expected_stock_g quando stock_g está presente. Produto não aceita stock_units neste contrato.

### Requisição

```json
{
  "brand": "Marca Exemplo",
  "family": "PLA",
  "color": "Azul",
  "cost_per_kg": 100,
  "stock_g": 800,
  "expected_stock_g": 1000
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "brand": "Marca Exemplo",
  "family": "PLA",
  "color": "Azul",
  "cost_per_kg": 100
}
```


## DELETE /api/materials/:id

204, sem corpo. 404 para ID ausente e 409 quando houver vínculos. Não é remoção lógica: o registro elegível é apagado.


## GET /api/printers

Lista completa, em ID decrescente. Sem paginação ou filtros de query string. Filamentos incluem stock_g; produtos stock_units; impressoras availability derivada.

### Resposta ilustrativa

```json
[
  {
    "id": 1,
    "code": "Impressora 01",
    "brand": "Bambu Lab",
    "model": "A1",
    "status": "disponivel"
  }
]
```


## POST /api/printers

201 na criação. Filamentos aceitam initial_stock_g opcional, padrão zero; saldo positivo cria movimento. Demais cadastros têm apenas os campos mostrados.

### Requisição

```json
{
  "code": "Impressora 01",
  "brand": "Bambu Lab",
  "model": "A1",
  "status": "disponivel"
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "code": "Impressora 01",
  "brand": "Bambu Lab",
  "model": "A1",
  "status": "disponivel"
}
```


## PUT /api/printers/:id

200 na edição. PUT de filamento exige os dados cadastrais; ajuste de saldo é opcional, mas exige expected_stock_g quando stock_g está presente. Produto não aceita stock_units neste contrato.

### Requisição

```json
{
  "code": "Impressora 01",
  "brand": "Bambu Lab",
  "model": "A1",
  "status": "disponivel"
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "code": "Impressora 01",
  "brand": "Bambu Lab",
  "model": "A1",
  "status": "disponivel"
}
```


## DELETE /api/printers/:id

204, sem corpo. 404 para ID ausente e 409 quando houver vínculos. Não é remoção lógica: o registro elegível é apagado.


## GET /api/products

Lista completa, em ID decrescente. Sem paginação ou filtros de query string. Filamentos incluem stock_g; produtos stock_units; impressoras availability derivada.

### Resposta ilustrativa

```json
[
  {
    "id": 1,
    "name": "Suporte",
    "sku": "SUP-001"
  }
]
```


## POST /api/products

201 na criação. Filamentos aceitam initial_stock_g opcional, padrão zero; saldo positivo cria movimento. Demais cadastros têm apenas os campos mostrados.

### Requisição

```json
{
  "name": "Suporte",
  "sku": "SUP-001"
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "name": "Suporte",
  "sku": "SUP-001"
}
```


## PUT /api/products/:id

200 na edição. PUT de filamento exige os dados cadastrais; ajuste de saldo é opcional, mas exige expected_stock_g quando stock_g está presente. Produto não aceita stock_units neste contrato.

### Requisição

```json
{
  "name": "Suporte",
  "sku": "SUP-001"
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "name": "Suporte",
  "sku": "SUP-001"
}
```


## DELETE /api/products/:id

204, sem corpo. 404 para ID ausente e 409 quando houver vínculos. Não é remoção lógica: o registro elegível é apagado.


## POST /api/stock-entry

201. quantity em gramas, positiva, até 10.000.000 e duas casas; motivo de até 200 caracteres.

### Requisição

```json
{
  "material_id": 1,
  "quantity": 500,
  "reason": "Reposição de filamento"
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "material_id": 1,
  "quantity": "500.00",
  "reason": "Reposição de filamento"
}
```


## GET /api/movements

Lista completa com descrição do alvo. Gramas para filamento e unidades para produto; sinais indicam entrada/saída.

### Resposta ilustrativa

```json
[
  {
    "id": 1,
    "material_id": 1,
    "product_id": null,
    "order_id": null,
    "sale_id": null,
    "quantity": "500.00",
    "reason": "Reposição de filamento",
    "item": "Marca Exemplo · PLA · Azul",
    "created_at": "2026-11-22T12:00:00.000Z"
  }
]
```


## GET /api/orders

Também retorna nomes do produto e da impressora, marca/modelo e totais. material_id no cabeçalho é legado; use materials[] para as cores.

### Resposta ilustrativa

```json
[
  {
    "id": 1,
    "product_id": 1,
    "printer_id": 1,
    "material_id": 1,
    "quantity": 10,
    "status": "planejada",
    "planned_g": "200.00",
    "materials": [
      {
        "order_id": 1,
        "slot": 1,
        "material_id": 1,
        "brand": "Marca Exemplo",
        "family": "PLA",
        "color": "Azul",
        "planned_g": "200.00",
        "actual_g": null,
        "material_cost": null
      }
    ]
  }
]
```


## POST /api/orders

201. De 1 a 4 IDs distintos; quantidade de peças inteira positiva até 1.000.000. Cada planned_g é positivo até 10.000.000 com duas casas. A resposta de criação é o cabeçalho; GET retorna os itens.

### Requisição

```json
{
  "product_id": 1,
  "printer_id": 1,
  "quantity": 10,
  "materials": [
    {
      "material_id": 1,
      "planned_g": 100
    },
    {
      "material_id": 2,
      "planned_g": 100
    }
  ]
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "status": "planejada",
  "quantity": 10,
  "planned_g": "200.00"
}
```


## POST /api/orders/:id/start

200. Estado planejada e impressora livre; 409 em transição inválida. O corpo pode estar ausente.

### Resposta ilustrativa

```json
{
  "id": 1,
  "status": "em_producao"
}
```


## POST /api/orders/:id/finish

200. Mesmo conjunto de filamentos da ordem; cada consumo não negativo; ao menos um positivo. Aprovadas entre zero e quantity. Cada linha recebe snapshot de custo.

### Requisição

```json
{
  "approved_quantity": 8,
  "materials": [
    {
      "material_id": 1,
      "actual_g": 110
    },
    {
      "material_id": 2,
      "actual_g": 90
    }
  ]
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "status": "concluida",
  "actual_g": "200.00",
  "approved_quantity": 8,
  "material_cost": "20.00"
}
```


## POST /api/orders/:id/cancel

200. Permitido somente em planejada. finished_at recebe o instante de cancelamento.

### Resposta ilustrativa

```json
{
  "id": 1,
  "status": "cancelada"
}
```


## DELETE /api/orders/:id

204. Exige cancelada sem movimento; remove os itens e o cabeçalho em uma transação.


## GET /api/sales

Lista completa, ID decrescente; inclui request_id e created_at nos registros reais.

### Resposta ilustrativa

```json
[
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Suporte",
    "sku": "SUP-001",
    "quantity": 2,
    "channel": "marketplace",
    "unit_price": "25.00",
    "total_amount": "50.00"
  }
]
```


## POST /api/sales

201 em venda nova; 200 em reenvio idêntico. Canais: marketplace ou varejo. Preço >0, até 10.000.000 e duas casas. Quantidade inteira entre 1 e 1.000.000.

### Requisição

```json
{
  "request_id": "11111111-1111-4111-8111-111111111111",
  "product_id": 1,
  "quantity": 2,
  "channel": "marketplace",
  "unit_price": 25
}
```

### Resposta ilustrativa

```json
{
  "id": 1,
  "quantity": 2,
  "unit_price": "25.00",
  "total_amount": "50.00",
  "channel": "marketplace"
}
```


## GET /api/reports/export

200 com Content-Disposition attachment e Cache-Control no-store. Contém oito CSVs e LEIA-ME. Não usa os filtros da interface; datas dos CSVs em UTC.


## Compatibilidade de ordens com um filamento

Para clientes anteriores, POST /api/orders ainda aceita material_id e planned_g diretamente no lugar de materials[]. A API normaliza para um item. A conclusão antiga com actual_g e approved_quantity é aceita apenas quando a ordem tem exatamente um item. Para ordens multicor é obrigatório enviar a coleção completa. A interface atual usa sempre a coleção.

## Exemplo de consulta por terminal

```sh
curl --fail http://127.0.0.1:3001/api/health
curl --fail http://127.0.0.1:3001/api/products
curl --fail http://127.0.0.1:3001/api/reports/export -o relatorios.zip
```

Não há endpoint de zerar banco, listar usuários, autenticar, cancelar venda, excluir movimento, importar CSV ou atualizar saldo de produto manualmente. A limpeza administrativa feita em testes de desenvolvimento não é uma função da interface.
