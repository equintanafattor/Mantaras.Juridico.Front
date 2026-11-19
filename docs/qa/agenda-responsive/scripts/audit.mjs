// Auditoría responsive de Agenda y cobro: 5 tamaños × 20 recorridos (17 de Agenda/fichas + 3 de /cobro).
// Solo lectura: abre diálogos pero nunca los envía.
//
// Uso:  QA_EMAIL=... QA_PASSWORD=... node audit.mjs [carpeta-salida]
// Requiere: frontend en QA_BASE (por defecto http://localhost:3000) y API en QA_API (http://localhost:5099)
// apuntando a una base de QA cargada con seed-qa.mjs (que deja seed-ids.json junto a este script).
// Chromium: playwright instalado, o CHROMIUM_PATH con un ejecutable existente.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");
const SALIDA = path.resolve(process.argv[2] ?? path.join(DIR, "salida"));
const OUT = path.join(SALIDA, "capturas");
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const API = process.env.QA_API ?? "http://localhost:5099";
const EMAIL = process.env.QA_EMAIL;
const PASS = process.env.QA_PASSWORD;
if (!EMAIL || !PASS) throw new Error("Definí QA_EMAIL y QA_PASSWORD (usuario de la base de QA).");
const IDS = JSON.parse(fs.readFileSync(process.env.QA_SEED_IDS ?? path.join(DIR, "seed-ids.json"), "utf8"));

// Táctil: 360/390 celular, 768/1024 tablet. 1440 escritorio con mouse.
const TAMANOS = [
  { id: "360", width: 360, height: 740, movil: true },
  { id: "390", width: 390, height: 844, movil: true },
  { id: "768", width: 768, height: 1024, movil: true },
  { id: "1024", width: 1024, height: 768, movil: true },
  { id: "1440", width: 1440, height: 900, movil: false },
];
const MIN_TACTIL = 44;

const sesion = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASS }) })).json();
if (!sesion.accessToken) throw new Error("No se pudo iniciar sesión en la API de QA");

async function irAgenda(page, vista) {
  await page.goto(`${BASE}/agenda`);
  await page.getByRole("button", { name: "Mes anterior" }).waitFor({ timeout: 15000 }).catch(() => {});
  if (vista) await page.getByRole("button", { name: vista, exact: true }).first().click();
  await page.waitForLoadState("networkidle");
}
async function abrirAlta(page, tipo) {
  await irAgenda(page);
  await page.getByRole("button", { name: "Agregar", exact: true }).first().click();
  await page.getByRole("dialog").waitFor();
  await page.waitForLoadState("networkidle");
  if (tipo) { await page.getByRole("dialog").getByText(tipo, { exact: true }).click(); await page.waitForTimeout(300); }
}
async function irConfig(page) { await page.goto(`${BASE}/agenda/configuracion`); await page.waitForLoadState("networkidle"); }
async function ir(page, url) { await page.goto(`${BASE}${url}`); await page.waitForLoadState("networkidle"); }
async function clickYDialogo(page, nombre) { await page.getByRole("button", { name: nombre }).first().click(); await page.getByRole("dialog").last().waitFor(); await page.waitForLoadState("networkidle"); }

const RECORRIDOS = [
  { id: "01-panel", run: p => ir(p, "/") },
  { id: "02-agenda-pendientes", run: p => irAgenda(p) },
  { id: "03-agenda-calendario", tactilAgenda: true, run: p => irAgenda(p, "Calendario") },
  { id: "04-agenda-todas", tactilAgenda: true, run: p => irAgenda(p, "Todas") },
  { id: "05-agenda-filtros", run: async p => { await irAgenda(p, "Todas"); await p.locator('[aria-controls="agenda-filtros-mas"]').click(); await p.locator("#agenda-filtros-mas").waitFor(); } },
  { id: "06-agenda-detalle", dialogo: true, run: async p => { await irAgenda(p, "Todas"); await p.locator("article h3 button").first().click(); await p.getByRole("dialog").waitFor(); await p.waitForLoadState("networkidle"); } },
  { id: "07-agenda-alta", dialogo: true, teclado: "#agenda-form-titulo", run: p => abrirAlta(p, "Evento") },
  { id: "08-agenda-alta-mas", dialogo: true, teclado: "#agenda-form-descripcion", run: async p => { await abrirAlta(p, "Tarea"); await p.locator("#agenda-form-mas").click().catch(() => {}); await p.waitForTimeout(300); } },
  { id: "09-aplicar-regla", dialogo: true, teclado: "input[type=date]", run: async p => { await abrirAlta(p, "Vencimiento"); await clickYDialogo(p, "Calcular con una regla"); } },
  { id: "10-configuracion", run: irConfig },
  { id: "11-dia-inhabil", dialogo: true, teclado: "textarea", run: async p => { await irConfig(p); await clickYDialogo(p, "Nuevo día inhábil"); } },
  { id: "12-categoria", dialogo: true, teclado: "input:not([type=checkbox])", run: async p => { await irConfig(p); await clickYDialogo(p, "Nueva categoría"); } },
  { id: "13-regla", dialogo: true, teclado: "input:not([type=checkbox])", run: async p => { await irConfig(p); await clickYDialogo(p, "Nueva regla"); } },
  { id: "14-ficha-cliente", run: p => ir(p, `/clientes/${IDS.clienteIds[0]}`) },
  { id: "15-ficha-caso", run: p => ir(p, `/casos/${IDS.casoId}`) },
  { id: "16-ficha-expediente-cobro", run: async p => { await ir(p, `/expedientes/${IDS.expedienteVencido}`); await p.getByRole("heading", { name: "Seguimiento de cobro", exact: true }).scrollIntoViewIfNeeded(); } },
  { id: "17-registrar-envio-cobro", dialogo: true, teclado: "input, textarea", run: async p => { await ir(p, `/expedientes/${IDS.expedientesSinEnvio[0]}`); await clickYDialogo(p, "Registrar envío"); } },
  { id: "18-cobro-listado", run: p => ir(p, "/cobro") },
  { id: "19-cobro-pagina-2", run: async p => { await ir(p, "/cobro"); await p.getByRole("button", { name: "Siguiente" }).click(); await p.getByText("Página 2 de").waitFor(); await p.waitForLoadState("networkidle"); } },
  { id: "20-cobro-seguimiento", dialogo: true, run: async p => { await ir(p, `/expedientes/${IDS.expedienteEnCurso}`); await clickYDialogo(p, "Ver seguimiento"); } },
];

// Desborde horizontal, diálogo dentro del viewport y objetivos táctiles chicos (< 40 px, informativo).
const medir = ({ dialogo, movil }) => {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const recortado = el => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(s.overflowX)) { const r = a.getBoundingClientRect(); if (r.right <= vw + 1) return true; } } return false; };
  const desc = el => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40).replace(/\s+/g, " ")}"`;
  const fuera = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1 && !recortado(el)) fuera.push(`${desc(el)} right=${Math.round(r.right)}`);
  }
  const res = { vw, vh, desborde: document.scrollingElement.scrollWidth > vw + 1, nFuera: fuera.length, fuera: fuera.slice(0, 6) };
  const dlg = [...document.querySelectorAll('[role="dialog"]')].pop();
  if (dialogo) {
    if (!dlg) { res.dialogo = "NO ABIERTO"; return res; }
    const r = dlg.getBoundingClientRect();
    const vis = el => { if (!el) return null; const q = el.getBoundingClientRect(); return q.top >= -1 && q.bottom <= vh + 1; };
    const botones = [...dlg.querySelectorAll("button")].filter(b => b.offsetParent && !b.closest('[data-slot="dialog-header"]') && b.getAttribute("data-slot") !== "dialog-close");
    const ultimo = botones[botones.length - 1];
    res.dialogo = { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), dentro: r.top >= -1 && r.bottom <= vh + 1 && r.left >= -1 && r.right <= vw + 1, tituloVisible: vis(dlg.querySelector('[data-slot="dialog-title"]')), accionFinal: ultimo ? (ultimo.innerText || "").trim().slice(0, 30) : null, accionVisible: vis(ultimo), cierre: !!dlg.querySelector('[data-slot="dialog-close"]') };
  }
  if (movil) {
    const raiz = dlg || document.querySelector("main") || document.body;
    res.chicos = [...raiz.querySelectorAll('button, select, input:not([type=checkbox]):not([type=radio]):not([type=hidden]), a[href]')]
      .filter(el => el.offsetParent).map(el => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ el, r }) => r.height > 0 && r.height < 40 && !(el.tagName === "A" && getComputedStyle(el).display === "inline"))
      .map(({ el, r }) => `${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`).slice(0, 10);
  }
  return res;
};

// Objetivos de Agenda (links de relación, título de cada fila, entradas y "+N más" de la grilla): tamaño y superposición.
const medirAgenda = (min) => {
  const sel = ['ul[aria-label="Relacionado con"] a', "article h3 button", '[aria-label="Calendario del mes"] button', '[aria-label="Días del mes con actividad"] button'];
  const objs = [...document.querySelectorAll(sel.join(","))].filter(el => el.offsetParent).map(el => ({ el, r: el.getBoundingClientRect() })).filter(o => o.r.width > 0);
  const chicos = objs.filter(o => o.r.width < min - 0.5 || o.r.height < min - 0.5).map(o => `"${(o.el.innerText || "").trim().slice(0, 30)}" ${Math.round(o.r.width)}x${Math.round(o.r.height)}`);
  const sup = [];
  for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
    const a = objs[i].r, b = objs[j].r;
    if (objs[i].el.contains(objs[j].el) || objs[j].el.contains(objs[i].el)) continue;
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) sup.push(`"${objs[i].el.innerText.trim().slice(0, 20)}" × "${objs[j].el.innerText.trim().slice(0, 20)}"`);
  }
  // Información oculta: títulos de la grilla recortados deben conservar el texto completo en title.
  const sinTitulo = [...document.querySelectorAll('[aria-label="Calendario del mes"] button')].filter(b => b.offsetParent && b.querySelector(".truncate") && !b.title).length;
  return { total: objs.length, chicos: chicos.slice(0, 8), nChicos: chicos.length, superpuestos: sup.slice(0, 5), nSuperpuestos: sup.length, grillaVisible: !!document.querySelector('[aria-label="Calendario del mes"]')?.offsetParent, sinTitulo };
};

// QA_SOLO=16,17 repite solo esos recorridos y guarda en resultados-parcial.json.
const SOLO = process.env.QA_SOLO?.split(",");
const resultados = [];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const t of TAMANOS) {
  const ctx = await browser.newContext({ viewport: { width: t.width, height: t.height }, isMobile: t.movil, hasTouch: t.movil, deviceScaleFactor: 1, locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires" });
  await ctx.addInitScript(s => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  for (const r of RECORRIDOS.filter(x => !SOLO || SOLO.some(n => x.id.startsWith(n.padStart(2, "0"))))) {
    const page = await ctx.newPage();
    const errores = [];
    page.on("pageerror", e => errores.push(`pageerror: ${e.message}`));
    page.on("console", m => { if (m.type() === "error") errores.push(`console: ${m.text().slice(0, 160)}`); });
    page.on("response", resp => { if (resp.status() >= 400 && resp.url().startsWith(API)) errores.push(`HTTP ${resp.status()} ${resp.url().replace(API, "")}`); });
    const fila = { tamano: t.id, recorrido: r.id };
    try {
      await r.run(page);
      await page.waitForTimeout(400);
      Object.assign(fila, await page.evaluate(medir, { dialogo: !!r.dialogo, movil: t.movil }));
      if (r.tactilAgenda && t.movil) fila.agenda = await page.evaluate(medirAgenda, MIN_TACTIL);
      await page.screenshot({ path: path.join(OUT, `${t.id}_${r.id}.png`), fullPage: !r.dialogo });
      fila.captura = `${t.id}_${r.id}.png`;
      // Teclado virtual aproximado (interactive-widget=resizes-content): foco en un campo y alto al 55 %.
      // NO reemplaza la prueba con teclado real en Android/iOS.
      if (r.teclado && t.width < 1024) {
        const campo = page.getByRole("dialog").last().locator(r.teclado).first();
        if (await campo.count()) {
          await campo.focus();
          await page.setViewportSize({ width: t.width, height: Math.round(t.height * 0.55) });
          await page.waitForTimeout(400);
          const k = await page.evaluate(medir, { dialogo: true, movil: false });
          const campoVisible = await page.evaluate(() => { const q = document.activeElement.getBoundingClientRect(); return q.top >= -1 && q.bottom <= window.innerHeight + 1; });
          fila.teclado = { vh: k.vh, dentro: k.dialogo?.dentro, tituloVisible: k.dialogo?.tituloVisible, accionFinal: k.dialogo?.accionFinal, accionVisible: k.dialogo?.accionVisible, campoVisible, desborde: k.desborde };
          await page.screenshot({ path: path.join(OUT, `${t.id}_${r.id}_teclado.png`) });
          fila.capturaTeclado = `${t.id}_${r.id}_teclado.png`;
          await page.setViewportSize({ width: t.width, height: t.height });
        } else fila.teclado = `sin campo ${r.teclado}`;
      }
    } catch (e) {
      fila.fallo = e.message.split("\n")[0].slice(0, 200);
      await page.screenshot({ path: path.join(OUT, `${t.id}_${r.id}_FALLO.png`) }).catch(() => {});
    }
    fila.errores = [...new Set(errores)].slice(0, 6);
    const problemas = [];
    if (fila.fallo) problemas.push("fallo");
    if (fila.desborde || fila.nFuera) problemas.push("desborde");
    if (fila.errores.length) problemas.push("errores");
    if (r.dialogo && fila.dialogo && (fila.dialogo === "NO ABIERTO" || !fila.dialogo.dentro || !fila.dialogo.tituloVisible || !fila.dialogo.accionVisible)) problemas.push("dialogo");
    if (fila.teclado && (typeof fila.teclado === "string" || !fila.teclado.dentro || !fila.teclado.tituloVisible || !fila.teclado.accionVisible || !fila.teclado.campoVisible || fila.teclado.desborde)) problemas.push("teclado");
    if (fila.agenda && (fila.agenda.nChicos || fila.agenda.nSuperpuestos || fila.agenda.sinTitulo)) problemas.push("tactil-agenda");
    fila.problemas = problemas;
    resultados.push(fila);
    console.log(`${t.id.padEnd(4)} ${r.id.padEnd(26)} ${problemas.length ? "PROBLEMA: " + problemas.join(",") : "ok"}${fila.agenda ? ` agenda=${fila.agenda.total} objetivos, ${fila.agenda.nChicos} < ${MIN_TACTIL}px, ${fila.agenda.nSuperpuestos} superpuestos, grilla=${fila.agenda.grillaVisible}` : ""}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(SALIDA, SOLO ? "resultados-parcial.json" : "resultados.json"), JSON.stringify(resultados, null, 2));
const conProblema = resultados.filter(x => x.problemas.length);
console.log(`\n${resultados.length} casos · ${conProblema.length} con problemas`);
process.exitCode = conProblema.length ? 1 : 0;
