BEGIN;
CREATE TABLE IF NOT EXISTS materials (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
 family varchar(40) NOT NULL, color varchar(60) NOT NULL,
 stock_g numeric(12,2) NOT NULL DEFAULT 0 CHECK (stock_g >= 0),
 cost_per_kg numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_per_kg >= 0)
);
CREATE TABLE IF NOT EXISTS printers (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
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
COMMIT;
