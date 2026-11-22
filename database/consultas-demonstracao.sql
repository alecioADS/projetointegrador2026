-- Somente leitura: demonstração e conciliação; não limpa nem popula dados.
SELECT id, brand, family, color, stock_g, cost_per_kg FROM materials ORDER BY id;
SELECT p.id, p.code, p.brand, p.model, p.status,
 CASE WHEN p.status='manutencao' THEN 'Manutenção'
 WHEN EXISTS(SELECT 1 FROM production_orders o WHERE o.printer_id=p.id AND o.status='em_producao')
 THEN 'Ocupada' ELSE 'Livre' END AS disponibilidade FROM printers p ORDER BY id;
SELECT id, name, sku, stock_units FROM products ORDER BY id;
SELECT id, status, quantity, approved_quantity, planned_g, actual_g, material_cost FROM production_orders ORDER BY id;
SELECT om.order_id, om.slot, m.brand, m.family, m.color, om.planned_g, om.actual_g, om.material_cost
FROM production_order_materials om JOIN materials m ON m.id=om.material_id ORDER BY om.order_id, om.slot;
SELECT id, created_at, material_id, product_id, order_id, sale_id, quantity, reason FROM stock_movements ORDER BY id;
SELECT s.id, p.name, s.quantity, s.channel, s.unit_price, s.total_amount
FROM sales s JOIN products p ON p.id=s.product_id ORDER BY s.id;
SELECT channel, SUM(quantity) AS unidades, SUM(total_amount) AS faturamento_bruto FROM sales GROUP BY channel;
-- Resultado vazio indica saldos conciliados nas linhas consultadas.
SELECT m.id,m.stock_g,COALESCE(SUM(sm.quantity),0) AS saldo_historico
FROM materials m LEFT JOIN stock_movements sm ON sm.material_id=m.id
GROUP BY m.id HAVING m.stock_g<>COALESCE(SUM(sm.quantity),0);
SELECT p.id,p.stock_units,COALESCE(SUM(sm.quantity),0) AS saldo_historico
FROM products p LEFT JOIN stock_movements sm ON sm.product_id=p.id
GROUP BY p.id HAVING p.stock_units<>COALESCE(SUM(sm.quantity),0);
