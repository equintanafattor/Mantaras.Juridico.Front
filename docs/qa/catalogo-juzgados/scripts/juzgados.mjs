// QA real del catálogo de Juzgados contra la API aislada (:5099, base mantaras_juridico_test_juzgados).
// Uso: QA_EMAIL=... QA_PASSWORD=... CHROMIUM_PATH=... node juzgados.mjs <carpeta-capturas>
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000", API = "http://localhost:5099";
const OUT = path.resolve(process.argv[2] ?? "capturas"); fs.mkdirSync(OUT, { recursive: true });
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD }) });
if (!login.ok) throw new Error(`Login falló: ${login.status}`);
const sesion = await login.json();
const H = { Authorization: `Bearer ${sesion.accessToken}`, "Content-Type": "application/json" };
const api = async (url, init = {}) => { const r = await fetch(`${API}${url}`, { ...init, headers: H }); return { status: r.status, body: r.status === 204 ? null : await r.json() }; };
const resultados = [];
const ok = (nombre, cond, detalle = "") => { resultados.push({ nombre, ok: !!cond, detalle }); console.log(`${cond ? "OK  " : "FAIL"} ${nombre}${detalle ? " — " + detalle : ""}`); };
const sello = Date.now().toString().slice(-6);

// Datos de prueba: expedientes "PRUEBA JZ" activos con juzgado migrado.
// Los "PRUEBA JZ" no tienen administrativo vinculado (el formulario exige uno): se editan expedientes del clon con caso y juzgado migrado.
const detalle = async (id) => (await api(`/api/expedientes/${id}`)).body;
const [exp1, exp7, exp2] = await Promise.all([detalle(1), detalle(7), detalle(2)]);
for (const e of [exp1, exp7, exp2]) if (!e.casos.length || e.juzgadoId === null || !e.juzgadoActivo) throw new Error(`Expediente ${e.expedienteId} sin caso o sin juzgado activo`);
const originales = [exp1, exp7, exp2].map((e) => ({ id: e.expedienteId, juzgadoId: e.juzgadoId }));
const hasta = async (fn, ms = 8000) => { const fin = Date.now() + ms; let v; while (Date.now() < fin) { v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 150)); } return v; };

async function contexto(vp, movil) {
  const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const ctx = await nav.newContext({ viewport: vp, hasTouch: movil, isMobile: movil, deviceScaleFactor: 1, locale: "es-AR" });
  await ctx.addInitScript((s) => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  return { nav, ctx };
}
const sinScrollHorizontal = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const esperarRed = (page) => page.waitForLoadState("networkidle");

function capturarEnvios(page) {
  const envios = [];
  page.on("response", async (res) => {
    const req = res.request();
    if (!/\/api\/(expedientes|casos\/con-expediente-principal)(\/\d+)?$/.test(new URL(req.url()).pathname)) return;
    if (!["POST", "PUT"].includes(req.method())) return;
    let body = null; try { body = await res.json(); } catch {}
    envios.push({ metodo: req.method(), url: req.url(), request: req.postDataJSON(), status: res.status(), body });
  });
  return envios;
}
const ultimoEnvio = async (envios, metodo, desde) => {
  for (let i = 0; i < 50 && envios.length <= desde; i++) await new Promise((r) => setTimeout(r, 200));
  return envios.slice(desde).filter((e) => e.metodo === metodo).at(-1);
};

const panel = (page) => page.locator("section").filter({ has: page.getByRole("heading", { name: "Juzgados", exact: true }) });
async function irCatalogo(page) { await page.goto(`${BASE}/catalogos`); await esperarRed(page); const p = panel(page); await p.scrollIntoViewIfNeeded(); return p; }
async function buscarEnPanel(p, texto, incluirInactivos = false) {
  const check = p.getByLabel("Incluir inactivos");
  if ((await check.isChecked()) !== incluirInactivos) await check.click();
  await p.getByLabel("Buscar en Juzgados").fill(texto);
  await p.page().waitForTimeout(700); await esperarRed(p.page());
}
async function confirmar(page) { const d = page.getByRole("dialog"); await d.getByRole("button", { name: "Confirmar" }).click(); await d.waitFor({ state: "hidden" }); await esperarRed(page); }
const combo = (page) => page.getByRole("combobox", { name: "Juzgado" });
async function editarExpediente(page, id) {
  await page.goto(`${BASE}/expedientes/${id}`); await esperarRed(page);
  await page.getByRole("button", { name: "Editar expediente judicial" }).click();
  await combo(page).waitFor(); await page.waitForFunction(() => !document.querySelector("[role=combobox]")?.disabled, null, { timeout: 15000 });
}
async function guardarEdicion(page) { await page.getByRole("button", { name: "Guardar cambios" }).click(); await page.getByRole("button", { name: "Editar expediente judicial" }).waitFor({ timeout: 15000 }); await esperarRed(page); }
const encabezado = (page) => page.locator("h1").locator("xpath=following-sibling::p[1]").innerText();
const datoJuzgado = (page) => page.getByText("Juzgado o tribunal", { exact: true }).locator("xpath=..").innerText();

async function circuito(etiqueta, vp, movil, expediente, otro) {
  console.log(`\n===== ${etiqueta} (${vp.width}x${vp.height}) =====`);
  const { nav, ctx } = await contexto(vp, movil); const page = await ctx.newPage(); const envios = capturarEnvios(page);
  const t = (s) => `[${etiqueta}] ${s}`;
  const nombre = `Juzgado QA Front ${etiqueta} ${sello}`, nombreNorm = nombre.toUpperCase();
  const renombre = `${nombre} Paraná editado`, renombreNorm = renombre.toUpperCase();

  // ---- Catálogo: alta, duplicado, edición, baja, duplicado contra inactivo, restauración ----
  let p = await irCatalogo(page);
  await page.screenshot({ path: `${OUT}/${vp.width}_01-catalogo.png`, fullPage: true });
  ok(t("catálogo sin scroll horizontal"), await sinScrollHorizontal(page));
  await p.getByLabel("Nuevo nombre").fill(`  ${nombre.toLowerCase()}   `);
  await p.getByRole("button", { name: "Agregar" }).click(); await esperarRed(page);
  ok(t("alta: mensaje de guardado"), await p.getByText(/Juzgado guardado/).waitFor({ timeout: 8000 }).then(() => true, () => false));
  await buscarEnPanel(p, nombre);
  ok(t("alta: listado muestra el nombre normalizado en mayúsculas"), await p.getByText(nombreNorm, { exact: true }).isVisible());
  const creado = (await api(`/api/juzgados?soloActivos=false&busqueda=${encodeURIComponent(nombre)}`)).body.items.find((j) => j.nombre === nombreNorm);
  ok(t("alta: persistido en la API"), creado?.activo === true, creado ? `juzgadoId ${creado.juzgadoId}` : "no encontrado");

  await p.getByLabel("Nuevo nombre").fill(nombre.toLowerCase().replace(/ /g, "  "));
  await p.getByRole("button", { name: "Agregar" }).click(); await esperarRed(page);
  const errDup = p.getByRole("alert").filter({ hasText: "Ya existe un juzgado" });
  ok(t("duplicado (mayúsculas/espacios): rechazado con 409"), await errDup.isVisible(), await errDup.innerText().catch(() => ""));
  await page.screenshot({ path: `${OUT}/${vp.width}_02-duplicado.png`, fullPage: true });

  await p.getByLabel("Nuevo nombre").fill("");
  await p.getByRole("button", { name: `Editar ${nombreNorm}` }).click();
  await p.getByLabel(`Editar: ${nombreNorm}`).fill(renombre);
  await p.getByRole("button", { name: "Guardar cambios" }).click(); await esperarRed(page);
  await buscarEnPanel(p, renombre);
  ok(t("edición: listado muestra el nombre nuevo"), await p.getByText(renombreNorm, { exact: true }).isVisible());

  await p.getByRole("button", { name: `Desactivar ${renombreNorm}` }).click();
  await page.screenshot({ path: `${OUT}/${vp.width}_03-confirmar-baja.png` });
  await confirmar(page);
  ok(t("baja: deja de figurar entre activos"), await p.getByText(renombreNorm, { exact: true }).count() === 0);
  await buscarEnPanel(p, renombre, true);
  ok(t("baja: figura como Inactivo al incluir inactivos"), await p.locator("li").filter({ hasText: renombreNorm }).getByText("Inactivo", { exact: true }).isVisible());

  await p.getByLabel("Nuevo nombre").fill(renombre);
  await p.getByRole("button", { name: "Agregar" }).click(); await esperarRed(page);
  ok(t("duplicado contra inactivo: rechazado"), await p.getByRole("alert").filter({ hasText: "Ya existe un juzgado" }).isVisible());
  await p.getByLabel("Nuevo nombre").fill("");

  await p.getByRole("button", { name: `Reactivar ${renombreNorm}` }).click(); await confirmar(page);
  ok(t("restauración: vuelve a Activo"), await p.locator("li").filter({ hasText: renombreNorm }).getByText("Activo", { exact: true }).isVisible());
  ok(t("restauración: persistida en la API"), (await api(`/api/juzgados/${creado.juzgadoId}`)).body.activo === true);

  await buscarEnPanel(p, "zzz-no-existe-zzz", true);
  ok(t("estado vacío del listado"), await p.getByText("No hay registros para estos filtros").isVisible());

  // ---- Migración: variante "minúsculas y acento" unificada (solo lectura) ----
  await page.goto(`${BASE}/expedientes/10`); await esperarRed(page);
  ok(t("migración: PRUEBA JZ 03 muestra el juzgado unificado"), (await datoJuzgado(page)).includes("JUZGADO FEDERAL N° 2 DE PARANÁ"));
  await page.goto(`${BASE}/expedientes/14`); await esperarRed(page);
  ok(t("migración: PRUEBA JZ 07 (null) sin juzgado"), (await encabezado(page)).includes("Juzgado no informado"));

  // ---- Expediente: precarga del migrado ----
  await page.goto(`${BASE}/expedientes/${expediente.expedienteId}`); await esperarRed(page);
  ok(t("detalle: encabezado muestra el juzgado migrado"), (await encabezado(page)).includes(expediente.juzgadoNombre), expediente.juzgadoNombre);
  ok(t("detalle: dato Juzgado muestra el migrado"), (await datoJuzgado(page)).includes(expediente.juzgadoNombre));
  await editarExpediente(page, expediente.expedienteId);
  ok(t("edición: precarga el juzgado migrado"), (await combo(page).inputValue()) === expediente.juzgadoNombre, await combo(page).inputValue());

  // ---- Selección con búsqueda (minúsculas y sin tilde) ----
  await combo(page).click();
  const termino = `qa front ${etiqueta.toLowerCase()} ${sello} parana`;
  await combo(page).fill(termino);
  const opciones = page.getByRole("listbox", { name: "Juzgados" }).getByRole("option");
  await hasta(async () => (await opciones.count()) === 1);
  ok(t("búsqueda: encuentra sin distinguir mayúsculas ni tildes"), (await opciones.count()) === 1 && (await opciones.first().innerText()).includes(renombreNorm), `${await opciones.count()} opción(es)`);
  ok(t("selector abierto sin scroll horizontal"), await sinScrollHorizontal(page));
  await page.screenshot({ path: `${OUT}/${vp.width}_04-busqueda-selector.png`, fullPage: !movil });
  await combo(page).fill("zzz-no-existe");
  ok(t("búsqueda: estado sin resultados"), await page.getByText("Ningún juzgado activo coincide").isVisible());
  await combo(page).fill(termino); await combo(page).press("ArrowDown"); await combo(page).press("ArrowUp"); await combo(page).press("Enter");
  ok(t("selección con teclado"), (await combo(page).inputValue()) === renombreNorm);
  let desde = envios.length; await guardarEdicion(page);
  let put = await ultimoEnvio(envios, "PUT", desde);
  ok(t("PUT envía juzgadoId del elegido"), put?.request?.juzgadoId === creado.juzgadoId && !("juzgado" in put.request), JSON.stringify({ juzgadoId: put?.request?.juzgadoId, status: put?.status }));
  ok(t("detalle muestra el juzgado elegido"), (await datoJuzgado(page)).includes(renombreNorm));

  // ---- Nombre actualizado en detalle y listados tras renombrar ----
  const renombre2 = `${renombre} bis`, renombre2Norm = renombre2.toUpperCase();
  p = await irCatalogo(page); await buscarEnPanel(p, renombre);
  await p.getByRole("button", { name: `Editar ${renombreNorm}` }).click();
  await p.getByLabel(`Editar: ${renombreNorm}`).fill(renombre2);
  await p.getByRole("button", { name: "Guardar cambios" }).click(); await esperarRed(page);
  await page.goto(`${BASE}/expedientes/${expediente.expedienteId}`); await esperarRed(page);
  ok(t("renombre: encabezado del detalle"), (await encabezado(page)).includes(renombre2Norm));
  ok(t("renombre: dato del detalle"), (await datoJuzgado(page)).includes(renombre2Norm));
  const casoId = expediente.casos[0]?.casoId;
  await page.goto(`${BASE}/casos/${casoId}`); await esperarRed(page);
  ok(t("renombre: detalle del expediente administrativo"), await page.getByText(renombre2Norm).first().isVisible().catch(() => false));
  await page.goto(`${BASE}/expedientes`); await esperarRed(page);
  await page.getByPlaceholder(/Buscar por número, carátula, juzgado/).fill(renombre2Norm.toLowerCase());
  await page.waitForTimeout(800); await esperarRed(page);
  ok(t("renombre: listado de expedientes lo encuentra por juzgado"), !!(await hasta(() => page.getByText(expediente.caratula).locator("visible=true").count())), expediente.caratula);
  await page.screenshot({ path: `${OUT}/${vp.width}_05-listado-busqueda-juzgado.png`, fullPage: !movil });

  // ---- Juzgado inactivo: se conserva al editar y no se ofrece para nuevas asignaciones ----
  p = await irCatalogo(page); await buscarEnPanel(p, renombre2);
  await p.getByRole("button", { name: `Desactivar ${renombre2Norm}` }).click(); await confirmar(page);
  await page.goto(`${BASE}/expedientes/${expediente.expedienteId}`); await esperarRed(page);
  ok(t("inactivo: detalle lo marca (inactivo)"), (await datoJuzgado(page)).includes(`${renombre2Norm} (inactivo)`));
  await editarExpediente(page, expediente.expedienteId);
  ok(t("inactivo: precargado en edición"), (await combo(page).inputValue()) === `${renombre2Norm} (inactivo)`);
  await combo(page).click();
  ok(t("inactivo: ofrecido como valor guardado"), await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").filter({ hasText: "Inactivo · valor guardado" }).isVisible());
  await page.screenshot({ path: `${OUT}/${vp.width}_06-inactivo-conservado.png`, fullPage: !movil });
  await combo(page).press("Escape");
  desde = envios.length; await page.getByLabel("Carátula").fill(`${expediente.caratula}`); await guardarEdicion(page);
  put = await ultimoEnvio(envios, "PUT", desde);
  ok(t("inactivo: PUT conserva el mismo id y responde 200"), put?.request?.juzgadoId === creado.juzgadoId && put?.status === 200, JSON.stringify({ juzgadoId: put?.request?.juzgadoId, status: put?.status, juzgadoActivo: put?.body?.juzgadoActivo }));

  await editarExpediente(page, otro.expedienteId);
  await combo(page).click(); await combo(page).fill(renombre2.toLowerCase());
  await hasta(async () => (await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").count()) === 0, 3000);
  ok(t("inactivo: no se ofrece en otro expediente"), (await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").count()) === 0 && await page.getByText("Ningún juzgado activo coincide").isVisible());
  await combo(page).press("Escape"); await page.getByRole("button", { name: "Cancelar" }).click();

  // ---- Quitar la selección envía null ----
  await editarExpediente(page, expediente.expedienteId);
  await page.getByRole("button", { name: "Quitar juzgado" }).click();
  ok(t("quitar: el selector queda vacío"), (await combo(page).inputValue()) === "");
  desde = envios.length; await guardarEdicion(page);
  put = await ultimoEnvio(envios, "PUT", desde);
  ok(t("quitar: PUT envía juzgadoId null explícito"), put && "juzgadoId" in put.request && put.request.juzgadoId === null && put.status === 200, JSON.stringify({ juzgadoId: put?.request?.juzgadoId, status: put?.status }));
  ok(t("quitar: detalle muestra Juzgado no informado"), (await encabezado(page)).includes("Juzgado no informado"));
  ok(t("quitar: la API lo desvinculó"), (await api(`/api/expedientes/${expediente.expedienteId}`)).body.juzgadoId === null);
  await editarExpediente(page, expediente.expedienteId);
  await combo(page).click(); await combo(page).fill(renombre2.toLowerCase());
  await hasta(async () => (await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").count()) === 0, 3000);
  ok(t("quitar: el inactivo ya no se ofrece"), (await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").count()) === 0);
  await combo(page).press("Escape"); await page.getByRole("button", { name: "Cancelar" }).click();

  // ---- Alta de judicial con selector ----
  const activo = (await api(`/api/juzgados?soloActivos=true&pageSize=100`)).body.items.find((j) => j.juzgadoId !== creado.juzgadoId);
  await page.goto(`${BASE}/expedientes`); await esperarRed(page);
  await page.getByRole("button", { name: "Nuevo expediente judicial" }).first().click();
  const d = page.getByRole("dialog"); await d.waitFor();
  const caso = d.locator("label").filter({ hasText: otro.casos[0].titulo }).first();
  await caso.scrollIntoViewIfNeeded(); await caso.click(); await esperarRed(page); await page.waitForTimeout(500);
  await d.getByLabel("Carátula").fill(`PRUEBA JZ QA FRONT ALTA ${etiqueta} ${sello}`);
  await combo(page).click(); await combo(page).fill(renombre2.toLowerCase());
  await hasta(async () => (await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").count()) === 0, 3000);
  ok(t("alta: el inactivo no se ofrece"), (await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").count()) === 0);
  await combo(page).fill(activo.nombre.slice(0, 12).toLowerCase());
  await page.getByRole("listbox", { name: "Juzgados" }).getByRole("option").filter({ hasText: activo.nombre }).first().click();
  ok(t("alta: selección con búsqueda"), (await combo(page).inputValue()) === activo.nombre, activo.nombre);
  await page.screenshot({ path: `${OUT}/${vp.width}_07-alta-judicial.png`, fullPage: !movil });
  desde = envios.length;
  await d.locator("button[type=submit]").click();
  const post = await ultimoEnvio(envios, "POST", desde);
  ok(t("alta: POST envía juzgadoId y la respuesta trae el nombre"), post?.request?.juzgadoId === activo.juzgadoId && post?.status === 201 && post?.body?.juzgadoNombre === activo.nombre, JSON.stringify({ juzgadoId: post?.request?.juzgadoId, status: post?.status, juzgadoNombre: post?.body?.juzgadoNombre }));

  // ---- Error de carga del selector y reintento ----
  await page.route("**/api/juzgados?*", (route) => route.abort());
  await page.goto(`${BASE}/expedientes/${otro.expedienteId}`); await esperarRed(page);
  await page.getByRole("button", { name: "Editar expediente judicial" }).click();
  await page.getByText("No pudimos cargar los juzgados").waitFor({ timeout: 20000 });
  ok(t("error: aviso de carga con Reintentar"), await page.getByRole("button", { name: "Reintentar" }).isVisible());
  await page.screenshot({ path: `${OUT}/${vp.width}_08-error-carga.png`, fullPage: !movil });
  await page.unroute("**/api/juzgados?*");
  await page.getByRole("button", { name: "Reintentar" }).click(); await esperarRed(page);
  ok(t("error: reintento recupera las opciones"), !!(await hasta(() => combo(page).isEnabled(), 20000)));

  await nav.close();
  return { juzgadoId: creado.juzgadoId, altaId: post?.body?.expedienteId };
}

const creados = [];
try {
  creados.push(await circuito("Escritorio", { width: 1440, height: 900 }, false, exp1, exp2));
  creados.push(await circuito("Celular", { width: 390, height: 844 }, true, exp7, exp2));
} finally {
  // Restaurar el juzgado migrado original de los expedientes editados.
  for (const o of originales) {
    const e = await detalle(o.id);
    const r = await api(`/api/expedientes/${o.id}`, { method: "PUT", body: JSON.stringify({ casoIds: e.casos.map((c) => c.casoId), expedientePadreId: e.expedientePadreId, tipoExpediente: e.tipoExpediente, numeroExpediente: e.numeroExpediente, caratula: e.caratula, juzgadoId: o.juzgadoId, fechaInicio: e.fechaInicio, estadoLegal: e.estadoLegal, tipoTramite: e.tipoTramite }) });
    console.log(`Restaurado expediente ${o.id} → juzgadoId ${o.juzgadoId}: HTTP ${r.status}`);
  }
}
fs.writeFileSync(path.join(OUT, "..", "resultados.json"), JSON.stringify({ fecha: new Date().toISOString(), creados, resultados }, null, 2));
const fallas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallas.length}/${resultados.length} OK`);
process.exit(fallas.length ? 1 : 0);
