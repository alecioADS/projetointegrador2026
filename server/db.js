/** Pool do backend: DATABASE_URL não é entregue ao navegador. */
import "dotenv/config";
import pg from "pg";
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
/**
 * Usa uma única conexão: confirma o callback inteiro ou reverte todas as alterações.
 * O callback recebe um client pg e não deve abrir transações aninhadas.
 * finally libera o recurso mesmo se validação, SQL ou commit lançarem erro.
 */
export async function transaction(fn) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
