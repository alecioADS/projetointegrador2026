import { app } from "./app.js";
import { pool } from "./db.js";
const port = Number(process.env.PORT || 3001);
await pool.query("SELECT 1");
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`AVS Labs 3D: http://127.0.0.1:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
