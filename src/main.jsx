import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const labels = {
  dashboard: "Visão geral",
  materials: "Materiais",
  printers: "Impressoras",
  products: "Produtos",
  orders: "Produção",
  movements: "Movimentações",
};
const statuses = {
  disponivel: "Disponível",
  livre: "Livre",
  ocupada: "Ocupada",
  manutencao: "Em manutenção",
  planejada: "Planejada",
  em_producao: "Em produção",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
const fields = {
  materials: [
    ["brand", "Marca"],
    ["family", "Material (PLA, PETG…)"],
    ["color", "Cor"],
    ["cost_per_kg", "Custo por kg (R$)", "number"],
  ],
  printers: [
    ["code", "Código (ex.: Impressora 01)"],
    ["brand", "Marca"],
    ["model", "Modelo"],
    ["status", "Situação", "status"],
  ],
  products: [
    ["name", "Nome"],
    ["sku", "SKU"],
  ],
};
const initial = {
  materials: { brand: "", family: "PLA", color: "", cost_per_kg: "" },
  printers: { code: "", brand: "", model: "", status: "disponivel" },
  products: { name: "", sku: "" },
  entry: { material_id: "", quantity: "", reason: "" },
  order: {
    product_id: "",
    printer_id: "",
    quantity: "",
  },
  finish: { approved_quantity: "" },
};
const numeric = new Set([
  "cost_per_kg",
  "material_id",
  "printer_id",
  "product_id",
  "quantity",
  "planned_g",
  "actual_g",
  "approved_quantity",
]);
const number = (n) =>
  Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const money = (n) =>
  Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
async function api(path, method = "GET", body) {
  const response = await fetch("/api/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw Error(result.error || "Não foi possível concluir.");
  return result;
}
function App() {
  const emptyFilament = () => ({
    key: crypto.randomUUID(),
    brand: "",
    family: "",
    material_id: "",
    planned_g: "",
  });
  const [filaments, setFilaments] = useState([emptyFilament()]);
  const [consumptions, setConsumptions] = useState([]);
  const [printerModel, setPrinterModel] = useState("");
  const modelKey = (p) => JSON.stringify([p.brand, p.model]);
  const [page, setPage] = useState("dashboard"),
    [data, setData] = useState({
      materials: [],
      printers: [],
      products: [],
      orders: [],
      movements: [],
      dashboard: {},
    });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [form, setForm] = useState({}),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  async function refresh() {
    setLoading(true);
    try {
      const names = Object.keys(labels);
      const values = await Promise.all(names.map((n) => api(n)));
      setData(Object.fromEntries(names.map((n, i) => [n, values[i]])));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const dialog = document.querySelector("[role=dialog]");
    dialog?.querySelector("input,select,button")?.focus();
    const handler = (e) => {
      if (e.key === "Escape" && !busy) setModal(null);
      if (e.key === "Tab") {
        const items = [
          ...dialog.querySelectorAll("button:not(:disabled),input,select"),
        ];
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [modal, busy]);
  function open(kind, row = null) {
    if (kind === "finish")
      setConsumptions(row.materials.map((m) => ({ ...m, actual_g: "" })));
    if (kind === "order") {
      setFilaments([emptyFilament()]);
      setPrinterModel("");
      void refresh();
    }
    setError("");
    setNotice("");
    setModal({ kind, row });
    setForm(
      row && fields[kind]
        ? Object.fromEntries(fields[kind].map(([key]) => [key, row[key]]))
        : { ...initial[kind] },
    );
  }
  async function act(task) {
    setBusy(true);
    setError("");
    try {
      await task();
      setModal(null);
      await refresh();
      setNotice("Operação realizada com sucesso.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, numeric.has(k) ? Number(v) : v]),
    );
    const { kind, row } = modal;
    if (kind === "order")
      payload.materials = filaments.map((m) => ({
        material_id: Number(m.material_id),
        planned_g: Number(m.planned_g),
      }));
    if (kind === "finish")
      payload.materials = consumptions.map((m) => ({
        material_id: m.material_id,
        actual_g: Number(m.actual_g),
      }));
    await act(() =>
      kind === "entry"
        ? api("stock-entry", "POST", payload)
        : kind === "order"
          ? api("orders", "POST", payload)
          : kind === "finish"
            ? api(`orders/${row.id}/finish`, "POST", payload)
            : api(
                kind + (row ? "/" + row.id : ""),
                row ? "PUT" : "POST",
                payload,
              ),
    );
  }
  function input(key, label, type = "text", options = []) {
    return (
      <label key={key}>
        {label}
        {type === "select" || type === "status" ? (
          <select
            aria-label={label}
            required
            autoFocus={false}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          >
            {type === "select" && <option value="">Selecione…</option>}
            {(type === "status"
              ? [
                  { id: "disponivel", name: "Disponível" },
                  { id: "manutencao", name: "Em manutenção" },
                ]
              : options
            ).map((o) => (
              <option key={o.id} value={o.id} disabled={o.disabled}>
                {o.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            required
            type={type}
            min={
              type === "number"
                ? key === "cost_per_kg" || key === "approved_quantity"
                  ? 0
                  : ["quantity"].includes(key) && modal?.kind === "order"
                    ? 1
                    : 0.01
                : undefined
            }
            step={
              type === "number"
                ? key === "approved_quantity" ||
                  (key === "quantity" && modal?.kind === "order")
                  ? 1
                  : 0.01
                : undefined
            }
            maxLength={type === "text" ? 120 : undefined}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        )}
      </label>
    );
  }
  const filtered = (data[page] instanceof Array ? data[page] : []).filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );
  const actions = (row) => (
    <div className="actions">
      <button onClick={() => open(page, row)}>Editar</button>
      <button
        className="danger"
        onClick={() => {
          setError("");
          setModal({ kind: "delete", row });
        }}
      >
        Excluir
      </button>
    </div>
  );
  const materialOptions = data.materials.map((material) => ({
    id: material.id,
    name: `${material.brand} · ${material.family} · ${material.color}`,
  }));
  const badge = (status) => (
    <span className={"badge " + status}>{statuses[status] || status}</span>
  );
  return (
    <div className="layout">
      <aside>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("dashboard");
          }}
        >
          <img
            className="brand-logo"
            src="/brand/avs-labs-3d.png"
            alt="AVS Labs 3D"
          />
        </a>
        <nav aria-label="Navegação principal">
          {Object.entries(labels).map(([key, label], i) => (
            <button
              className={page === key ? "active" : ""}
              key={key}
              onClick={() => {
                setPage(key);
                setSearch("");
                setNotice("");
                setError("");
              }}
            >
              <span aria-hidden="true">
                {["◈", "▤", "▣", "◇", "▷", "⇄"][i]}
              </span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="dot" /> Gestão de estoque e produção
          <small>AVS Labs 3D</small>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">ESTOQUE & PRODUÇÃO</p>
            <h1>{labels[page]}</h1>
            <p className="muted">
              {page === "dashboard"
                ? "Do material à peça pronta, tudo sob controle."
                : "Organize sua operação de impressão 3D."}
            </p>
          </div>
          <div className="actions">
            {page === "materials" && (
              <button onClick={() => open("entry")}>Entrada de estoque</button>
            )}
            {fields[page] && (
              <button className="primary" onClick={() => open(page)}>
                + Novo cadastro
              </button>
            )}
            {page === "orders" && (
              <button className="primary" onClick={() => open("order")}>
                + Nova ordem
              </button>
            )}
          </div>
        </header>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="alert success" role="status">
            {notice}
          </div>
        )}
        {loading ? (
          <p role="status">Carregando dados…</p>
        ) : page === "dashboard" ? (
          <>
            <section className="stats">
              {[
                ["materials", "Materiais"],
                ["printers", "Impressoras"],
                ["products", "Produtos"],
                ["open_orders", "Ordens abertas"],
              ].map(([k, l]) => (
                <article key={k}>
                  <span>{l}</span>
                  <strong>{data.dashboard[k] ?? 0}</strong>
                </article>
              ))}
            </section>
            <section className="panel intro">
              <div>
                <p className="eyebrow">SUA LINHA DE PRODUÇÃO</p>
                <h2>Planeje, imprima e acompanhe!</h2>
                <p className="muted">
                  Cadastre materiais, registre entradas e acompanhe cada ordem
                  até a conclusão. O consumo e as peças aprovadas atualizam o
                  estoque juntos.
                </p>
                <button className="primary" onClick={() => setPage("orders")}>
                  Acessar produção →
                </button>
              </div>
              <img
                className="brand-symbol"
                src="/brand/simbolo-avs.png"
                alt="Símbolo AVS Labs 3D"
              />
            </section>
            <section className="panel">
              <h2>Como começar</h2>
              <ol className="steps">
                <li>Cadastre um material, uma impressora e um produto.</li>
                <li>Registre a entrada do filamento em gramas.</li>
                <li>Crie e inicie uma ordem de produção.</li>
                <li>Conclua informando consumo real e peças aprovadas.</li>
              </ol>
            </section>
          </>
        ) : (
          <section className="panel">
            <div className="table-toolbar">
              <h2>
                {labels[page]}{" "}
                <span className="muted">({filtered.length})</span>
              </h2>
              <input
                aria-label="Buscar registros"
                placeholder="Buscar registros…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={refresh}>Atualizar</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {(page === "materials"
                      ? [
                          "Marca",
                          "Material / Cor",
                          "Saldo",
                          "Custo/kg",
                          "Ações",
                        ]
                      : page === "printers"
                        ? ["Código", "Marca", "Modelo", "Situação", "Ações"]
                        : page === "products"
                          ? ["Produto", "SKU", "Estoque", "Ações"]
                          : page === "orders"
                            ? [
                                "Ordem / Produto",
                                "Impressora / Material",
                                "Quantidade",
                                "Consumo",
                                "Situação",
                                "Ações",
                              ]
                            : ["Data", "Item", "Movimento", "Motivo", "Ordem"]
                    ).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      {page === "materials" ? (
                        <>
                          <td>{row.brand}</td>
                          <td>
                            {row.family} / {row.color}
                          </td>
                          <td>{number(row.stock_g)} g</td>
                          <td>{money(row.cost_per_kg)}</td>
                          <td>{actions(row)}</td>
                        </>
                      ) : page === "printers" ? (
                        <>
                          <td>{row.code}</td>
                          <td>{row.brand}</td>
                          <td>{row.model}</td>
                          <td>{badge(row.availability)}</td>
                          <td>{actions(row)}</td>
                        </>
                      ) : page === "products" ? (
                        <>
                          <td>{row.name}</td>
                          <td>{row.sku}</td>
                          <td>{row.stock_units} un.</td>
                          <td>{actions(row)}</td>
                        </>
                      ) : page === "orders" ? (
                        <>
                          <td>
                            <strong>#{row.id}</strong> · {row.product_name}
                          </td>
                          <td>
                            {row.printer_name}
                            <small>
                              {row.printer_brand} · {row.printer_model}
                            </small>
                            {row.materials.map((m) => (
                              <small key={m.material_id}>
                                {m.brand} · {m.family} · {m.color} —{" "}
                                {number(m.actual_g ?? m.planned_g)} g
                              </small>
                            ))}
                          </td>
                          <td>
                            {row.quantity} planejadas
                            {row.approved_quantity !== null && (
                              <small>{row.approved_quantity} aprovadas</small>
                            )}
                          </td>
                          <td>
                            {number(row.actual_g ?? row.planned_g)} g
                            <small>
                              {row.actual_g === null
                                ? "Estimado"
                                : money(row.material_cost) + " em material"}
                            </small>
                          </td>
                          <td>{badge(row.status)}</td>
                          <td>
                            <div className="actions">
                              {row.status === "planejada" && (
                                <>
                                  <button
                                    disabled={busy}
                                    onClick={() =>
                                      act(() =>
                                        api(`orders/${row.id}/start`, "POST"),
                                      )
                                    }
                                  >
                                    Iniciar
                                  </button>
                                  <button
                                    disabled={busy}
                                    className="danger"
                                    onClick={() => {
                                      setError("");
                                      setModal({ kind: "cancel", row });
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                              {row.status === "cancelada" && (
                                <button
                                  className="danger"
                                  disabled={busy}
                                  onClick={() => {
                                    setError("");
                                    setModal({ kind: "delete-order", row });
                                  }}
                                >
                                  Apagar
                                </button>
                              )}
                              {row.status === "em_producao" && (
                                <button
                                  className="primary"
                                  onClick={() => open("finish", row)}
                                >
                                  Concluir
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            {new Date(row.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td>{row.item}</td>
                          <td
                            className={
                              Number(row.quantity) > 0 ? "positive" : "negative"
                            }
                          >
                            {Number(row.quantity) > 0 ? "+" : ""}
                            {number(row.quantity)}{" "}
                            {row.material_id ? "g" : "un."}
                          </td>
                          <td>{row.reason}</td>
                          <td>{row.order_id ? "#" + row.order_id : "—"}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="empty">
                  Nenhum registro encontrado.{" "}
                  {search
                    ? "Tente outra busca."
                    : "Comece pelos cadastros e pela entrada de materiais."}
                </div>
              )}
            </div>
          </section>
        )}
        <footer>AVS Labs 3D · Gestão de estoque e produção</footer>
      </main>
      {modal && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">
                {modal.kind === "delete-order"
                  ? "Apagar ordem cancelada"
                  : modal.kind === "delete"
                    ? "Excluir cadastro"
                    : modal.kind === "cancel"
                      ? "Cancelar ordem"
                      : modal.kind === "entry"
                        ? "Entrada de material"
                        : modal.kind === "order"
                          ? "Nova ordem de produção"
                          : modal.kind === "finish"
                            ? "Concluir produção"
                            : modal.row
                              ? "Editar cadastro"
                              : "Novo cadastro"}
              </h2>
              <button
                aria-label="Fechar"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>
            {error && (
              <div className="alert error" role="alert">
                {error}
              </div>
            )}
            {["delete", "cancel", "delete-order"].includes(modal.kind) ? (
              <>
                <p>
                  {modal.kind === "delete-order"
                    ? `Apagar definitivamente a ordem #${modal.row.id}? Ela será removida da lista.`
                    : modal.kind === "delete"
                      ? `Excluir “${modal.row.code ?? modal.row.brand ?? modal.row.name}”? Registros com histórico vinculado não podem ser excluídos.`
                      : `Cancelar a ordem #${modal.row.id}? Essa ação encerra o planejamento.`}
                </p>
                <div className="actions end">
                  <button disabled={busy} onClick={() => setModal(null)}>
                    Voltar
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() =>
                      act(() =>
                        modal.kind === "delete-order"
                          ? api(`orders/${modal.row.id}`, "DELETE")
                          : modal.kind === "delete"
                            ? api(`${page}/${modal.row.id}`, "DELETE")
                            : api(`orders/${modal.row.id}/cancel`, "POST"),
                      )
                    }
                  >
                    {busy ? "Aguarde…" : "Confirmar"}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={save}>
                {fields[modal.kind]?.map((f) => input(...f))}
                {modal.kind === "entry" && (
                  <>
                    {input(
                      "material_id",
                      "Material",
                      "select",
                      materialOptions,
                    )}
                    {input("quantity", "Quantidade (g)", "number")}
                    {input("reason", "Motivo da entrada")}
                  </>
                )}
                {modal.kind === "order" && (
                  <>
                    {input("product_id", "Produto", "select", data.products)}
                    <label>
                      Modelo da impressora
                      <select
                        aria-label="Modelo da impressora"
                        required
                        value={printerModel}
                        onChange={(e) => {
                          setPrinterModel(e.target.value);
                          setForm({ ...form, printer_id: "" });
                        }}
                      >
                        <option value="">Selecione o modelo…</option>
                        {[
                          ...new Map(
                            data.printers.map((p) => [modelKey(p), p]),
                          ).entries(),
                        ].map(([key, p]) => (
                          <option key={key} value={key}>
                            {p.brand} · {p.model}
                          </option>
                        ))}
                      </select>
                    </label>
                    {input(
                      "printer_id",
                      "Impressora",
                      "select",
                      data.printers
                        .filter((p) => modelKey(p) === printerModel)
                        .map((p) => ({
                          id: p.id,
                          name:
                            p.code +
                            (p.availability !== "livre"
                              ? ` — ${statuses[p.availability]}`
                              : ""),
                          disabled: p.availability !== "livre",
                        })),
                    )}
                    {printerModel &&
                      !data.printers.some(
                        (p) =>
                          modelKey(p) === printerModel &&
                          p.availability === "livre",
                      ) && (
                        <p className="muted">
                          Nenhuma impressora livre deste modelo. Impressoras
                          ocupadas são liberadas automaticamente ao concluir a
                          produção.
                        </p>
                      )}
                    {input("quantity", "Quantidade de peças", "number")}
                    <div className="filaments-heading">
                      <h3>Filamentos da produção</h3>
                      <small>Até 4 cores por ordem</small>
                    </div>
                    {filaments.map((line, index) => {
                      const update = (changes) =>
                        setFilaments((current) =>
                          current.map((m) =>
                            m.key === line.key ? { ...m, ...changes } : m,
                          ),
                        );
                      const choose = (label, value, options, onChange) => (
                        <label>
                          {label}
                          <select
                            aria-label={`${label} do filamento ${index + 1}`}
                            required
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                          >
                            <option value="">Selecione…</option>
                            {options.map((o) => (
                              <option
                                key={o.id}
                                value={o.id}
                                disabled={o.disabled}
                              >
                                {o.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                      return (
                        <fieldset className="filament-row" key={line.key}>
                          <legend>Filamento {index + 1}</legend>
                          {choose(
                            "Marca",
                            line.brand,
                            [
                              ...new Set(data.materials.map((m) => m.brand)),
                            ].map((v) => ({ id: v, name: v })),
                            (brand) =>
                              update({ brand, family: "", material_id: "" }),
                          )}
                          {choose(
                            "Material",
                            line.family,
                            [
                              ...new Set(
                                data.materials
                                  .filter((m) => m.brand === line.brand)
                                  .map((m) => m.family),
                              ),
                            ].map((v) => ({ id: v, name: v })),
                            (family) => update({ family, material_id: "" }),
                          )}
                          {choose(
                            "Cor",
                            line.material_id,
                            data.materials
                              .filter(
                                (m) =>
                                  m.brand === line.brand &&
                                  m.family === line.family,
                              )
                              .map((m) => ({
                                id: m.id,
                                name: m.color,
                                disabled: filaments.some(
                                  (other) =>
                                    other.key !== line.key &&
                                    Number(other.material_id) === m.id,
                                ),
                              })),
                            (material_id) => update({ material_id }),
                          )}
                          {line.material_id && (
                            <p className="muted">
                              Saldo disponível:{" "}
                              {number(
                                data.materials.find(
                                  (m) => m.id === Number(line.material_id),
                                )?.stock_g ?? 0,
                              )}{" "}
                              g
                            </p>
                          )}
                          <label>
                            Consumo estimado (g)
                            <input
                              aria-label={`Consumo estimado do filamento ${index + 1} (g)`}
                              required
                              type="number"
                              min="0.01"
                              max="10000000"
                              step="0.01"
                              value={line.planned_g}
                              onChange={(e) =>
                                update({ planned_g: e.target.value })
                              }
                            />
                          </label>
                          {filaments.length > 1 && (
                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                setFilaments((current) =>
                                  current.filter((m) => m.key !== line.key),
                                )
                              }
                            >
                              Remover filamento {index + 1}
                            </button>
                          )}
                        </fieldset>
                      );
                    })}
                    <button
                      type="button"
                      disabled={filaments.length >= 4}
                      onClick={() =>
                        setFilaments((current) => [...current, emptyFilament()])
                      }
                    >
                      + Adicionar filamento
                    </button>
                    <p className="muted">
                      O material será descontado ao concluir a produção. Não há
                      reserva de estoque.
                    </p>
                  </>
                )}
                {modal.kind === "finish" && (
                  <>
                    <p>
                      {modal.row.quantity} peças planejadas. Informe zero
                      aprovadas em caso de falha total.
                    </p>
                    {consumptions.map((line, index) => (
                      <fieldset className="filament-row" key={line.material_id}>
                        <legend>Filamento {index + 1}</legend>
                        <p>
                          {line.brand} · {line.family} · {line.color}
                        </p>
                        <small>Estimado: {number(line.planned_g)} g</small>
                        <label>
                          Consumo real (g)
                          <input
                            aria-label={`Consumo real do filamento ${index + 1} (g)`}
                            required
                            type="number"
                            min="0"
                            max="10000000"
                            step="0.01"
                            value={line.actual_g}
                            onChange={(e) =>
                              setConsumptions((current) =>
                                current.map((m) =>
                                  m.material_id === line.material_id
                                    ? { ...m, actual_g: e.target.value }
                                    : m,
                                ),
                              )
                            }
                          />
                        </label>
                      </fieldset>
                    ))}
                    {input("approved_quantity", "Peças aprovadas", "number")}
                  </>
                )}
                <div className="actions end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setModal(null)}
                  >
                    Voltar
                  </button>
                  <button className="primary" disabled={busy}>
                    {busy ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
