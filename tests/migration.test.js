import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
test("migração preserva impressoras antigas e pode ser repetida", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE printers(id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,name varchar(120) NOT NULL,model varchar(120) NOT NULL,status varchar(20) NOT NULL DEFAULT 'disponivel');INSERT INTO printers(name,model) VALUES ('Bambu Lab','A1'),('Bambu Lab','P1S');`,
    );
    const schema = await readFile(
      new URL("../database/schema.sql", import.meta.url),
      "utf8",
    );
    await db.exec(schema);
    await db.exec(schema);
    const { rows } = await db.query("SELECT * FROM printers ORDER BY id");
    assert.deepEqual(
      rows.map((p) => [p.id, p.code, p.model, p.brand]),
      [
        [1, "Bambu Lab #1", "A1", "Não informada"],
        [2, "Bambu Lab #2", "P1S", "Não informada"],
      ],
    );
  } finally {
    await db.close();
  }
});
