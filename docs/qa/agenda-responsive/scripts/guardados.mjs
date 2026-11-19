// Prueba de guardados por la interfaz (escribe en la base de QA): alta y edición de Agenda, registro de envío de cobro.
// Cada guardado se verifica luego contra la API.
//
// Uso:  QA_EMAIL=... QA_PASSWORD=... node guardados.mjs [carpeta-salida]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");
const SALIDA = path.resolve(process.argv[2] ?? path.join(DIR, "salida"));
const OUT = path.join(SALIDA, "capturas-guardados");
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const API = process.env.QA_API ?? "http://localhost:5099";
const EMAIL = process.env.QA_EMAIL, PASS = process.env.QA_PASSWORD;
if (!EMAIL || !PASS) throw new Error("Definí QA_EMAIL y QA_PASSWORD.");
const IDS = JSON.parse(fs.readFileSync(process.env.QA_SEED_IDS ?? path.join(DIR, "seed-ids.json"), "utf8"));

const sesion = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASS }) })).json();
const H = { Authorization: `Bearer ${sesion.accessToken}` };
const get = async url => (await fetch(`${API}${url}`, { headers: H })).json();
const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

const CASOS = [
  { id: "390", width: 390, height: 844, movil: true, expediente: IDS.expedientesSinEnvio[1], documento: "Oficio" },
  { id: "1440", width: 1440, height: 900, movil: false, expediente: IDS.expedientesSinEnvio[2], documento: "Cédula" },
];
const resultados = [];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const t of CASOS) {
  const ctx = await browser.newContext({ viewport: { width: t.width, height: t.height }, isMobile: t.movil, hasTouch: t.movil, locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires" });
  await ctx.addInitScript(s => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", e => errores.push(e.message));
  page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(API)) errores.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(API, "")}`); });
  const paso = async (nombre, fn) => {
    const fila = { tamano: t.id, paso: nombre };
    try { Object.assign(fila, await fn()); fila.ok = fila.ok ?? true; }
    catch (e) { fila.ok = false; fila.fallo = e.message.split("\n")[0].slice(0, 220); }
    await page.screenshot({ path: path.join(OUT, `${t.id}_${nombre}.png`) }).catch(() => {});
    fila.errores = errores.splice(0);
    resultados.push(fila);
    console.log(`${t.id} ${nombre}: ${fila.ok ? "ok" : "FALLA " + (fila.fallo ?? JSON.stringify(fila))}${fila.errores.length ? " errores=" + fila.errores.join(" | ") : ""}`);
  };
  const titulo = `QA Alta por UI ${t.id} ${Date.now()}`;

  await paso("agenda-alta", async () => {
    await page.goto(`${BASE}/agenda`); await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Agregar", exact: true }).first().click();
    const dlg = page.getByRole("dialog");
    await dlg.getByText("Evento", { exact: true }).click();
    await dlg.locator("#agenda-form-titulo").fill(titulo);
    await dlg.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
    const alerta = await dlg.locator('[role="alert"]').allInnerTexts().catch(() => []);
    const creada = (await get(`/api/agenda?desde=${hoy}&hasta=${hoy}&busqueda=${encodeURIComponent(titulo)}&page=1&pageSize=5`)).items?.find(x => x.titulo === titulo);
    if (await dlg.isVisible()) await dlg.getByRole("button", { name: /Cerrar|Cancelar/ }).last().click().catch(() => {});
    return { ok: !!creada && creada.fechaInicio === hoy && alerta.length === 0, entradaId: creada?.entradaAgendaId, fechaInicio: creada?.fechaInicio, alerta };
  });

  await paso("agenda-edicion", async () => {
    await page.goto(`${BASE}/agenda`); await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Todas", exact: true }).click(); await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: titulo, exact: true }).click();
    const detalle = page.getByRole("dialog");
    await detalle.getByRole("button", { name: /Editar/ }).first().click();
    const form = page.getByRole("dialog").last();
    await form.locator("#agenda-form-titulo").waitFor();
    if (t.movil) { await form.locator("#agenda-form-titulo").focus(); await page.setViewportSize({ width: t.width, height: Math.round(t.height * 0.55) }); }
    await form.locator("#agenda-form-titulo").fill(`${titulo} editada`);
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
    await page.setViewportSize({ width: t.width, height: t.height });
    const r = await get(`/api/agenda?desde=${hoy}&hasta=${hoy}&busqueda=${encodeURIComponent(titulo)}&page=1&pageSize=5`);
    const e = r.items?.find(x => x.titulo.startsWith(titulo));
    return { ok: e?.titulo === `${titulo} editada` && e.fechaInicio === hoy, tituloFinal: e?.titulo, conTecladoSimulado: t.movil };
  });

  await paso("cobro-fecha-futura-bloqueada", async () => {
    await page.goto(`${BASE}/expedientes/${t.expediente}`); await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Registrar envío" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.locator("#envio-cobro-fecha").fill("2099-01-01");
    const deshabilitado = await dlg.getByRole("button", { name: "Registrar envío" }).isDisabled();
    const aviso = await dlg.getByText("no puede ser posterior a hoy").isVisible();
    await dlg.getByRole("button", { name: "Cancelar" }).click();
    const sigueSinEnvio = !(await get(`/api/expedientes/${t.expediente}`)).envioCobro;
    return { ok: deshabilitado && aviso && sigueSinEnvio, deshabilitado, aviso, sigueSinEnvio };
  });

  await paso("cobro-registro", async () => {
    await page.goto(`${BASE}/expedientes/${t.expediente}`); await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Registrar envío" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByRole("button", { name: t.documento, exact: true }).click();
    if (t.movil) { await dlg.locator("#envio-cobro-fecha").focus(); await page.setViewportSize({ width: t.width, height: Math.round(t.height * 0.55) }); }
    const boton = dlg.getByRole("button", { name: "Registrar envío" });
    await page.waitForTimeout(400);
    const caja = await boton.boundingBox(); const vh = page.viewportSize().height;
    const botonVisible = !!caja && caja.y >= 0 && caja.y + caja.height <= vh;
    await boton.click({ trial: false });
    await dlg.waitFor({ state: "hidden", timeout: 10000 });
    await page.setViewportSize({ width: t.width, height: t.height });
    await page.getByRole("button", { name: "Ver seguimiento" }).waitFor({ timeout: 10000 });
    const d = await get(`/api/expedientes/${t.expediente}`);
    const esperado = t.documento === "Cédula" ? "Cedula" : t.documento;
    const enListado = (await get(`/api/expedientes/cobro?page=1&pageSize=50&soloActivos=true`)).items?.some(x => x.expedienteId === t.expediente);
    return { ok: botonVisible && d.envioCobro?.tipoDocumento === esperado && d.envioCobro?.fechaEnvio === hoy && enListado, botonVisibleConTeclado: t.movil ? botonVisible : "n/a", tipoDocumento: d.envioCobro?.tipoDocumento, fechaEnvio: d.envioCobro?.fechaEnvio, enListado };
  });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(SALIDA, "resultados-guardados.json"), JSON.stringify(resultados, null, 2));
console.log(`\n${resultados.length} pasos · ${resultados.filter(x => !x.ok).length} con falla`);
process.exitCode = resultados.some(x => !x.ok) ? 1 : 0;
