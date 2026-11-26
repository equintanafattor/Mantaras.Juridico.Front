// QA real del filtro "Juzgado" del listado de expedientes judiciales contra la API aislada (:5099).
// Uso: QA_EMAIL=... QA_PASSWORD=... CHROMIUM_PATH=... node filtro-juzgado.mjs <carpeta-capturas>
// Crea sus propios datos (marcados con un sello por corrida) en la base aislada.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000", API = "http://localhost:5099";
const OUT = path.resolve(process.argv[2] ?? "capturas-filtro"); fs.mkdirSync(OUT, { recursive: true });
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD }) });
if (!login.ok) throw new Error(`Login falló: ${login.status}`);
const sesion = await login.json();
const H = { Authorization: `Bearer ${sesion.accessToken}`, "Content-Type": "application/json" };
const api = async (url, init = {}) => { const r = await fetch(`${API}${url}`, { ...init, headers: H }); const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : null }; };
const resultados = [];
const ok = (nombre, cond, detalle = "") => { resultados.push({ nombre, ok: !!cond, detalle }); console.log(`${cond ? "OK  " : "FAIL"} ${nombre}${detalle ? " — " + detalle : ""}`); };
const hasta = async (fn, ms = 10000) => { const fin = Date.now() + ms; let v; while (Date.now() < fin) { v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 150)); } return v; };
const sello = Date.now().toString(36).toUpperCase().slice(-6);
const total = async (q) => (await api(`/api/expedientes?page=1&pageSize=10&${q}`)).body.totalItems;

// ---------- Datos propios en la base aislada ----------
const crearJuzgado = async (nombre) => { const r = await api("/api/juzgados", { method: "POST", body: JSON.stringify({ nombre }) }); if (r.status !== 201) throw new Error(`juzgado ${r.status}`); return r.body; };
const A = await crearJuzgado(`Juzgado Filtro QA ${sello}`);
const B = await crearJuzgado(`Juzgado Filtro QA Inactivo ${sello}`);
const caso = (await api("/api/expedientes/1")).body; // principal del caso 1: los nuevos se cuelgan como incidentes
const crearExp = async (caratula, juzgadoId) => {
  const r = await api("/api/expedientes", { method: "POST", body: JSON.stringify({ casoIds: caso.casos.map((c) => c.casoId), expedientePadreId: caso.expedienteId, tipoExpediente: "Incidente", numeroExpediente: null, caratula, juzgadoId, fechaInicio: null, estadoLegal: null, tipoTramite: null }) });
  if (r.status !== 201) throw new Error(`expediente ${r.status} ${JSON.stringify(r.body)}`); return r.body;
};
const deA = [];
for (let i = 1; i <= 12; i++) deA.push(await crearExp(`PRUEBA FILTRO JZ ${sello} ${String(i).padStart(2, "0")}`, A.juzgadoId));
const deB = await crearExp(`PRUEBA FILTRO JZ ${sello} INACTIVO`, B.juzgadoId);
await api(`/api/expedientes/${deA[11].expedienteId}`, { method: "DELETE" }); // uno de A dado de baja
await api(`/api/juzgados/${B.juzgadoId}`, { method: "DELETE" });            // B queda inactivo
console.log(`Datos: juzgados A=${A.juzgadoId} B=${B.juzgadoId} (inactivo); 12 expedientes en A (1 de baja), 1 en B; sello ${sello}`);

// Esperado según la API (fuente de verdad del filtro en el servidor).
const esp = {
  aActivos: await total(`juzgadoId=${A.juzgadoId}&soloActivos=true`),
  aTodos: await total(`juzgadoId=${A.juzgadoId}&soloActivos=false`),
  b: await total(`juzgadoId=${B.juzgadoId}&soloActivos=true`),
  aBusqueda: await total(`juzgadoId=${A.juzgadoId}&soloActivos=true&busqueda=${encodeURIComponent(`${sello} 03`)}`),
  sinFiltro: await total("soloActivos=true"),
};
console.log("Esperado (API):", JSON.stringify(esp));
ok("API: el filtro A cuenta solo sus expedientes activos", esp.aActivos === 11, String(esp.aActivos));
ok("API: A con inactivos incluye el dado de baja", esp.aTodos === 12, String(esp.aTodos));
ok("API: filtra por un juzgado inactivo", esp.b === 1, String(esp.b));

// ---------- Interfaz ----------
async function circuito(etiqueta, vp, movil) {
  console.log(`\n===== ${etiqueta} (${vp.width}x${vp.height}) =====`);
  const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const ctx = await nav.newContext({ viewport: vp, hasTouch: movil, isMobile: movil, deviceScaleFactor: 1, locale: "es-AR" });
  await ctx.addInitScript((s) => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  const page = await ctx.newPage();
  const t = (s) => `[${etiqueta}] ${s}`;
  const pedidos = [];
  page.on("request", (req) => { const u = new URL(req.url()); if (req.method() === "GET" && u.pathname === "/api/expedientes") pedidos.push(Object.fromEntries(u.searchParams)); });
  const ultimo = () => pedidos.at(-1) ?? {};
  // Con staleTime global de 30 s, volver a "sin filtros" puede servirse desde la caché sin pedir de nuevo:
  // se verifica que no salga ninguna petición con juzgadoId y que el total sea el del servidor sin filtros.
  const sinJuzgadoDesde = (n) => pedidos.slice(n).every((q) => !("juzgadoId" in q));
  const filtro = page.getByRole("combobox", { name: "Filtrar por juzgado" });
  const lista = page.getByRole("listbox", { name: "Juzgados" });
  const pie = page.locator("footer").filter({ hasText: /expedientes? judicial/ }).last();
  const textoPie = () => pie.innerText().catch(() => "");
  const esperarPie = (re) => hasta(async () => re.test(await textoPie()));
  const filasVisibles = () => page.getByText(new RegExp(`PRUEBA FILTRO JZ ${sello}`)).locator("visible=true").count();
  async function elegir(termino, nombre) {
    await filtro.click(); await filtro.fill(termino);
    await lista.getByRole("option").filter({ hasText: nombre }).first().click();
  }

  await page.goto(`${BASE}/expedientes`); await page.waitForLoadState("networkidle");
  await hasta(() => filtro.isEnabled());
  ok(t("inicial: muestra Todos los juzgados"), (await filtro.inputValue()) === "Todos los juzgados");
  ok(t("inicial: no envía juzgadoId"), !("juzgadoId" in ultimo()));
  ok(t("sin scroll horizontal"), await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: `${OUT}/${vp.width}_01-inicial.png`, fullPage: !movil });

  // Búsqueda en el selector, con inactivos identificados.
  await filtro.click();
  ok(t("lista: primera opción Todos los juzgados"), (await lista.getByRole("option").first().innerText()).includes("Todos los juzgados"));
  await filtro.fill(sello.toLowerCase());
  await hasta(async () => (await lista.getByRole("option").count()) === 2);
  ok(t("búsqueda: encuentra A y B"), (await lista.getByRole("option").count()) === 2);
  ok(t("búsqueda: B marcado Inactivo"), await lista.getByRole("option").filter({ hasText: B.nombre }).getByText("Inactivo", { exact: true }).isVisible());
  ok(t("lista abierta sin scroll horizontal"), await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: `${OUT}/${vp.width}_02-busqueda.png`, fullPage: !movil });
  await filtro.fill("zzz-no-existe");
  ok(t("búsqueda: sin coincidencias"), await page.getByText("Ningún juzgado coincide").isVisible());
  await filtro.press("Escape");

  // Selección de A: filtra en el servidor y pagina.
  await elegir(`filtro qa ${sello.toLowerCase()}`, A.nombre);
  await esperarPie(new RegExp(`${esp.aActivos} expedientes judiciales · Página 1 de 2`));
  ok(t("selección A: envía juzgadoId y page=1"), ultimo().juzgadoId === String(A.juzgadoId) && ultimo().page === "1", JSON.stringify(ultimo()));
  ok(t("selección A: total y páginas del servidor"), /Página 1 de 2/.test(await textoPie()) && (await textoPie()).includes(`${esp.aActivos} expedientes`), await textoPie());
  ok(t("selección A: 10 filas de la página 1"), (await filasVisibles()) === 10, String(await filasVisibles()));
  ok(t("selección A: el selector muestra el elegido"), (await filtro.inputValue()) === A.nombre);
  await page.screenshot({ path: `${OUT}/${vp.width}_03-filtro-a.png`, fullPage: !movil });

  await pie.getByRole("button", { name: "Siguiente" }).click();
  await esperarPie(/Página 2 de 2/);
  ok(t("paginación: page=2 mantiene juzgadoId"), ultimo().page === "2" && ultimo().juzgadoId === String(A.juzgadoId), JSON.stringify(ultimo()));
  ok(t("paginación: la página 2 trae el resto"), (await filasVisibles()) === esp.aActivos - 10, String(await filasVisibles()));

  // Cambio de selección desde la página 2: vuelve a la primera.
  await elegir(`inactivo ${sello.toLowerCase()}`, B.nombre);
  await esperarPie(/^1 expediente judicial/);
  ok(t("cambio de selección: vuelve a page=1"), ultimo().page === "1" && ultimo().juzgadoId === String(B.juzgadoId), JSON.stringify(ultimo()));
  ok(t("juzgado inactivo: filtra sus expedientes"), (await textoPie()).startsWith(`${esp.b} expediente judicial`), await textoPie());
  ok(t("juzgado inactivo: el selector lo marca"), (await filtro.inputValue()) === `${B.nombre} (inactivo)`);

  // Combinación con los filtros existentes.
  await elegir(`filtro qa ${sello.toLowerCase()}`, A.nombre);
  await esperarPie(/Página 1 de 2/);
  await page.getByLabel("Incluir inactivos").check();
  await esperarPie(new RegExp(`^${esp.aTodos} expedientes`));
  ok(t("combinación: + incluir inactivos"), ultimo().soloActivos === "false" && ultimo().juzgadoId === String(A.juzgadoId) && (await textoPie()).startsWith(`${esp.aTodos} expedientes`), await textoPie());
  await page.getByLabel("Incluir inactivos").uncheck();
  await page.getByLabel("Buscar expedientes judiciales").fill(`${sello} 03`);
  await esperarPie(/^1 expediente judicial/);
  ok(t("combinación: + búsqueda"), ultimo().busqueda === `${sello} 03` && ultimo().juzgadoId === String(A.juzgadoId) && (await textoPie()).startsWith(`${esp.aBusqueda} expediente`), JSON.stringify(ultimo()));
  await page.getByLabel("Buscar expedientes judiciales").fill("");
  const select = page.getByLabel("Filtrar por expediente administrativo");
  await select.selectOption(String(caso.casos[0].casoId));
  await esperarPie(/Página 1 de 2/);
  ok(t("combinación: + expediente administrativo propio"), ultimo().casoId === String(caso.casos[0].casoId) && ultimo().juzgadoId === String(A.juzgadoId), JSON.stringify(ultimo()));
  const otroCaso = await select.locator("option").evaluateAll((os, id) => os.map((o) => o.value).find((v) => v && v !== id), String(caso.casos[0].casoId));
  await select.selectOption(otroCaso);
  const vacio = page.getByText("No se encontraron expedientes judiciales");
  await vacio.waitFor({ timeout: 10000 }).catch(() => {});
  ok(t("resultados vacíos: mensaje con Limpiar filtros"), await vacio.isVisible() && await page.getByRole("button", { name: "Limpiar filtros" }).isVisible(), JSON.stringify(ultimo()));
  await page.screenshot({ path: `${OUT}/${vp.width}_04-vacio.png`, fullPage: !movil });

  // Limpiar filtros incluye el juzgado.
  let marca = pedidos.length;
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await hasta(async () => (await filtro.inputValue()) === "Todos los juzgados");
  await esperarPie(new RegExp(`^${esp.sinFiltro} expedientes`));
  await page.waitForTimeout(1000);
  ok(t("limpiar: vuelve a Todos los juzgados"), (await filtro.inputValue()) === "Todos los juzgados");
  ok(t("limpiar: no vuelve a pedir con juzgadoId ni casoId"), pedidos.slice(marca).every((q) => !("juzgadoId" in q) && !("casoId" in q)), `${pedidos.length - marca} petición(es) nuevas`);
  ok(t("limpiar: total sin filtros"), (await textoPie()).startsWith(`${esp.sinFiltro} expedientes`), await textoPie());

  // "Limpiar" de la barra también lo incluye; "Todos los juzgados" desde la lista quita el filtro.
  await elegir(`filtro qa ${sello.toLowerCase()}`, A.nombre); await esperarPie(/Página 1 de 2/);
  marca = pedidos.length;
  await page.getByRole("button", { name: "Limpiar", exact: true }).click();
  await hasta(async () => (await filtro.inputValue()) === "Todos los juzgados");
  await esperarPie(new RegExp(`^${esp.sinFiltro} expedientes`)); await page.waitForTimeout(1000);
  ok(t("limpiar (barra): quita el juzgado"), (await filtro.inputValue()) === "Todos los juzgados" && sinJuzgadoDesde(marca) && (await textoPie()).startsWith(`${esp.sinFiltro} expedientes`), await textoPie());
  await elegir(`filtro qa ${sello.toLowerCase()}`, A.nombre); await esperarPie(/Página 1 de 2/);
  marca = pedidos.length;
  await filtro.click(); await lista.getByRole("option").first().click();
  await esperarPie(new RegExp(`^${esp.sinFiltro} expedientes`)); await page.waitForTimeout(1000);
  ok(t("opción Todos los juzgados: quita el filtro"), sinJuzgadoDesde(marca) && (await filtro.inputValue()) === "Todos los juzgados" && (await textoPie()).startsWith(`${esp.sinFiltro} expedientes`), await textoPie());

  // Error de carga del catálogo y reintento.
  await page.route("**/api/juzgados?*", (route) => route.abort());
  await page.goto(`${BASE}/expedientes`);
  await page.getByText("No pudimos cargar los juzgados para el filtro").waitFor({ timeout: 25000 });
  ok(t("error de catálogo: aviso con Reintentar y listado utilizable"), await page.getByRole("button", { name: "Reintentar" }).first().isVisible() && (await textoPie()).length > 0);
  await page.screenshot({ path: `${OUT}/${vp.width}_05-error.png`, fullPage: !movil });
  await page.unroute("**/api/juzgados?*");
  await page.getByText("No pudimos cargar los juzgados para el filtro").locator("..").getByRole("button", { name: "Reintentar" }).click();
  ok(t("error de catálogo: el reintento recupera el filtro"), !!(await hasta(() => filtro.isEnabled(), 20000)));
  await nav.close();
}

try {
  await circuito("Escritorio", { width: 1440, height: 900 }, false);
  await circuito("Celular", { width: 390, height: 844 }, true);
  await circuito("Tablet", { width: 768, height: 1024 }, true);
} finally {
  fs.writeFileSync(path.join(OUT, "..", "resultados-filtro.json"), JSON.stringify({ fecha: new Date().toISOString(), sello, datos: { juzgadoA: A.juzgadoId, juzgadoB: B.juzgadoId, expedientes: [...deA, deB].map((e) => e.expedienteId) }, esperado: esp, resultados }, null, 2));
}
const fallas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallas.length}/${resultados.length} OK`);
process.exit(fallas.length ? 1 : 0);
