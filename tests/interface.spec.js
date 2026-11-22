import { test, expect } from "@playwright/test";

test("cadastro → entrada → produção → histórico e layout móvel", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.UI_BASE_URL || "http://127.0.0.1:5173");
  await expect(
    page.getByRole("heading", { name: "Visão geral" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "Materiais", exact: true }).click();
  await page.getByRole("button", { name: "+ Novo cadastro" }).click();
  await page.getByLabel("Marca", { exact: true }).fill("Marca teste");
  await page.getByLabel("Cor", { exact: true }).fill("Azul");
  await page.getByLabel("Custo por kg").fill("100");
  await page.getByLabel("Saldo inicial (g)").fill("500");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "+ Novo cadastro" }).click();
  await page.getByLabel("Marca", { exact: true }).fill("Marca teste");
  await page.getByLabel("Material (PLA, PETG…)").fill("PETG");
  await page.getByLabel("Cor", { exact: true }).fill("Vermelho");
  await page.getByLabel("Custo por kg").fill("120");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Entrada de estoque" }).click();
  await page
    .getByLabel("Material", { exact: true })
    .selectOption({ label: "Marca teste · PLA · Azul" });
  await page.getByLabel("Quantidade (g)").fill("500");
  await page.getByLabel("Motivo da entrada").fill("Compra inicial");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Impressoras", exact: true }).click();
  await page.getByRole("button", { name: "+ Novo cadastro" }).click();
  await page.getByLabel("Código (ex.: Impressora 01)").fill("Impressora 01");
  await page.getByLabel("Marca", { exact: true }).fill("Bambu Lab");
  await page.getByLabel("Modelo", { exact: true }).fill("A1");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const [code, brand, model] of [
    ["Impressora 02", "Bambu Lab", "A1"],
    ["Impressora 03", "Creality", "Ender 3"],
  ]) {
    await page.getByRole("button", { name: "+ Novo cadastro" }).click();
    await page.getByLabel("Código (ex.: Impressora 01)").fill(code);
    await page.getByLabel("Marca", { exact: true }).fill(brand);
    await page.getByLabel("Modelo", { exact: true }).fill(model);
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Produtos", exact: true }).click();
  await page.getByRole("button", { name: "+ Novo cadastro" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Suporte");
  await page.getByLabel("SKU", { exact: true }).fill("SUP-" + Date.now());
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Produção", exact: true }).click();
  await page.getByRole("button", { name: "+ Nova ordem" }).click();
  await page
    .getByLabel("Produto", { exact: true })
    .selectOption({ label: "Suporte" });
  await page
    .getByLabel("Modelo da impressora", { exact: true })
    .selectOption({ label: "Bambu Lab · A1" });
  await page
    .getByLabel("Impressora", { exact: true })
    .selectOption({ label: "Impressora 01" });
  await page
    .getByLabel("Marca do filamento 1", { exact: true })
    .selectOption({ label: "Marca teste" });
  await page
    .getByLabel("Material do filamento 1", { exact: true })
    .selectOption({ label: "PLA" });
  await page
    .getByLabel("Cor do filamento 1", { exact: true })
    .selectOption({ label: "Azul" });
  await page.getByRole("button", { name: "+ Adicionar filamento" }).click();
  await page
    .getByLabel("Marca do filamento 2", { exact: true })
    .selectOption({ label: "Marca teste" });
  await page
    .getByLabel("Material do filamento 2", { exact: true })
    .selectOption({ label: "PETG" });
  await expect(
    page
      .getByLabel("Cor do filamento 2", { exact: true })
      .getByRole("option", { name: "Vermelho", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Remover filamento 2" }).click();
  await page.getByLabel("Quantidade de peças").fill("10");
  await page.getByLabel("Consumo estimado do filamento 1 (g)").fill("200");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await page.getByRole("button", { name: "+ Nova ordem" }).click();
  await page
    .getByLabel("Modelo da impressora", { exact: true })
    .selectOption({ label: "Bambu Lab · A1" });
  await expect(
    page.getByRole("option", { name: "Impressora 01 — Ocupada", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("option", { name: "Impressora 02", exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel("Impressora", { exact: true })
    .selectOption({ label: "Impressora 02" });
  await page
    .getByLabel("Modelo da impressora", { exact: true })
    .selectOption({ label: "Creality · Ender 3" });
  await expect(page.getByLabel("Impressora", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("option", { name: "Impressora 02", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await page.getByLabel("Consumo real do filamento 1 (g)").fill("200");
  await page.getByLabel("Peças aprovadas").fill("8");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Concluída", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "+ Nova ordem" }).click();
  await page
    .getByLabel("Modelo da impressora", { exact: true })
    .selectOption({ label: "Bambu Lab · A1" });
  await expect(
    page.getByRole("option", { name: "Impressora 01", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Materiais", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "800 g", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Produtos", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "8 un.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Movimentações", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("inicio-desktop.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("seleção separada e conclusão com quatro filamentos", async ({
  page,
}, testInfo) => {
  const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
  const create = async (path, body) => {
    const r = await page.request.post(base + "/api/" + path, { data: body });
    expect(r.status()).toBe(201);
    return r.json();
  };
  const printer = await create("printers", {
    code: "AMS-01",
    brand: "Bambu Lab",
    model: "A1 AMS",
    status: "disponivel",
  });
  const product = await create("products", {
    name: "Produto AMS",
    sku: "AMS-4",
  });
  const materials = [];
  for (const color of ["Branco", "Preto", "Amarelo", "Verde"]) {
    const m = await create("materials", {
      brand: "Marca AMS",
      family: "PLA",
      color,
      cost_per_kg: 100,
    });
    await create("stock-entry", {
      material_id: m.id,
      quantity: 100,
      reason: "Teste AMS",
    });
    materials.push(m);
  }
  await page.goto(base);
  await page.getByRole("button", { name: "Produção", exact: true }).click();
  await page.getByRole("button", { name: "+ Nova ordem" }).click();
  await page
    .getByLabel("Produto", { exact: true })
    .selectOption({ label: "Produto AMS" });
  await page
    .getByLabel("Modelo da impressora", { exact: true })
    .selectOption({ label: "Bambu Lab · A1 AMS" });
  await page
    .getByLabel("Impressora", { exact: true })
    .selectOption({ label: "AMS-01" });
  await page.getByLabel("Quantidade de peças").fill("4");
  for (let i = 1; i <= 4; i++) {
    if (i > 1)
      await page.getByRole("button", { name: "+ Adicionar filamento" }).click();
    await page
      .getByLabel(`Marca do filamento ${i}`, { exact: true })
      .selectOption({ label: "Marca AMS" });
    await page
      .getByLabel(`Material do filamento ${i}`, { exact: true })
      .selectOption({ label: "PLA" });
    if (i > 1)
      await expect(
        page
          .getByLabel(`Cor do filamento ${i}`, { exact: true })
          .getByRole("option", { name: "Branco", exact: true }),
      ).toBeDisabled();
    await page
      .getByLabel(`Cor do filamento ${i}`, { exact: true })
      .selectOption({ label: materials[i - 1].color });
    await page.getByLabel(`Consumo estimado do filamento ${i} (g)`).fill("25");
  }
  await expect(
    page.getByRole("button", { name: "+ Adicionar filamento" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Buscar registros" })
    .fill("Produto AMS");
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  for (let i = 1; i <= 4; i++)
    await page
      .getByLabel(`Consumo real do filamento ${i} (g)`)
      .fill(String(i * 10));
  await page.getByLabel("Peças aprovadas").fill("4");
  await page.screenshot({
    path: testInfo.outputPath("conclusao-quatro-cores.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Concluída", { exact: true })).toBeVisible();
  const stored = await (await page.request.get(base + "/api/materials")).json();
  expect(
    materials.map((m) => Number(stored.find((row) => row.id === m.id).stock_g)),
  ).toEqual([90, 80, 70, 60]);
  const products = await (
    await page.request.get(base + "/api/products")
  ).json();
  expect(products.find((p) => p.id === product.id).stock_units).toBe(4);
  const printers = await (
    await page.request.get(base + "/api/printers")
  ).json();
  expect(printers.find((p) => p.id === printer.id).availability).toBe("livre");
});

test("apaga ordem cancelada após confirmação", async ({ page }) => {
  const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
  const create = async (path, data) => {
    const r = await page.request.post(base + "/api/" + path, { data });
    expect(r.status()).toBe(201);
    return r.json();
  };
  const material = await create("materials", {
    brand: "Teste exclusão",
    family: "PLA",
    color: "Azul",
    cost_per_kg: 100,
  });
  const printer = await create("printers", {
    code: "DEL-01",
    brand: "Bambu Lab",
    model: "A1",
    status: "disponivel",
  });
  const product = await create("products", {
    name: "Produto para apagar ordem",
    sku: "DEL-01",
  });
  await create("orders", {
    printer_id: printer.id,
    product_id: product.id,
    quantity: 1,
    materials: [{ material_id: material.id, planned_g: 10 }],
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Produção", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Buscar registros" })
    .fill("Produto para apagar ordem");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Apagar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Apagar ordem cancelada" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Apagar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(0);
});

test("saldo editável registra ajustes no estoque", async ({ page }) => {
  const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
  const response = await page.request.post(base + "/api/materials", {
    data: {
      brand: "Marca ajuste",
      family: "PLA",
      color: "Cinza",
      cost_per_kg: 100,
      initial_stock_g: 100,
    },
  });
  expect(response.status()).toBe(201);
  const material = await response.json();
  await page.goto(base);
  await page.getByRole("button", { name: "Materiais", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Buscar registros" })
    .fill("Marca ajuste");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await expect(page.getByLabel("Saldo atual (g)")).toHaveValue("100.00");
  await page.getByLabel("Saldo atual (g)").fill("250");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "250 g", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Saldo atual (g)").fill("50");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "50 g", exact: true }),
  ).toBeVisible();
  const movements = await (
    await page.request.get(base + "/api/movements")
  ).json();
  expect(
    movements
      .filter((m) => m.material_id === material.id)
      .map((m) => Number(m.quantity)),
  ).toEqual([-200, 150, 100]);
});

test("venda por marketplace e varejo mostra bruto e baixa estoque", async ({
  page,
}, testInfo) => {
  const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
  const create = async (path, data) => {
    const r = await page.request.post(base + "/api/" + path, { data });
    expect(r.status()).toBe(201);
    return r.json();
  };
  const m = await create("materials", {
    brand: "Marca venda",
    family: "PLA",
    color: "Preto",
    cost_per_kg: 100,
    initial_stock_g: 1000,
  });
  const p = await create("printers", {
    code: "VENDA-UI",
    brand: "Bambu Lab",
    model: "A1",
    status: "disponivel",
  });
  const product = await create("products", {
    name: "Peça para venda",
    sku: "VENDA-UI",
  });
  const order = await create("orders", {
    printer_id: p.id,
    product_id: product.id,
    quantity: 6,
    materials: [{ material_id: m.id, planned_g: 100 }],
  });
  expect(
    (await page.request.post(`${base}/api/orders/${order.id}/start`)).status(),
  ).toBe(200);
  expect(
    (
      await page.request.post(`${base}/api/orders/${order.id}/finish`, {
        data: {
          approved_quantity: 6,
          materials: [{ material_id: m.id, actual_g: 100 }],
        },
      })
    ).status(),
  ).toBe(200);
  await page.goto(base);
  await page.getByRole("button", { name: "Vendas", exact: true }).click();
  await page.getByRole("button", { name: "+ Registrar venda" }).click();
  await expect(
    page.getByRole("heading", { name: "Registrar venda", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Produto", { exact: true })
    .selectOption({ label: "Peça para venda · VENDA-UI — 6 un." });
  await page.getByLabel("Quantidade vendida").fill("2");
  await page
    .getByLabel("Canal de venda")
    .selectOption({ label: "Marketplace" });
  await page.getByLabel("Preço unitário (R$)").fill("25.50");
  await expect(page.locator(".sale-total strong")).toHaveText(/51,00/);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "Marketplace", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: /51,00/ })).toBeVisible();
  await page.getByRole("button", { name: "+ Registrar venda" }).click();
  await page
    .getByLabel("Produto", { exact: true })
    .selectOption({ label: "Peça para venda · VENDA-UI — 4 un." });
  await page.getByLabel("Quantidade vendida").fill("1");
  await page.getByLabel("Canal de venda").selectOption({ label: "Varejo" });
  await page.getByLabel("Preço unitário (R$)").fill("10");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(".sales-stats article").first().locator("strong"),
  ).toHaveText(/61,00/);
  await page.screenshot({
    path: testInfo.outputPath("vendas-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("vendas-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "+ Registrar venda" }).click();
  await page
    .getByLabel("Produto", { exact: true })
    .selectOption({ label: "Peça para venda · VENDA-UI — 3 un." });
  await page.getByLabel("Quantidade vendida").fill("4");
  await page.getByLabel("Preço unitário (R$)").fill("10");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Estoque insuficiente",
  );
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  const products = await (
    await page.request.get(base + "/api/products")
  ).json();
  expect(products.find((p) => p.id === product.id).stock_units).toBe(3);
});

test("botão baixa relatório CSV por seção em ZIP", async ({
  page,
}, testInfo) => {
  const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
  await page.goto(base);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar relatórios (CSV)", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^avs-labs-3d-relatorios-.*\.zip$/,
  );
  expect(await download.failure()).toBeNull();
  const path = testInfo.outputPath("relatorios.zip");
  await download.saveAs(path);
  const { readFile } = await import("node:fs/promises");
  const { unzipSync } = await import("fflate");
  const files = unzipSync(await readFile(path));
  expect(Object.keys(files).filter((f) => f.endsWith(".csv"))).toHaveLength(8);
  expect(Buffer.from(files["08-vendas.csv"]).toString("utf8")).toContain(
    "Peça para venda",
  );
  expect(
    Buffer.from(files["06-filamentos-da-producao.csv"]).toString("utf8"),
  ).toContain("Marca AMS");
  await expect(page.getByRole("status")).toContainText("Relatórios exportados");
});
