/** O relatório é somente leitura: oito CSVs completos no mesmo snapshot de dados. */
import { zipSync, strToU8 } from "fflate";

// Separador e vírgula decimal usados em planilhas configuradas em português.
// Campos textuais são neutralizados para que cadastros não virem fórmulas.
/** Tipos numéricos preservam saídas negativas; proteção de fórmula é apenas textual. */
export function csv(columns, rows) {
  const cell = (value, type = "text") => {
    let text =
      value === null || value === undefined
        ? ""
        : value instanceof Date
          ? value.toISOString()
          : String(value);
    if (type === "decimal") text = text.replace(".", ",");
    if (type === "text" && /^[\s\uFEFF]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      columns.map(([, label]) => cell(label)).join(";"),
      ...rows.map((row) =>
        columns.map(([key, , type]) => cell(row[key], type)).join(";"),
      ),
    ].join("\r\n") +
    "\r\n"
  );
}

export async function exportReports(transaction) {
  const reports = await transaction(async (c) => {
    // Todas as seções retratam o mesmo instante, mesmo durante uma produção/venda.
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const query = async (sql) => (await c.query(sql)).rows;
    const overview = await query(`SELECT
      (SELECT count(*) FROM materials) filamentos,
      (SELECT coalesce(sum(stock_g),0) FROM materials) saldo_filamentos_g,
      (SELECT count(*) FROM printers) impressoras,
      (SELECT count(*) FROM products) produtos,
      (SELECT coalesce(sum(stock_units),0) FROM products) unidades_em_estoque,
      (SELECT count(*) FROM production_orders) ordens,
      (SELECT count(*) FROM production_orders WHERE status IN ('planejada','em_producao')) ordens_abertas,
      (SELECT count(*) FROM sales) vendas,
      (SELECT coalesce(sum(quantity),0) FROM sales) unidades_vendidas,
      (SELECT coalesce(sum(total_amount),0) FROM sales) faturamento_bruto,
      (SELECT coalesce(sum(total_amount),0) FROM sales WHERE channel='marketplace') bruto_marketplace,
      (SELECT coalesce(sum(total_amount),0) FROM sales WHERE channel='varejo') bruto_varejo`);
    return {
      overview,
      materials: await query("SELECT * FROM materials ORDER BY id"),
      printers: await query(
        `SELECT p.*, CASE WHEN p.status='manutencao' THEN 'Manutenção' WHEN EXISTS(SELECT 1 FROM production_orders o WHERE o.printer_id=p.id AND o.status='em_producao') THEN 'Ocupada' ELSE 'Livre' END availability FROM printers p ORDER BY p.id`,
      ),
      products: await query("SELECT * FROM products ORDER BY id"),
      orders: await query(
        "SELECT o.*,p.name product_name,p.sku,r.code printer_code,r.brand printer_brand,r.model printer_model FROM production_orders o JOIN products p ON p.id=o.product_id JOIN printers r ON r.id=o.printer_id ORDER BY o.id",
      ),
      consumptions: await query(
        "SELECT om.*,m.brand,m.family,m.color FROM production_order_materials om JOIN materials m ON m.id=om.material_id ORDER BY om.order_id,om.slot",
      ),
      movements: await query(
        "SELECT sm.*,m.brand,m.family,m.color,p.name product_name,p.sku FROM stock_movements sm LEFT JOIN materials m ON m.id=sm.material_id LEFT JOIN products p ON p.id=sm.product_id ORDER BY sm.id",
      ),
      sales: await query(
        "SELECT s.*,p.name product_name,p.sku FROM sales s JOIN products p ON p.id=s.product_id ORDER BY s.id",
      ),
    };
  });
  const files = {};
  const add = (name, columns, rows) => {
    files[name] = strToU8(csv(columns, rows));
  };
  add(
    "01-visao-geral.csv",
    [
      ["filamentos", "Filamentos cadastrados", "number"],
      ["saldo_filamentos_g", "Saldo de filamentos (g)", "decimal"],
      ["impressoras", "Impressoras cadastradas", "number"],
      ["produtos", "Produtos cadastrados", "number"],
      ["unidades_em_estoque", "Produtos em estoque (un.)", "number"],
      ["ordens", "Ordens de produção", "number"],
      ["ordens_abertas", "Ordens abertas", "number"],
      ["vendas", "Vendas registradas", "number"],
      ["unidades_vendidas", "Unidades vendidas", "number"],
      ["faturamento_bruto", "Faturamento bruto (R$)", "decimal"],
      ["bruto_marketplace", "Bruto Marketplace (R$)", "decimal"],
      ["bruto_varejo", "Bruto Varejo (R$)", "decimal"],
    ],
    reports.overview,
  );
  add(
    "02-filamentos.csv",
    [
      ["id", "ID", "number"],
      ["brand", "Marca"],
      ["family", "Material"],
      ["color", "Cor"],
      ["stock_g", "Saldo (g)", "decimal"],
      ["cost_per_kg", "Custo por kg (R$)", "decimal"],
    ],
    reports.materials,
  );
  add(
    "03-impressoras.csv",
    [
      ["id", "ID", "number"],
      ["code", "Código"],
      ["brand", "Marca"],
      ["model", "Modelo"],
      ["status", "Situação do cadastro"],
      ["availability", "Disponibilidade"],
    ],
    reports.printers,
  );
  add(
    "04-produtos.csv",
    [
      ["id", "ID", "number"],
      ["name", "Nome"],
      ["sku", "SKU"],
      ["stock_units", "Saldo (un.)", "number"],
    ],
    reports.products,
  );
  add(
    "05-producao.csv",
    [
      ["id", "Ordem ID", "number"],
      ["product_id", "Produto ID", "number"],
      ["product_name", "Produto"],
      ["sku", "SKU"],
      ["printer_id", "Impressora ID", "number"],
      ["printer_code", "Código da impressora"],
      ["printer_brand", "Marca da impressora"],
      ["printer_model", "Modelo da impressora"],
      ["material_id", "Primeiro filamento ID", "number"],
      ["quantity", "Quantidade planejada", "number"],
      ["approved_quantity", "Quantidade aprovada", "number"],
      ["status", "Situação"],
      ["planned_g", "Consumo total estimado (g)", "decimal"],
      ["actual_g", "Consumo total real (g)", "decimal"],
      ["material_cost", "Custo dos filamentos (R$)", "decimal"],
      ["created_at", "Criação (UTC)", "date"],
      ["finished_at", "Conclusão ou cancelamento (UTC)", "date"],
    ],
    reports.orders,
  );
  add(
    "06-filamentos-da-producao.csv",
    [
      ["order_id", "Ordem ID", "number"],
      ["slot", "Posição do filamento", "number"],
      ["material_id", "Filamento ID", "number"],
      ["brand", "Marca"],
      ["family", "Material"],
      ["color", "Cor"],
      ["planned_g", "Consumo estimado (g)", "decimal"],
      ["actual_g", "Consumo real (g)", "decimal"],
      ["material_cost", "Custo (R$)", "decimal"],
    ],
    reports.consumptions,
  );
  add(
    "07-movimentacoes.csv",
    [
      ["id", "ID", "number"],
      ["created_at", "Data (UTC)", "date"],
      ["material_id", "Filamento ID", "number"],
      ["brand", "Marca"],
      ["family", "Material"],
      ["color", "Cor"],
      ["product_id", "Produto ID", "number"],
      ["product_name", "Produto"],
      ["sku", "SKU"],
      ["order_id", "Ordem ID", "number"],
      ["sale_id", "Venda ID", "number"],
      [
        "quantity",
        "Quantidade (g para filamento; un. para produto)",
        "decimal",
      ],
      ["reason", "Motivo"],
    ],
    reports.movements,
  );
  add(
    "08-vendas.csv",
    [
      ["id", "Venda ID", "number"],
      ["created_at", "Data (UTC)", "date"],
      ["product_id", "Produto ID", "number"],
      ["product_name", "Produto"],
      ["sku", "SKU"],
      ["channel", "Canal"],
      ["quantity", "Quantidade vendida", "number"],
      ["unit_price", "Preço unitário (R$)", "decimal"],
      ["total_amount", "Total bruto (R$)", "decimal"],
      ["request_id", "Identificador da operação"],
    ],
    reports.sales,
  );
  files["LEIA-ME.txt"] = strToU8(
    "AVS Labs 3D — Relatório geral\n\nCada CSV corresponde a uma seção do sistema. CSV não possui abas.\nAbra os arquivos no Excel, LibreOffice ou outro leitor de planilhas.\nFormato: UTF-8 com BOM, separador ponto e vírgula e vírgula decimal.\nDatas em UTC, no formato ISO 8601. Célula vazia indica dado ainda não informado.\nA exportação inclui todos os registros, sem aplicar a busca da tela.\nOs arquivos retratam a mesma leitura consistente do banco.\nValores de vendas são brutos, sem taxas, despesas ou lucro.\nIDs permitem relacionar arquivos de produção, consumos, movimentações e vendas.\nTextos que poderiam ser interpretados como fórmulas recebem um apóstrofo inicial.\n",
  );
  return Buffer.from(zipSync(files, { level: 6 }));
}
