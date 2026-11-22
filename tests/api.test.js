import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import supertest from "supertest";
import { PGlite } from "@electric-sql/pglite";
// Banco temporário isolado: nunca limpa nem altera o banco da aplicação.
const url = process.env.TEST_DATABASE_URL;
let admin, pool, embedded, client, dbName;
before(async () => {
  const schema = await readFile(
    new URL("../database/schema.sql", import.meta.url),
    "utf8",
  );
  const { createApp } = await import("../server/app.js");
  if (!url) {
    embedded = new PGlite();
    try {
      await embedded.exec(schema);
    } catch (error) {
      await embedded.exec("ROLLBACK");
      throw error;
    }
    const adapt = (db) => ({
      query: async (sql, values) => {
        const r = await db.query(sql, values);
        return { ...r, rowCount: r.affectedRows || r.rows.length };
      },
    });
    const transaction = (fn) => embedded.transaction((tx) => fn(adapt(tx)));
    client = supertest(createApp({ pool: adapt(embedded), transaction }));
  } else {
    admin = new pg.Pool({ connectionString: url });
    dbName = "avs_pi_test_" + process.pid;
    await admin.query(`CREATE DATABASE "${dbName}"`);
    const target = new URL(url);
    target.pathname = "/" + dbName;
    pool = new pg.Pool({ connectionString: target.toString() });
    await pool.query(schema);
    const transaction = async (fn) => {
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
    };
    client = supertest(createApp({ pool, transaction }));
  }
});
after(async () => {
  if (embedded) await embedded.close();
  if (pool) await pool.end();
  if (admin) {
    if (dbName) await admin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await admin.end();
  }
});
async function request(path, method = "GET", body) {
  let req = client[method.toLowerCase()]("/api/" + path);
  if (body) req = req.send(body);
  const r = await req;
  return { status: r.status, body: r.status === 204 ? null : r.body };
}
async function create(path, data) {
  const r = await request(path, "POST", data);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
}
test("CRUD, validação, produção transacional, concorrência e preservação do histórico", async () => {
  const material = await create("materials", {
    brand: "PLA teste",
    family: "PLA",
    color: "Azul",
    cost_per_kg: 100,
  });
  const printer = await create("printers", {
    code: "Impressora 01",
    brand: "Bambu Lab",
    model: "Modelo teste",
    status: "disponivel",
  });
  assert.equal((await request("printers")).body[0].availability, "livre");
  assert.equal(
    (
      await request("printers", "POST", {
        code: "impressora 01",
        brand: "Outra",
        model: "Outro",
        status: "disponivel",
      })
    ).status,
    409,
  );
  const product = await create("products", { name: "Suporte", sku: "SUP-01" });
  assert.equal(
    (
      await request("materials", "POST", {
        brand: "",
        family: "PLA",
        color: "Azul",
        cost_per_kg: 100,
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("products", "POST", { name: "Outro", sku: "SUP-01" }))
      .status,
    409,
  );
  assert.equal(
    (
      await request("materials/" + material.id, "PUT", {
        brand: "PLA editado",
        family: "PLA",
        color: "Azul",
        cost_per_kg: 100,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("stock-entry", "POST", {
        material_id: material.id,
        quantity: -5,
        reason: "Inválida",
      })
    ).status,
    400,
  );
  await create("stock-entry", {
    material_id: material.id,
    quantity: 1000,
    reason: "Entrada inicial",
  });
  const orderData = {
    product_id: product.id,
    printer_id: printer.id,
    material_id: material.id,
    quantity: 10,
    planned_g: 200,
  };
  const first = await create("orders", orderData),
    second = await create("orders", orderData);
  assert.equal(
    (
      await request(`orders/${first.id}/finish`, "POST", {
        actual_g: 100,
        approved_quantity: 10,
      })
    ).status,
    409,
  );
  assert.equal((await request(`orders/${first.id}`, "DELETE")).status, 409);
  assert.equal((await request(`orders/${first.id}/start`, "POST")).status, 200);
  assert.equal((await request("printers")).body[0].availability, "ocupada");
  assert.equal((await request("orders", "POST", orderData)).status, 409);
  assert.equal(
    (await request(`orders/${second.id}/start`, "POST")).status,
    409,
  );
  assert.equal(
    (await request(`orders/${first.id}/cancel`, "POST")).status,
    409,
  );
  assert.equal(
    (
      await request("printers/" + printer.id, "PUT", {
        code: "Impressora 01",
        brand: "Bambu Lab",
        model: "Modelo teste",
        status: "manutencao",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`orders/${first.id}/finish`, "POST", {
        actual_g: 1100,
        approved_quantity: 10,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`orders/${first.id}/finish`, "POST", {
        actual_g: 200,
        approved_quantity: 11,
      })
    ).status,
    400,
  );
  assert.equal(Number((await request("materials")).body[0].stock_g), 1000);
  const result = await Promise.all([
    request(`orders/${first.id}/finish`, "POST", {
      actual_g: 200,
      approved_quantity: 8,
    }),
    request(`orders/${first.id}/finish`, "POST", {
      actual_g: 200,
      approved_quantity: 8,
    }),
  ]);
  assert.deepEqual(result.map((r) => r.status).sort(), [200, 409]);
  assert.equal(Number((await request("materials")).body[0].stock_g), 800);
  assert.equal((await request(`orders/${first.id}`, "DELETE")).status, 409);
  assert.equal((await request("printers")).body[0].availability, "livre");
  assert.equal((await request("products")).body[0].stock_units, 8);
  assert.equal(
    Number(
      (await request("orders")).body.find((o) => o.id === first.id)
        .material_cost,
    ),
    20,
  );
  assert.equal((await request("movements")).body.length, 3);
  assert.equal(
    (await request("materials/" + material.id, "DELETE")).status,
    409,
  );
  assert.equal(
    (await request(`orders/${second.id}/cancel`, "POST")).status,
    200,
  );
  assert.equal((await request(`orders/${second.id}`, "DELETE")).status, 204);
  assert.equal((await request(`orders/${second.id}`, "DELETE")).status, 404);
  assert.equal(
    (await request("orders")).body.some((o) => o.id === second.id),
    false,
  );
  // Falha total ainda consome filamento e não cria produto.
  const failed = await create("orders", orderData);
  await request(`orders/${failed.id}/start`, "POST");
  assert.equal(
    (
      await request(`orders/${failed.id}/finish`, "POST", {
        actual_g: 50,
        approved_quantity: 0,
      })
    ).status,
    200,
  );
  assert.equal((await request("products")).body[0].stock_units, 8);
  assert.equal(Number((await request("materials")).body[0].stock_g), 750);
  // Duas impressoras podem disputar um mesmo material: saldo nunca negativo.
  const printer2 = await create("printers", {
    code: "Impressora 02",
    brand: "Bambu Lab",
    model: "Modelo teste",
    status: "disponivel",
  });
  const a = await create("orders", orderData),
    b = await create("orders", { ...orderData, printer_id: printer2.id });
  await request(`orders/${a.id}/start`, "POST");
  await request(`orders/${b.id}/start`, "POST");
  const contention = await Promise.all([
    request(`orders/${a.id}/finish`, "POST", {
      actual_g: 500,
      approved_quantity: 1,
    }),
    request(`orders/${b.id}/finish`, "POST", {
      actual_g: 500,
      approved_quantity: 1,
    }),
  ]);
  assert.deepEqual(contention.map((r) => r.status).sort(), [200, 409]);
  assert.equal(Number((await request("materials")).body[0].stock_g), 250);
  const spare = await create("products", { name: "Temporário", sku: "TEMP" });
  assert.equal(
    (
      await request("products/" + spare.id, "PUT", {
        name: "Temporário editado",
        sku: "TEMP2",
      })
    ).status,
    200,
  );
  assert.equal((await request("products/" + spare.id, "DELETE")).status, 204);
  assert.equal((await request("products/" + spare.id, "DELETE")).status, 404);
  assert.equal((await request("dashboard")).status, 200);
});

test("produção de quatro cores valida limite, repetição, consumo por cor e rollback integral", async () => {
  const printer = await create("printers", {
    code: "MULTI-01",
    brand: "Bambu Lab",
    model: "A1",
    status: "disponivel",
  });
  const product = await create("products", {
    name: "Peça multicolor",
    sku: "MULTI-4",
  });
  const materials = [];
  for (const [i, color] of ["Azul", "Vermelho", "Verde", "Amarelo"].entries()) {
    const material = await create("materials", {
      brand: "Marca multicolor",
      family: "PLA",
      color,
      cost_per_kg: (i + 1) * 100,
    });
    await create("stock-entry", {
      material_id: material.id,
      quantity: 100,
      reason: "Teste multicolor",
    });
    materials.push(material);
  }
  const lines = materials.map((m) => ({ material_id: m.id, planned_g: 10 }));
  const payload = {
    product_id: product.id,
    printer_id: printer.id,
    quantity: 2,
    materials: lines,
  };
  assert.equal(
    (
      await request("orders", "POST", {
        ...payload,
        materials: [...lines, lines[0]],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("orders", "POST", {
        ...payload,
        materials: [lines[0], lines[0]],
      })
    ).status,
    400,
  );
  const order = await create("orders", payload);
  const stored = (await request("orders")).body.find((o) => o.id === order.id);
  assert.equal(stored.materials.length, 4);
  assert.equal(Number(stored.planned_g), 40);
  assert.equal((await request(`orders/${order.id}/start`, "POST")).status, 200);
  const consume = [10, 20, 0, 5].map((actual_g, i) => ({
    material_id: materials[i].id,
    actual_g,
  }));
  assert.equal(
    (
      await request(`orders/${order.id}/finish`, "POST", {
        actual_g: 35,
        approved_quantity: 2,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`orders/${order.id}/finish`, "POST", {
        approved_quantity: 2,
        materials: consume.slice(0, 3),
      })
    ).status,
    400,
  );
  const before = (await request("movements")).body.length;
  const tooMuch = consume.map((m, i) => ({
    ...m,
    actual_g: i === 3 ? 101 : m.actual_g,
  }));
  assert.equal(
    (
      await request(`orders/${order.id}/finish`, "POST", {
        approved_quantity: 2,
        materials: tooMuch,
      })
    ).status,
    409,
  );
  assert.equal((await request("movements")).body.length, before);
  assert.deepEqual(
    (await request("materials")).body
      .filter((m) => materials.some((v) => v.id === m.id))
      .map((m) => Number(m.stock_g)),
    [100, 100, 100, 100],
  );
  assert.equal(
    (
      await request(`orders/${order.id}/finish`, "POST", {
        approved_quantity: 2,
        materials: consume,
      })
    ).status,
    200,
  );
  const completed = (await request("orders")).body.find(
    (o) => o.id === order.id,
  );
  assert.equal(Number(completed.actual_g), 35);
  assert.equal(Number(completed.material_cost), 7);
  assert.deepEqual(
    completed.materials.map((m) => Number(m.actual_g)),
    [10, 20, 0, 5],
  );
  assert.equal(
    (await request("products")).body.find((p) => p.id === product.id)
      .stock_units,
    2,
  );
  assert.equal((await request("movements")).body.length, before + 4);
  assert.equal(
    (await request("printers")).body.find((p) => p.id === printer.id)
      .availability,
    "livre",
  );
  assert.equal(
    (
      await request(`orders/${order.id}/finish`, "POST", {
        approved_quantity: 2,
        materials: consume,
      })
    ).status,
    409,
  );
});

test("saldo inicial cria entrada auditável e edição preserva estoque", async () => {
  const data = {
    brand: "Saldo inicial",
    family: "PLA",
    color: "Cinza",
    cost_per_kg: 100,
  };
  const before = (await request("movements")).body.length;
  const material = await create("materials", {
    ...data,
    initial_stock_g: 1000.25,
  });
  assert.equal(Number(material.stock_g), 1000.25);
  const entries = (await request("movements")).body.filter(
    (m) => m.material_id === material.id,
  );
  assert.equal(entries.length, 1);
  assert.equal(Number(entries[0].quantity), 1000.25);
  assert.equal(entries[0].reason, "Saldo inicial do filamento");
  assert.equal(
    (
      await request("materials/" + material.id, "PUT", {
        ...data,
        color: "Prata",
      })
    ).status,
    200,
  );
  assert.equal(
    Number(
      (await request("materials")).body.find((m) => m.id === material.id)
        .stock_g,
    ),
    1000.25,
  );
  assert.equal((await request("movements")).body.length, before + 1);
  assert.equal(
    (await request("materials", "POST", { ...data, initial_stock_g: -1 }))
      .status,
    400,
  );
  assert.equal(
    (await request("materials", "POST", { ...data, initial_stock_g: 0.001 }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("materials/" + material.id, "PUT", {
        ...data,
        initial_stock_g: 50,
      })
    ).status,
    400,
  );
  const empty = await create("materials", { ...data, initial_stock_g: 0 });
  assert.equal(Number(empty.stock_g), 0);
  assert.equal(
    (await request("movements")).body.some((m) => m.material_id === empty.id),
    false,
  );
});

test("edição ajusta saldo para cima, para baixo e zero sem apagar histórico nem sobrescrever saldo desatualizado", async () => {
  const data = {
    brand: "Ajuste de saldo",
    family: "PLA",
    color: "Preto",
    cost_per_kg: 100,
  };
  const material = await create("materials", { ...data, initial_stock_g: 100 });
  const edit = (stock_g, expected_stock_g) =>
    request("materials/" + material.id, "PUT", {
      ...data,
      stock_g,
      expected_stock_g,
    });
  assert.equal((await edit(150.25, 100)).status, 200);
  assert.equal((await edit(20, 150.25)).status, 200);
  assert.equal((await edit(20, 20)).status, 200);
  assert.equal((await edit(0, 20)).status, 200);
  assert.equal((await edit(-1, 0)).status, 400);
  await create("stock-entry", {
    material_id: material.id,
    quantity: 30,
    reason: "Reposição durante edição",
  });
  assert.equal((await edit(10, 0)).status, 409);
  assert.equal(
    Number(
      (await request("materials")).body.find((m) => m.id === material.id)
        .stock_g,
    ),
    30,
  );
  const moves = (await request("movements")).body
    .filter((m) => m.material_id === material.id)
    .reverse();
  assert.deepEqual(
    moves.map((m) => Number(m.quantity)),
    [100, 50.25, -130.25, -20, 30],
  );
  assert.equal(
    moves.reduce((total, m) => total + Number(m.quantity), 0),
    30,
  );
});

test("vendas baixam produtos, calculam bruto e evitam saldo negativo e duplicação", async () => {
  const material = await create("materials", {
    brand: "Venda teste",
    family: "PLA",
    color: "Branco",
    cost_per_kg: 100,
    initial_stock_g: 1000,
  });
  const printer = await create("printers", {
    code: "VENDA-01",
    brand: "Bambu Lab",
    model: "A1",
    status: "disponivel",
  });
  const product = await create("products", {
    name: "Produto para venda",
    sku: "VENDA-01",
  });
  const order = await create("orders", {
    printer_id: printer.id,
    product_id: product.id,
    quantity: 10,
    materials: [{ material_id: material.id, planned_g: 100 }],
  });
  await request(`orders/${order.id}/start`, "POST");
  assert.equal(
    (
      await request(`orders/${order.id}/finish`, "POST", {
        approved_quantity: 10,
        materials: [{ material_id: material.id, actual_g: 100 }],
      })
    ).status,
    200,
  );
  const payload = {
    request_id: crypto.randomUUID(),
    product_id: product.id,
    quantity: 3,
    channel: "marketplace",
    unit_price: 12.35,
  };
  const sale = await create("sales", payload);
  assert.equal(Number(sale.total_amount), 37.05);
  assert.equal((await request("sales", "POST", payload)).status, 200);
  assert.equal(
    (await request("sales", "POST", { ...payload, quantity: 2 })).status,
    409,
  );
  assert.equal(
    (
      await request("sales", "POST", {
        ...payload,
        request_id: crypto.randomUUID(),
        quantity: 8,
      })
    ).status,
    409,
  );
  for (const invalid of [
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: -1 },
    { unit_price: 0 },
    { unit_price: -1 },
    { unit_price: 1.001 },
    { channel: "outro" },
  ])
    assert.equal(
      (
        await request("sales", "POST", {
          ...payload,
          request_id: crypto.randomUUID(),
          ...invalid,
        })
      ).status,
      400,
    );
  const races = await Promise.all([
    request("sales", "POST", {
      ...payload,
      request_id: crypto.randomUUID(),
      quantity: 5,
      channel: "varejo",
      unit_price: 10,
    }),
    request("sales", "POST", {
      ...payload,
      request_id: crypto.randomUUID(),
      quantity: 5,
      channel: "varejo",
      unit_price: 10,
    }),
  ]);
  assert.deepEqual(races.map((r) => r.status).sort(), [201, 409]);
  const duplicate = {
    ...payload,
    request_id: crypto.randomUUID(),
    quantity: 1,
    channel: "varejo",
    unit_price: 1,
  };
  const repeats = await Promise.all([
    request("sales", "POST", duplicate),
    request("sales", "POST", duplicate),
  ]);
  assert.deepEqual(repeats.map((r) => r.status).sort(), [200, 201]);
  assert.equal(
    (await request("products")).body.find((p) => p.id === product.id)
      .stock_units,
    1,
  );
  const sales = (await request("sales")).body.filter(
    (s) => s.product_id === product.id,
  );
  assert.equal(sales.length, 3);
  assert.equal(
    sales.reduce(
      (total, s) => total + Math.round(Number(s.total_amount) * 100),
      0,
    ),
    8805,
  );
  const movements = (await request("movements")).body.filter(
    (m) => m.product_id === product.id && m.sale_id,
  );
  assert.deepEqual(
    movements.map((m) => Number(m.quantity)).sort((a, b) => a - b),
    [-5, -3, -1],
  );
  assert.equal((await request("products/" + product.id, "DELETE")).status, 409);
});
