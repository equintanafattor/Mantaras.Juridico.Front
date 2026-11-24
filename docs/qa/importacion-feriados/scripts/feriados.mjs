// QA real de importación de feriados contra la API aislada (5099, base 55432).
// Uso: QA_EMAIL=... QA_PASSWORD=... CHROMIUM_PATH=... node feriados.mjs [carpeta-capturas]  (SOLO_MOVIL=1 para sólo 390/768)
// Requiere frontend en :3000 con NEXT_PUBLIC_API_URL=http://localhost:5099 y la API aislada del backend en :5099.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000", API = "http://localhost:5099";
const OUT = path.resolve(process.argv[2] ?? "capturas"); fs.mkdirSync(OUT, { recursive: true });
const sesion = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD }) })).json();
const H = { Authorization: `Bearer ${sesion.accessToken}`, "Content-Type": "application/json" };
const api = async (url, init = {}) => { const r = await fetch(`${API}${url}`, { ...init, headers: H }); return { status: r.status, body: r.status === 204 ? null : await r.json() }; };
const resultados = [];
const ok = (nombre, cond, detalle = "") => { resultados.push({ nombre, ok: !!cond, detalle }); console.log(`${cond ? "OK  " : "FAIL"} ${nombre}${detalle ? " — " + detalle : ""}`); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
async function contexto(vp, movil) {
  // Chromium sólo emula pointer:coarse si el navegador no abrió antes un contexto de escritorio.
  const nav = movil ? await chromium.launch({ executablePath: process.env.CHROMIUM_PATH }) : browser;
  const ctx = await nav.newContext({ viewport: vp, hasTouch: movil, isMobile: movil, deviceScaleFactor: 1, locale: "es-AR" });
  await ctx.addInitScript(s => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  return ctx;
}
async function irConfig(page, anio) {
  await page.goto(`${BASE}/agenda/configuracion`); await page.waitForLoadState("networkidle");
  if (anio) { await page.locator("#dias-inhabiles-anio").fill(String(anio)); await page.getByRole("button", { name: "Aplicar año" }).click(); await page.waitForLoadState("networkidle"); }
}
const dialogo = page => page.getByRole("dialog").last();
async function abrirImportacion(page, anio) {
  await page.getByRole("button", { name: "Importar feriados nacionales" }).click();
  const d = dialogo(page); await d.waitFor();
  await d.locator("#importar-feriados-anio").fill(String(anio)); await d.getByRole("button", { name: "Ver vista previa" }).click();
  await d.getByText(/Feriados nacionales \d{4}|Año no disponible|fuente oficial no responde|formato inesperado/).first().waitFor({ timeout: 30000 });
  return d;
}
async function sinScrollHorizontal(page) { return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1); }
async function minAlturaBotones(scope) { await scope.page().waitForTimeout(600); const v = await scope.locator("[data-slot=button]").evaluateAll(els => els.map(e => ({ h: e.offsetHeight, t: (e.getAttribute("aria-label") ?? e.textContent).trim().slice(0, 25) })).filter(x => x.h > 0)); const min = Math.min(...v.map(x => x.h)); return { min, chicos: v.filter(x => x.h < 40).map(x => `${x.t}:${x.h}`).join(", ") }; }

// ---------- Escritorio (continúa con 2025 ya importado desde la interfaz) ----------
if (!process.env.SOLO_MOVIL) {
  const ctx = await contexto({ width: 1440, height: 900 }, false), page = await ctx.newPage();
  await irConfig(page, 2025);
  let d;
  ok("refresco: cobertura 2025 importada", await page.getByText("Feriados 2025 importados").first().isVisible());
  ok("listado distingue origen importado", await page.getByText("Feriado nacional", { exact: true }).first().isVisible());
  ok("listado distingue origen manual", await page.locator("li").filter({ hasText: "Feria judicial de invierno" }).getByText("Manual", { exact: true }).isVisible());
  await page.screenshot({ path: `${OUT}/1440_06-listado-importado.png`, fullPage: true });

  // Repetición: sin duplicados.
  const antes = (await api("/api/dias-inhabiles?anio=2025&page=1&pageSize=100")).body.totalItems;
  d = await abrirImportacion(page, 2025);
  ok("repetición: nuevos 0", await d.locator("dt:text('Nuevos') + dd").textContent() === "0");
  // Doble clic real: dos eventos en el mismo tick, con la respuesta demorada.
  const posts = []; page.on("request", r => { if (r.method() === "POST" && r.url().includes("/importacion-nacional/")) posts.push(r.url()); });
  await page.route("**/importacion-nacional/2025", async r => { await new Promise(res => setTimeout(res, 1500)); await r.continue(); });
  const confirmarBtn = d.getByRole("button", { name: /Confirmar sin cambios|^Importar/ });
  await confirmarBtn.evaluate(el => { el.click(); el.click(); el.click(); });
  await d.getByRole("button", { name: "Importando…" }).waitFor({ timeout: 5000 });
  ok("guardando: botón bloqueado con 'Importando…'", await d.getByRole("button", { name: "Importando…" }).isDisabled());
  ok("guardando: cambiar año y cancelar bloqueados", await d.getByRole("button", { name: "Cambiar año" }).isDisabled());
  await page.screenshot({ path: `${OUT}/1440_05-guardando.png` });
  await d.getByText(/ya estaba aplicada|importados|sin cambios/).first().waitFor({ timeout: 30000 });
  const yaAplicada = await d.getByText("Esta importación de 2025 ya estaba aplicada").isVisible();
  const despues = (await api("/api/dias-inhabiles?anio=2025&page=1&pageSize=100")).body.totalItems;
  ok("repetición: sin duplicados en la base", antes === despues, `${antes} → ${despues}; yaAplicada=${yaAplicada}`);
  ok("doble clic: un solo POST de confirmación", posts.length === 1, `${posts.length} POST`);
  await page.unroute("**/importacion-nacional/2025");
  await page.screenshot({ path: `${OUT}/1440_07-repeticion.png` });
  await d.getByRole("button", { name: "Listo" }).click();

  // Fuente caída / inválida (respuesta del backend simulada en el navegador; el backend no se reinicia).
  for (const [status, code, texto, archivo] of [[503, "DiasInhabiles.FuenteNoDisponible", "La fuente oficial no responde", "08-fuente-caida"], [502, "DiasInhabiles.FuenteInvalida", "formato inesperado", "09-fuente-invalida"]]) {
    await page.route("**/importacion-nacional/2025/vista-previa", r => r.fulfill({ status, contentType: "application/json", body: JSON.stringify({ errors: [{ code, message: "x" }] }) }));
    d = await abrirImportacion(page, 2025);
    ok(`fuente ${status}: aviso claro y reintentar`, await d.getByText(texto).first().isVisible() && await d.getByRole("button", { name: "Reintentar" }).isVisible());
    await page.screenshot({ path: `${OUT}/1440_${archivo}.png` });
    await page.unroute("**/importacion-nacional/2025/vista-previa");
    await d.getByRole("button", { name: "Reintentar" }).click();
    await d.getByText("Feriados nacionales 2025").waitFor({ timeout: 30000 });
    ok(`fuente ${status}: reintentar recupera la vista previa`, true);
    await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "detached" }).catch(() => {});
  }
  await ctx.close();
}

// ---------- Celular y tablet ----------
for (const [id, vp] of [["390", { width: 390, height: 844 }], ["768", { width: 768, height: 1024 }]]) {
  const ctx = await contexto(vp, true), page = await ctx.newPage();
  await irConfig(page, 2025);
  ok(`${id}: panel sin scroll horizontal`, await sinScrollHorizontal(page));
  // fullPage reinicia la emulación táctil de Chromium: se captura al final.
  const d = await abrirImportacion(page, 2026);
  ok(`${id}: diálogo sin scroll horizontal`, await sinScrollHorizontal(page));
  console.log("coarse/hover:", await page.evaluate(() => [matchMedia("(pointer: coarse)").matches, matchMedia("(any-pointer: coarse)").matches, matchMedia("(hover: none)").matches]));
  const alto = await minAlturaBotones(d);
  ok(`${id}: botones táctiles ≥ 40 px`, alto.min >= 40, `${alto.min}px ${alto.chicos}`);
  const fila = d.locator("li:has(input[type=checkbox])").first();
  await fila.scrollIntoViewIfNeeded(); const caja = await fila.boundingBox();
  ok(`${id}: fila de revisión con área táctil ≥ 44 px`, caja.height >= 44, `${Math.round(caja.height)}px`);
  await fila.locator("p").first().tap();
  ok(`${id}: tocar el texto de la fila marca la casilla`, await fila.locator("input").isChecked());
  await fila.locator("p").first().tap();
  ok(`${id}: volver a tocar la desmarca`, !(await fila.locator("input").isChecked()));
  const accion = d.getByRole("button", { name: /Confirmar sin cambios|^Importar/ });
  ok(`${id}: confirmar visible sin desplazarse (pie fijo)`, await accion.isVisible() && (await accion.boundingBox()).y + 10 < vp.height);
  await page.screenshot({ path: `${OUT}/${id}_02-vista-previa.png` });
  await d.getByText(/Requieren revisión/).first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/${id}_03-revision.png` });
  await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "detached" }).catch(() => {});
  const altoPanel = await minAlturaBotones(page.locator("section[aria-label='Días inhábiles']"));
  ok(`${id}: botones del panel ≥ 40 px`, altoPanel.min >= 40, `${altoPanel.min}px ${altoPanel.chicos}`);
  await page.screenshot({ path: `${OUT}/${id}_01-panel.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "..", process.env.SOLO_MOVIL ? "resultados-movil.json" : "resultados.json"), JSON.stringify(resultados, null, 2));
const fallas = resultados.filter(r => !r.ok).length;
console.log(`\n${resultados.length - fallas}/${resultados.length} OK`);
process.exit(fallas ? 1 : 0);
