import express from "express";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  pool as defaultPool,
  transaction as defaultTransaction,
} from "./db.js";
export function createApp({
  pool = defaultPool,
  transaction = defaultTransaction,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  const fail = (message, status = 409) => {
    throw Object.assign(new Error(message), { status });
  };
  const text = (max) => z.string().trim().min(1).max(max);
  const positive = z.number().positive().max(10000000).multipleOf(0.01);
  const schemas = {
    materials: z
      .object({
        name: text(120),
        family: text(40),
        color: text(60),
        cost_per_kg: z.number().min(0).max(10000000).multipleOf(0.01),
      })
      .strict(),
    printers: z
      .object({
        code: text(120),
        brand: text(120),
        model: text(120),
        status: z.enum(["disponivel", "manutencao"]),
      })
      .strict(),
    products: z.object({ name: text(120), sku: text(60) }).strict(),
  };
  function id(value) {
    return z.coerce.number().int().positive().max(2147483647).parse(value);
  }
  async function row(c, table, key) {
    const { rows } = await c.query(
      `SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,
      [key],
    );
    if (!rows[0]) fail("Registro não encontrado.", 404);
    return rows[0];
  }
  app.get("/api/health", async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  });
  app.get("/api/dashboard", async (req, res) => {
    const { rows } = await pool.query(
      `SELECT (SELECT count(*)::int FROM materials) materials, (SELECT count(*)::int FROM printers) printers, (SELECT count(*)::int FROM products) products, (SELECT count(*)::int FROM production_orders WHERE status IN ('planejada','em_producao')) open_orders`,
    );
    res.json(rows[0]);
  });
  for (const [table, schema] of Object.entries(schemas)) {
    app.get(`/api/${table}`, async (req, res) => {
      res.json(
        (
          await pool.query(
            table === "printers"
              ? `SELECT p.*, CASE WHEN p.status='manutencao' THEN 'manutencao' WHEN EXISTS (SELECT 1 FROM production_orders o WHERE o.printer_id=p.id AND o.status='em_producao') THEN 'ocupada' ELSE 'livre' END AS availability FROM printers p ORDER BY p.id DESC`
              : `SELECT * FROM ${table} ORDER BY id DESC`,
          )
        ).rows,
      );
    });
    app.post(`/api/${table}`, async (req, res) => {
      const data = schema.parse(req.body),
        cols = Object.keys(data);
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING *`,
        Object.values(data),
      );
      res.status(201).json(rows[0]);
    });
    app.put(`/api/${table}/:id`, async (req, res) => {
      const key = id(req.params.id),
        data = schema.parse(req.body);
      res.json(
        await transaction(async (c) => {
          await row(c, table, key);
          if (
            table === "printers" &&
            data.status === "manutencao" &&
            (
              await c.query(
                "SELECT 1 FROM production_orders WHERE printer_id=$1 AND status='em_producao'",
                [key],
              )
            ).rowCount
          )
            fail(
              "Conclua a produção antes de colocar a impressora em manutenção.",
            );
          const cols = Object.keys(data);
          return (
            await c.query(
              `UPDATE ${table} SET ${cols.map((k, i) => k + "=$" + (i + 1)).join(",")} WHERE id=$${cols.length + 1} RETURNING *`,
              [...Object.values(data), key],
            )
          ).rows[0];
        }),
      );
    });
    app.delete(`/api/${table}/:id`, async (req, res) => {
      const result = await pool.query(`DELETE FROM ${table} WHERE id=$1`, [
        id(req.params.id),
      ]);
      if (!result.rowCount) fail("Registro não encontrado.", 404);
      res.status(204).end();
    });
  }
  app.get("/api/movements", async (req, res) => {
    res.json(
      (
        await pool.query(
          `SELECT m.*,coalesce(a.name,p.name) item FROM stock_movements m LEFT JOIN materials a ON a.id=m.material_id LEFT JOIN products p ON p.id=m.product_id ORDER BY m.id DESC`,
        )
      ).rows,
    );
  });
  app.post("/api/stock-entry", async (req, res) => {
    const data = z
      .object({
        material_id: z.number().int().positive(),
        quantity: positive,
        reason: text(200),
      })
      .strict()
      .parse(req.body);
    res.status(201).json(
      await transaction(async (c) => {
        await row(c, "materials", data.material_id);
        await c.query("UPDATE materials SET stock_g=stock_g+$1 WHERE id=$2", [
          data.quantity,
          data.material_id,
        ]);
        return (
          await c.query(
            "INSERT INTO stock_movements(material_id,quantity,reason) VALUES ($1,$2,$3) RETURNING *",
            [data.material_id, data.quantity, data.reason],
          )
        ).rows[0];
      }),
    );
  });
  app.get("/api/orders", async (req, res) => {
    res.json(
      (
        await pool.query(
          `SELECT o.*,p.name product_name,m.name material_name,r.code printer_name,r.brand printer_brand,r.model printer_model FROM production_orders o JOIN products p ON p.id=o.product_id JOIN materials m ON m.id=o.material_id JOIN printers r ON r.id=o.printer_id ORDER BY o.id DESC`,
        )
      ).rows,
    );
  });
  app.post("/api/orders", async (req, res) => {
    const data = z
      .object({
        product_id: z.number().int().positive(),
        printer_id: z.number().int().positive(),
        material_id: z.number().int().positive(),
        quantity: z.number().int().positive().max(1000000),
        planned_g: positive,
      })
      .strict()
      .parse(req.body);
    const order = await transaction(async (c) => {
      const printer = await row(c, "printers", data.printer_id);
      if (printer.status !== "disponivel")
        fail("A impressora está em manutenção.");
      if (
        (
          await c.query(
            "SELECT 1 FROM production_orders WHERE printer_id=$1 AND status='em_producao'",
            [printer.id],
          )
        ).rowCount
      )
        fail(
          "A impressora está ocupada. Aguarde a conclusão da produção atual.",
        );
      return (
        await c.query(
          "INSERT INTO production_orders(product_id,printer_id,material_id,quantity,planned_g) VALUES ($1,$2,$3,$4,$5) RETURNING *",
          [
            data.product_id,
            data.printer_id,
            data.material_id,
            data.quantity,
            data.planned_g,
          ],
        )
      ).rows[0];
    });
    res.status(201).json(order);
  });
  app.post("/api/orders/:id/:action", async (req, res) => {
    const key = id(req.params.id),
      action = z.enum(["start", "finish", "cancel"]).parse(req.params.action);
    const completion =
      action === "finish"
        ? z
            .object({
              actual_g: positive,
              approved_quantity: z.number().int().min(0).max(1000000),
            })
            .strict()
            .parse(req.body)
        : null;
    res.json(
      await transaction(async (c) => {
        const order = await row(c, "production_orders", key);
        if (action === "start") {
          if (order.status !== "planejada")
            fail("Somente ordens planejadas podem iniciar.");
          const printer = await row(c, "printers", order.printer_id);
          if (printer.status !== "disponivel")
            fail("A impressora está em manutenção.");
          if (
            (
              await c.query(
                "SELECT 1 FROM production_orders WHERE printer_id=$1 AND status='em_producao'",
                [printer.id],
              )
            ).rowCount
          )
            fail("A impressora já está produzindo outra ordem.");
          await c.query(
            "UPDATE production_orders SET status='em_producao' WHERE id=$1",
            [key],
          );
        } else if (action === "cancel") {
          if (order.status !== "planejada")
            fail(
              "Somente ordens planejadas podem ser canceladas. Produção iniciada deve registrar o consumo, mesmo com zero peças aprovadas.",
            );
          await c.query(
            "UPDATE production_orders SET status='cancelada',finished_at=now() WHERE id=$1",
            [key],
          );
        } else {
          if (order.status !== "em_producao")
            fail("Somente ordens em produção podem ser concluídas.");
          if (completion.approved_quantity > order.quantity)
            fail("Quantidade aprovada maior que a planejada.", 400);
          const material = await row(c, "materials", order.material_id);
          if (Number(material.stock_g) < completion.actual_g)
            fail("Estoque de material insuficiente.");
          await c.query("UPDATE materials SET stock_g=stock_g-$1 WHERE id=$2", [
            completion.actual_g,
            material.id,
          ]);
          await c.query(
            "UPDATE products SET stock_units=stock_units+$1 WHERE id=$2",
            [completion.approved_quantity, order.product_id],
          );
          await c.query(
            "INSERT INTO stock_movements(material_id,order_id,quantity,reason) VALUES ($1,$2,$3,'Consumo de produção')",
            [material.id, key, -completion.actual_g],
          );
          if (completion.approved_quantity > 0)
            await c.query(
              "INSERT INTO stock_movements(product_id,order_id,quantity,reason) VALUES ($1,$2,$3,'Produção concluída')",
              [order.product_id, key, completion.approved_quantity],
            );
          await c.query(
            "UPDATE production_orders SET status='concluida',actual_g=$1,approved_quantity=$2,material_cost=round($1::numeric * $3::numeric / 1000,2),finished_at=now() WHERE id=$4",
            [
              completion.actual_g,
              completion.approved_quantity,
              material.cost_per_kg,
              key,
            ],
          );
        }
        return (
          await c.query("SELECT * FROM production_orders WHERE id=$1", [key])
        ).rows[0];
      }),
    );
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "Rota não encontrada." }),
  );
  const dist = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) => res.sendFile(resolve(dist, "index.html")));
  app.use((err, req, res, next) => {
    if (err instanceof z.ZodError)
      return res.status(400).json({
        error: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    if (err.code === "23503")
      return res.status(409).json({
        error:
          "Registro vinculado a outros dados ou referência inexistente. Preserve o histórico.",
      });
    if (err.code === "23505")
      return res.status(409).json({
        error:
          "Código de impressora ou SKU duplicado, ou impressora já ocupada.",
      });
    if (err.type === "entity.parse.failed")
      return res.status(400).json({ error: "JSON inválido." });
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({
      error: "Falha interna. Verifique o servidor e a conexão com PostgreSQL.",
    });
  });

  return app;
}
export const app = createApp();
