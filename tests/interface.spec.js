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
  await page.getByLabel("Nome", { exact: true }).fill("PLA azul");
  await page.getByLabel("Cor", { exact: true }).fill("Azul");
  await page.getByLabel("Custo por kg").fill("100");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Entrada de estoque" }).click();
  await page
    .getByLabel("Material", { exact: true })
    .selectOption({ label: "PLA azul" });
  await page.getByLabel("Quantidade (g)").fill("1000");
  await page.getByLabel("Motivo da entrada").fill("Compra inicial");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Impressoras", exact: true }).click();
  await page.getByRole("button", { name: "+ Novo cadastro" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Impressora 01");
  await page.getByLabel("Modelo", { exact: true }).fill("Bambu A1");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
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
    .getByLabel("Impressora", { exact: true })
    .selectOption({ label: "Impressora 01" });
  await page
    .getByLabel("Material", { exact: true })
    .selectOption({ label: "PLA azul" });
  await page.getByLabel("Quantidade de peças").fill("10");
  await page.getByLabel("Consumo estimado").fill("200");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await page.getByLabel("Consumo real").fill("200");
  await page.getByLabel("Peças aprovadas").fill("8");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Concluída", { exact: true })).toBeVisible();
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
  await expect(page.locator("tbody tr")).toHaveCount(3);
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
  expect(errors).toEqual([]);
});
