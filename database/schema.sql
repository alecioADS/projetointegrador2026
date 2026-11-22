-- AVS Labs 3D: estrutura PostgreSQL e atualizações compatíveis.
-- Não executa limpeza nem população de dados; regras de transição/multicor também dependem da API.
BEGIN;
CREATE TABLE IF NOT EXISTS materials (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 brand varchar(120) NOT NULL CHECK (length(trim(brand)) > 0),
 family varchar(40) NOT NULL, color varchar(60) NOT NULL,
 stock_g numeric(12,2) NOT NULL DEFAULT 0 CHECK (stock_g >= 0),
 cost_per_kg numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_per_kg >= 0)
);
CREATE TABLE IF NOT EXISTS printers (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code varchar(120) NOT NULL CHECK (length(trim(code)) > 0),
 brand varchar(120) NOT NULL CHECK (length(trim(brand)) > 0),
 model varchar(120) NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','manutencao'))
);
CREATE TABLE IF NOT EXISTS products (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
 sku varchar(60) NOT NULL UNIQUE,
 stock_units integer NOT NULL DEFAULT 0 CHECK (stock_units >= 0)
);
CREATE TABLE IF NOT EXISTS production_orders (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 product_id integer NOT NULL REFERENCES products(id),
 printer_id integer NOT NULL REFERENCES printers(id),
 material_id integer NOT NULL REFERENCES materials(id),
 quantity integer NOT NULL CHECK (quantity > 0),
 planned_g numeric(12,2) NOT NULL CHECK (planned_g > 0),
 actual_g numeric(12,2), approved_quantity integer,
 material_cost numeric(12,2),
 status varchar(20) NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','em_producao','concluida','cancelada')),
 created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 CHECK (status <> 'concluida' OR (actual_g IS NOT NULL AND actual_g > 0 AND approved_quantity IS NOT NULL AND approved_quantity BETWEEN 0 AND quantity AND material_cost IS NOT NULL AND finished_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_running_order_per_printer ON production_orders(printer_id) WHERE status = 'em_producao';
CREATE TABLE IF NOT EXISTS stock_movements (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 material_id integer REFERENCES materials(id), product_id integer REFERENCES products(id),
 order_id integer REFERENCES production_orders(id),
 quantity numeric(12,2) NOT NULL CHECK (quantity <> 0), reason varchar(200) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((material_id IS NOT NULL)::integer + (product_id IS NOT NULL)::integer = 1)
);
CREATE INDEX IF NOT EXISTS stock_movements_created ON stock_movements(created_at DESC);
-- Atualização compatível com a primeira versão, preservando IDs e vínculos.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='printers' AND column_name='name') THEN
  ALTER TABLE printers RENAME COLUMN name TO code;
 END IF;
END $$;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS brand varchar(120) NOT NULL DEFAULT 'Não informada';
-- Nomes antigos repetidos recebem o ID para manter a identificação única.
UPDATE printers SET code=left(code,100)||' #'||id WHERE lower(trim(code)) IN
 (SELECT lower(trim(code)) FROM printers GROUP BY lower(trim(code)) HAVING count(*)>1);
CREATE UNIQUE INDEX IF NOT EXISTS printers_code_unique ON printers(lower(trim(code)));
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='materials' AND column_name='name') THEN
  ALTER TABLE materials RENAME COLUMN name TO brand;
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS production_order_materials (
 order_id integer NOT NULL REFERENCES production_orders(id),
 slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 4),
 material_id integer NOT NULL REFERENCES materials(id),
 planned_g numeric(12,2) NOT NULL CHECK (planned_g > 0),
 actual_g numeric(12,2) CHECK (actual_g >= 0),
 material_cost numeric(12,2) CHECK (material_cost >= 0),
 PRIMARY KEY(order_id,slot), UNIQUE(order_id,material_id)
);
-- Ordens existentes passam a ter um filamento, preservando o histórico.
INSERT INTO production_order_materials(order_id,slot,material_id,planned_g,actual_g,material_cost)
 SELECT id,1,material_id,planned_g,actual_g,material_cost FROM production_orders o
 WHERE NOT EXISTS (SELECT 1 FROM production_order_materials om WHERE om.order_id=o.id);
CREATE TABLE IF NOT EXISTS sales (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL UNIQUE,
 product_id integer NOT NULL REFERENCES products(id),
 quantity integer NOT NULL CHECK (quantity>0),
 channel varchar(20) NOT NULL CHECK (channel IN ('marketplace','varejo')),
 unit_price numeric(12,2) NOT NULL CHECK (unit_price>0),
 total_amount numeric(18,2) GENERATED ALWAYS AS (quantity*unit_price) STORED,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS sale_id integer REFERENCES sales(id);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON sales(created_at DESC);

-- Descrições disponíveis também no catálogo do pgAdmin/DBeaver.
COMMENT ON TABLE public.materials IS 'Filamentos com saldo em gramas.';
COMMENT ON COLUMN public.materials.id IS 'Identificador interno do filamento.';
COMMENT ON COLUMN public.materials.brand IS 'Marca informada no cadastro.';
COMMENT ON COLUMN public.materials.family IS 'Material/tipo: PLA, PETG, TPU etc.; não é enum fechado.';
COMMENT ON COLUMN public.materials.color IS 'Cor descritiva do filamento.';
COMMENT ON COLUMN public.materials.stock_g IS 'Saldo persistido em gramas, nunca negativo.';
COMMENT ON COLUMN public.materials.cost_per_kg IS 'Custo por kg vigente no cadastro, não negativo.';
COMMENT ON TABLE public.printers IS 'Unidades físicas; disponibilidade é derivada da produção.';
COMMENT ON COLUMN public.printers.id IS 'Identificador interno da máquina.';
COMMENT ON COLUMN public.printers.code IS 'Código da unidade; índice único sobre lower(trim(code)).';
COMMENT ON COLUMN public.printers.brand IS 'Marca da impressora; legado pode conter Não informada.';
COMMENT ON COLUMN public.printers.model IS 'Modelo da impressora.';
COMMENT ON COLUMN public.printers.status IS 'Disponivel ou manutencao na grafia técnica minúscula definida no CHECK.';
COMMENT ON TABLE public.products IS 'Estoque de produtos em unidades.';
COMMENT ON COLUMN public.products.id IS 'Identificador interno do produto.';
COMMENT ON COLUMN public.products.name IS 'Nome do produto.';
COMMENT ON COLUMN public.products.sku IS 'Código comercial do produto, único com comparação padrão do banco.';
COMMENT ON COLUMN public.products.stock_units IS 'Estoque em unidades inteiras, não negativo.';
COMMENT ON TABLE public.production_orders IS 'Cabeçalho da produção; material_id é referência legada ao primeiro item.';
COMMENT ON COLUMN public.production_orders.id IS 'Identificador da ordem.';
COMMENT ON COLUMN public.production_orders.product_id IS 'Produto gerado pela ordem.';
COMMENT ON COLUMN public.production_orders.printer_id IS 'Unidade de impressora escolhida.';
COMMENT ON COLUMN public.production_orders.material_id IS 'Referência legada ao primeiro filamento; não substitui a coleção de itens.';
COMMENT ON COLUMN public.production_orders.quantity IS 'Quantidade planejada de peças, maior que zero.';
COMMENT ON COLUMN public.production_orders.planned_g IS 'Soma do consumo estimado dos itens.';
COMMENT ON COLUMN public.production_orders.actual_g IS 'Soma do consumo real; preenchida na conclusão.';
COMMENT ON COLUMN public.production_orders.approved_quantity IS 'Peças aprovadas, entre zero e quantity quando concluída.';
COMMENT ON COLUMN public.production_orders.material_cost IS 'Soma dos custos dos itens; snapshot da conclusão.';
COMMENT ON COLUMN public.production_orders.status IS 'planejada, em_producao, concluida ou cancelada.';
COMMENT ON COLUMN public.production_orders.created_at IS 'Instante de criação definido no servidor de banco.';
COMMENT ON COLUMN public.production_orders.finished_at IS 'Instante da conclusão ou do cancelamento.';
COMMENT ON TABLE public.production_order_materials IS 'Itens de cor; mínimo de um validado pela API e slots 1 a 4 limitados no banco.';
COMMENT ON COLUMN public.production_order_materials.order_id IS 'Ordem proprietária do item.';
COMMENT ON COLUMN public.production_order_materials.slot IS 'Posição 1, 2, 3 ou 4.';
COMMENT ON COLUMN public.production_order_materials.material_id IS 'Cadastro de filamento; combinação order_id/material_id é única.';
COMMENT ON COLUMN public.production_order_materials.planned_g IS 'Consumo estimado positivo deste filamento.';
COMMENT ON COLUMN public.production_order_materials.actual_g IS 'Consumo real não negativo; zero se a cor não foi usada.';
COMMENT ON COLUMN public.production_order_materials.material_cost IS 'Custo calculado e arredondado por item na conclusão.';
COMMENT ON TABLE public.stock_movements IS 'Histórico assinado com exatamente um alvo por linha.';
COMMENT ON COLUMN public.stock_movements.id IS 'Identificador do lançamento.';
COMMENT ON COLUMN public.stock_movements.material_id IS 'Alvo filamento; obrigatório quando product_id for nulo.';
COMMENT ON COLUMN public.stock_movements.product_id IS 'Alvo produto; obrigatório quando material_id for nulo.';
COMMENT ON COLUMN public.stock_movements.order_id IS 'Ordem que originou consumo/produção.';
COMMENT ON COLUMN public.stock_movements.sale_id IS 'Venda que originou a saída de produto.';
COMMENT ON COLUMN public.stock_movements.quantity IS 'Quantidade com sinal e diferente de zero: g para filamento ou un. para produto.';
COMMENT ON COLUMN public.stock_movements.reason IS 'Descrição da origem: saldo inicial, ajuste, entrada, produção ou venda.';
COMMENT ON COLUMN public.stock_movements.created_at IS 'Instante do lançamento definido no banco.';
COMMENT ON TABLE public.sales IS 'Venda com bruto gerado e UUID único de operação.';
COMMENT ON COLUMN public.sales.id IS 'Identificador da venda.';
COMMENT ON COLUMN public.sales.request_id IS 'Identifica a tentativa de registro para proteção contra reenvio.';
COMMENT ON COLUMN public.sales.product_id IS 'Produto vendido.';
COMMENT ON COLUMN public.sales.quantity IS 'Unidades vendidas, maior que zero.';
COMMENT ON COLUMN public.sales.channel IS 'marketplace ou varejo.';
COMMENT ON COLUMN public.sales.unit_price IS 'Preço unitário positivo.';
COMMENT ON COLUMN public.sales.total_amount IS 'Resultado de quantity * unit_price calculado pelo banco.';
COMMENT ON COLUMN public.sales.created_at IS 'Instante de registro da venda.';
COMMIT;
