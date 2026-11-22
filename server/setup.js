// Aplicar DDL e atualizações compatíveis; não popular nem limpar dados.
// A transação está no próprio schema SQL.
import { readFile } from "node:fs/promises";
import { pool } from "./db.js";
try {
  await pool.query(
    await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"),
  );
  console.log("Estrutura do banco criada. Nenhum dado existente foi apagado.");
} finally {
  await pool.end();
}
