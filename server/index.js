// Entrada local de produção: comprovar a conexão com o banco antes de escutar HTTP.
import { app } from "./app.js";
import { pool } from "./db.js";
const port = Number(process.env.PORT || 3001);
await pool.query("SELECT 1");
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`AVS Labs 3D: http://127.0.0.1:${port}`),
);
// Encerrar o servidor e o pool graciosamente quando o processo recebe sinal.
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
