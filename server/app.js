/**
 * API local: validação e regras transacionais ficam no servidor.
 * A fábrica aceita dependências alternativas para testes sem acessar a base do operador.
 * Identificadores SQL dinâmicos vêm de schemas fechados, nunca de texto livre do cliente.
 */
import express from "express";
import { exportReports } from "./reports.js";
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
        brand: text(120),
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
  /** Lê e bloqueia um registro; table é sempre um recurso interno conhecido. */
  async function row(c, table, key) {
    const { rows } = await c.query(
      `SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,
      [key],
    );
    if (!rows[0]) fail("Registro não encontrado.", 404);
    return rows[0];
  }
  app.get("/api/reports/export", async (req, res) => {
    const archive = await exportReports(transaction);
    res.set("Cache-Control", "no-store");
    res.attachment(
      `avs-labs-3d-relatorios-${new Date().toISOString().slice(0, 10)}.zip`,
    );
    res.type("application/zip").send(archive);
  });
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
  // Whitelist de recursos: os valores usam placeholders e as colunas vêm dos schemas estritos.
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
      const parsed = (
        table === "materials"
          ? schema.extend({
              initial_stock_g: z
                .number()
                .min(0)
                .max(10000000)
                .multipleOf(0.01)
                .default(0),
            })
          : schema
      ).parse(req.body);
      const { initial_stock_g = 0, ...data } = parsed;
      const cols = Object.keys(data);
      const record = await transaction(async (c) => {
        const created = (
          await c.query(
            `INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING *`,
            Object.values(data),
          )
        ).rows[0];
        // Cadastro e entrada inicial são atômicos; não criar movimento de quantidade zero.
        if (table === "materials" && initial_stock_g > 0) {
          await c.query("UPDATE materials SET stock_g=$1 WHERE id=$2", [
            initial_stock_g,
            created.id,
          ]);
          await c.query(
            "INSERT INTO stock_movements(material_id,quantity,reason) VALUES ($1,$2,'Saldo inicial do filamento')",
            [created.id, initial_stock_g],
          );
          return (
            await c.query("SELECT * FROM materials WHERE id=$1", [created.id])
          ).rows[0];
        }
        return created;
      });
      res.status(201).json(record);
    });
    app.put(`/api/${table}/:id`, async (req, res) => {
      const key = id(req.params.id);
      const amount = z.number().min(0).max(10000000).multipleOf(0.01);
      const parsed = (
        table === "materials"
          ? schema
              .extend({
                stock_g: amount.optional(),
                expected_stock_g: amount.optional(),
              })
              .refine(
                (data) =>
                  data.stock_g === undefined ||
                  data.expected_stock_g !== undefined,
                {
                  message: "Informe o saldo anterior para confirmar o ajuste.",
                },
              )
          : schema
      ).parse(req.body);
      const { expected_stock_g, ...data } = parsed;
      res.json(
        await transaction(async (c) => {
          const previous = await row(c, table, key);
          let difference = 0;
          // Comparação sob lock protege reposição/consumo confirmado desde a abertura do formulário.
          if (table === "materials" && data.stock_g !== undefined) {
            if (Number(previous.stock_g) !== expected_stock_g)
              fail(
                "O saldo mudou desde que você abriu a edição. Reabra o cadastro antes de ajustar.",
              );
            difference =
              (Math.round(data.stock_g * 100) -
                Math.round(Number(previous.stock_g) * 100)) /
              100;
          }
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
          const updated = (
            await c.query(
              `UPDATE ${table} SET ${cols.map((k, i) => k + "=$" + (i + 1)).join(",")} WHERE id=$${cols.length + 1} RETURNING *`,
              [...Object.values(data), key],
            )
          ).rows[0];
          if (difference !== 0)
            await c.query(
              "INSERT INTO stock_movements(material_id,quantity,reason) VALUES ($1,$2,'Ajuste de saldo na edição do filamento')",
              [key, difference],
            );
          return updated;
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
          `SELECT m.*,coalesce(a.brand||' · '||a.family||' · '||a.color,p.name) item FROM stock_movements m LEFT JOIN materials a ON a.id=m.material_id LEFT JOIN products p ON p.id=m.product_id ORDER BY m.id DESC`,
        )
      ).rows,
    );
  });
  // Reposição soma uma quantidade; ajuste na edição define o saldo total e registra a diferença.
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
  app.get("/api/sales", async (req, res) => {
    res.json(
      (
        await pool.query(
          "SELECT s.*,p.name product_name,p.sku FROM sales s JOIN products p ON p.id=s.product_id ORDER BY s.id DESC",
        )
      ).rows,
    );
  });
  app.post("/api/sales", async (req, res) => {
    const data = z
      .object({
        request_id: z.uuid(),
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive().max(1000000),
        channel: z.enum(["marketplace", "varejo"]),
        unit_price: positive,
      })
      .strict()
      .parse(req.body);
    const result = await transaction(async (c) => {
      // O mesmo pedido reenviado não deve duplicar a venda nem a saída de estoque.
      const repeated = async () => {
        const existing = (
          await c.query("SELECT * FROM sales WHERE request_id=$1", [
            data.request_id,
          ])
        ).rows[0];
        if (
          existing &&
          (existing.product_id !== data.product_id ||
            existing.quantity !== data.quantity ||
            existing.channel !== data.channel ||
            Number(existing.unit_price) !== data.unit_price)
        )
          fail(
            "Esta identificação já foi utilizada em outra venda. Abra um novo registro.",
          );
        return existing;
      };
      const previous = await repeated();
      if (previous) return { sale: previous, repeated: true };
      const product = await row(c, "products", data.product_id);
      // A venda pode ter sido confirmada enquanto aguardávamos o produto: verificar a chave de novo.
      const afterLock = await repeated();
      if (afterLock) return { sale: afterLock, repeated: true };
      if (product.stock_units < data.quantity)
        fail(
          `Estoque insuficiente. Disponível: ${product.stock_units} unidade(s).`,
        );
      const sale = (
        await c.query(
          "INSERT INTO sales(request_id,product_id,quantity,channel,unit_price) VALUES ($1,$2,$3,$4,$5) RETURNING *",
          [
            data.request_id,
            data.product_id,
            data.quantity,
            data.channel,
            data.unit_price,
          ],
        )
      ).rows[0];
      await c.query(
        "UPDATE products SET stock_units=stock_units-$1 WHERE id=$2",
        [data.quantity, product.id],
      );
      await c.query(
        "INSERT INTO stock_movements(product_id,sale_id,quantity,reason) VALUES ($1,$2,$3,$4)",
        [
          product.id,
          sale.id,
          -data.quantity,
          "Venda · " +
            (data.channel === "marketplace" ? "Marketplace" : "Varejo"),
        ],
      );
      return { sale, repeated: false };
    });
    res.status(result.repeated ? 200 : 201).json(result.sale);
  });
  app.get("/api/orders", async (req, res) => {
    const orders = (
      await pool.query(
        `SELECT o.*,p.name product_name,m.brand material_name,m.family material_family,m.color material_color,r.code printer_name,r.brand printer_brand,r.model printer_model FROM production_orders o JOIN products p ON p.id=o.product_id JOIN materials m ON m.id=o.material_id JOIN printers r ON r.id=o.printer_id ORDER BY o.id DESC`,
      )
    ).rows;
    const lines = (
      await pool.query(
        `SELECT om.*,m.brand,m.family,m.color FROM production_order_materials om JOIN materials m ON m.id=om.material_id ORDER BY om.order_id,om.slot`,
      )
    ).rows;
    // Os itens são a fonte multicor; material_id no cabeçalho só preserva compatibilidade.
    const grouped = new Map();
    for (const line of lines) {
      if (!grouped.has(line.order_id)) grouped.set(line.order_id, []);
      grouped.get(line.order_id).push(line);
    }
    res.json(
      orders.map((order) => ({
        ...order,
        materials: grouped.get(order.id) || [],
      })),
    );
  });
  app.post("/api/orders", async (req, res) => {
    const base = {
      product_id: z.number().int().positive(),
      printer_id: z.number().int().positive(),
      quantity: z.number().int().positive().max(1000000),
    };
    const lineSchema = z
      .object({ material_id: z.number().int().positive(), planned_g: positive })
      .strict();
    const parsed = z
      .union([
        z
          .object({ ...base, materials: z.array(lineSchema).min(1).max(4) })
          .strict(),
        z
          .object({
            ...base,
            material_id: z.number().int().positive(),
            planned_g: positive,
          })
          .strict(),
      ])
      .parse(req.body);
    const data = {
      ...parsed,
      materials: parsed.materials || [
        { material_id: parsed.material_id, planned_g: parsed.planned_g },
      ],
    };
    if (
      new Set(data.materials.map((m) => m.material_id)).size !==
      data.materials.length
    )
      fail("Selecione cada filamento apenas uma vez.", 400);
    // Planejar não reserva estoque nem ocupa a impressora; o início exige exclusividade.
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
      const order = (
        await c.query(
          "INSERT INTO production_orders(product_id,printer_id,material_id,quantity,planned_g) VALUES ($1,$2,$3,$4,$5) RETURNING *",
          [
            data.product_id,
            data.printer_id,
            data.materials[0].material_id,
            data.quantity,
            data.materials.reduce((sum, m) => sum + m.planned_g, 0),
          ],
        )
      ).rows[0];
      for (const [index, line] of data.materials.entries())
        await c.query(
          "INSERT INTO production_order_materials(order_id,slot,material_id,planned_g) VALUES ($1,$2,$3,$4)",
          [order.id, index + 1, line.material_id, line.planned_g],
        );
      return order;
    });
    res.status(201).json(order);
  });
  // Remoção física limitada a cancelada sem movimentos: preservar produção já contabilizada.
  app.delete("/api/orders/:id", async (req, res) => {
    const key = id(req.params.id);
    await transaction(async (c) => {
      const order = await row(c, "production_orders", key);
      if (order.status !== "cancelada")
        fail("Somente ordens canceladas podem ser apagadas.");
      if (
        (
          await c.query("SELECT 1 FROM stock_movements WHERE order_id=$1", [
            key,
          ])
        ).rowCount
      )
        fail(
          "A ordem possui movimentações de estoque e deve permanecer no histórico.",
        );
      await c.query(
        "DELETE FROM production_order_materials WHERE order_id=$1",
        [key],
      );
      await c.query("DELETE FROM production_orders WHERE id=$1", [key]);
    });
    res.status(204).end();
  });
  app.post("/api/orders/:id/:action", async (req, res) => {
    const key = id(req.params.id),
      action = z.enum(["start", "finish", "cancel"]).parse(req.params.action);
    const completion =
      action === "finish"
        ? z
            .union([
              z
                .object({
                  approved_quantity: z.number().int().min(0).max(1000000),
                  materials: z
                    .array(
                      z
                        .object({
                          material_id: z.number().int().positive(),
                          actual_g: z
                            .number()
                            .min(0)
                            .max(10000000)
                            .multipleOf(0.01),
                        })
                        .strict(),
                    )
                    .min(1)
                    .max(4),
                })
                .strict(),
              z
                .object({
                  actual_g: positive,
                  approved_quantity: z.number().int().min(0).max(1000000),
                })
                .strict(),
            ])
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
          const planned = (
            await c.query(
              "SELECT * FROM production_order_materials WHERE order_id=$1 ORDER BY material_id",
              [key],
            )
          ).rows;
          if (!completion.materials && planned.length !== 1)
            fail("Informe o consumo de cada filamento.", 400);
          const consumed = completion.materials || [
            {
              material_id: planned[0].material_id,
              actual_g: completion.actual_g,
            },
          ];
          const byId = new Map(consumed.map((m) => [m.material_id, m]));
          if (
            byId.size !== consumed.length ||
            consumed.length !== planned.length ||
            planned.some((m) => !byId.has(m.material_id))
          )
            fail(
              "Os filamentos informados devem corresponder aos da ordem, sem repetições.",
              400,
            );
          // Uma cor pode ficar sem uso; uma conclusão exige consumo total positivo.
          if (consumed.every((m) => m.actual_g === 0))
            fail(
              "Informe consumo maior que zero em pelo menos um filamento.",
              400,
            );
          // Mesma ordem de bloqueio para todas as transações evita deadlocks entre cores.
          for (const line of planned) {
            const material = await row(c, "materials", line.material_id),
              amount = byId.get(line.material_id).actual_g;
            if (Number(material.stock_g) < amount)
              fail(
                `Estoque insuficiente: ${material.brand} · ${material.family} · ${material.color}.`,
              );
            await c.query(
              "UPDATE materials SET stock_g=stock_g-$1 WHERE id=$2",
              [amount, material.id],
            );
            await c.query(
              "UPDATE production_order_materials SET actual_g=$1,material_cost=round($1::numeric * $2::numeric / 1000,2) WHERE order_id=$3 AND material_id=$4",
              [amount, material.cost_per_kg, key, material.id],
            );
            if (amount > 0)
              await c.query(
                "INSERT INTO stock_movements(material_id,order_id,quantity,reason) VALUES ($1,$2,$3,'Consumo de produção')",
                [material.id, key, -amount],
              );
          }
          // Entrada de produto ocorre uma vez por ordem, não uma vez para cada cor.
          await c.query(
            "UPDATE products SET stock_units=stock_units+$1 WHERE id=$2",
            [completion.approved_quantity, order.product_id],
          );
          if (completion.approved_quantity > 0)
            await c.query(
              "INSERT INTO stock_movements(product_id,order_id,quantity,reason) VALUES ($1,$2,$3,'Produção concluída')",
              [order.product_id, key, completion.approved_quantity],
            );
          await c.query(
            "UPDATE production_orders SET status='concluida',actual_g=(SELECT sum(actual_g) FROM production_order_materials WHERE order_id=$1),approved_quantity=$2,material_cost=(SELECT sum(material_cost) FROM production_order_materials WHERE order_id=$1),finished_at=now() WHERE id=$1",
            [key, completion.approved_quantity],
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
  // Falhas inesperadas ficam no log; a resposta HTTP não expõe detalhes internos do SQL.
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
