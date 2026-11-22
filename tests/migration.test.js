import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
test("migração preserva impressoras antigas e pode ser repetida", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE materials(id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,name varchar(120) NOT NULL,family varchar(40) NOT NULL,color varchar(60) NOT NULL,stock_g numeric(12,2) NOT NULL DEFAULT 0,cost_per_kg numeric(12,2) NOT NULL DEFAULT 0);INSERT INTO materials(name,family,color,stock_g,cost_per_kg) VALUES ('Marca antiga','PLA','Azul',800,100);CREATE TABLE printers(id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,name varchar(120) NOT NULL,model varchar(120) NOT NULL,status varchar(20) NOT NULL DEFAULT 'disponivel');INSERT INTO printers(name,model) VALUES ('Bambu Lab','A1'),('Bambu Lab','P1S');`,
    );
    const schema = await readFile(
      new URL("../database/schema.sql", import.meta.url),
      "utf8",
    );
    await db.exec(schema);
    await db.exec(
      `INSERT INTO products(name,sku,stock_units) VALUES ('Produto antigo','ANTIGO',8);INSERT INTO production_orders(product_id,printer_id,material_id,quantity,planned_g,actual_g,approved_quantity,material_cost,status,finished_at) VALUES (1,1,1,10,200,200,8,20,'concluida',now());`,
    );
    await db.exec(schema);
    await db.exec(schema);
    const oldMaterial = (await db.query("SELECT * FROM materials WHERE id=1"))
      .rows[0];
    assert.equal(oldMaterial.brand, "Marca antiga");
    assert.equal(Number(oldMaterial.stock_g), 800);
    const oldLines = (
      await db.query(
        "SELECT * FROM production_order_materials WHERE order_id=1",
      )
    ).rows;
    assert.equal(oldLines.length, 1);
    assert.equal(Number(oldLines[0].actual_g), 200);
    assert.equal(Number(oldLines[0].material_cost), 20);

    const { rows } = await db.query("SELECT * FROM printers ORDER BY id");
    assert.deepEqual(
      rows.map((p) => [p.id, p.code, p.model, p.brand]),
      [
        [1, "Bambu Lab #1", "A1", "Não informada"],
        [2, "Bambu Lab #2", "P1S", "Não informada"],
      ],
    );
  } finally {
    await db.exec("ROLLBACK");
    await db.close();
  }
});
