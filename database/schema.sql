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
COMMIT;
