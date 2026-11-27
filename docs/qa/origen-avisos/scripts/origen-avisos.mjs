// QA real del origen explícito de los avisos contra la API aislada (:5099).
// Uso: QA_EMAIL=... QA_PASSWORD=... CHROMIUM_PATH=... node origen-avisos.mjs <carpeta-capturas>
// Crea sus propios datos (sello por corrida); los históricos son avisos previos al contrato ("Desconocido").
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000", API = "http://localhost:5099";
const OUT = path.resolve(process.argv[2] ?? "capturas-origen"); fs.mkdirSync(OUT, { recursive: true });
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD }) });
if (!login.ok) throw new Error(`Login falló: ${login.status}`);
const sesion = await login.json();
const H = { Authorization: `Bearer ${sesion.accessToken}`, "Content-Type": "application/json" };
const api = async (url, init = {}) => { const r = await fetch(`${API}${url}`, { ...init, headers: H }); const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : null }; };
const exigir = (r, esperado, que) => { if (r.status !== esperado) throw new Error(`${que}: ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
const resultados = [];
const ok = (nombre, cond, detalle = "") => { resultados.push({ nombre, ok: !!cond, detalle }); console.log(`${cond ? "OK  " : "FAIL"} ${nombre}${detalle ? " — " + detalle : ""}`); };
const hasta = async (fn, ms = 10000) => { const fin = Date.now() + ms; let v; while (Date.now() < fin) { v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 200)); } return v; };
const sello = Date.now().toString(36).toUpperCase().slice(-6);
const hoyAR = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
const dia = (n) => { const d = new Date(`${hoyAR}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const avisos = async (id) => (await api(`/api/recordatorios-agenda?entradaAgendaId=${id}&page=1&pageSize=50`)).body.items;

// ---------- Datos ----------
const CAT0 = `QA Origen ${sello}`, CAT = `QA Origen renombrada ${sello}`, REGLA = `Regla QA Origen ${sello}`;
// Backend guarda los nombres de categoría en mayúsculas: se compara con el nombre normalizado.
const CATN = CAT.toUpperCase(), CAT0N = CAT0.toUpperCase();
const tipo = exigir(await api("/api/tipos-entrada-agenda", { method: "POST", body: JSON.stringify({ nombre: CAT0, descripcion: null, color: null }) }), 201, "categoría");
const tipoId = tipo.tipoEntradaAgendaId ?? tipo.id;
exigir(await api(`/api/recordatorios-predeterminados/tipos-entrada/${tipoId}`, { method: "PUT", body: JSON.stringify({ recordatorios: [{ baseCalculo: "Inicio", minutosAnticipacion: 0 }, { baseCalculo: "Vencimiento", minutosAnticipacion: 1440 }] }) }), 200, "avisos de categoría");
const req = (titulo, ini, venc, hora = null) => ({ tipoEntradaAgendaId: tipoId, titulo, descripcion: null, prioridad: "Normal", fechaInicio: ini, horaInicio: null, fechaFin: null, horaFin: null, fechaVencimiento: venc, horaVencimiento: hora, clienteIds: [], casoIds: [], expedienteIds: [], responsableIds: [] });
const EF = exigir(await api("/api/agenda", { method: "POST", body: JSON.stringify(req(`QA ORIGEN ${sello} FUTURA`, dia(10), dia(20), "15:30:00")) }), 201, "entrada");
const manual = exigir(await api(`/api/recordatorios-agenda/entrada/${EF.entradaAgendaId}`, { method: "POST", body: JSON.stringify({ baseCalculo: "Inicio", minutosAnticipacion: 60 }) }), 201, "aviso manual");
const regla = exigir(await api("/api/reglas-vencimiento", { method: "POST", body: JSON.stringify({ tipoEntradaAgendaId: tipoId, nombre: REGLA, descripcion: null, cantidadDias: 5, tipoComputo: "DiasCorridos", sentidoCalculo: "Despues", prioridadGenerada: "Normal", horaSugerida: null, activo: true }) }), 201, "regla");
exigir(await api(`/api/recordatorios-predeterminados/reglas-vencimiento/${regla.reglaVencimientoId}`, { method: "PUT", body: JSON.stringify({ recordatorios: [{ baseCalculo: "Vencimiento", minutosAnticipacion: 120 }] }) }), 200, "avisos de regla");
const ER = exigir(await api(`/api/reglas-vencimiento/${regla.reglaVencimientoId}/aplicar`, { method: "POST", body: JSON.stringify({ fechaBase: dia(3), origenFechaBase: "Manual", entradaAgendaOrigenId: null, casoOrigenId: null, expedienteOrigenId: null, observacionOrigenId: null, claveIdempotencia: `qa-origen-${sello}`, clienteIds: [], casoIds: [], expedienteIds: [], responsableIds: [] }) }), 201, "aplicar regla").entrada;

// Reprogramados: uno de categoría y el manual.
const deCat = (await avisos(EF.entradaAgendaId)).find((a) => a.origen === "Categoria");
const repCat = exigir(await api(`/api/recordatorios-agenda/${deCat.recordatorioAgendaId}`, { method: "PUT", body: JSON.stringify({ baseCalculo: "Inicio", minutosAnticipacion: 180 }) }), 200, "reprogramar categoría");
const repMan = exigir(await api(`/api/recordatorios-agenda/${manual.recordatorioAgendaId}`, { method: "PUT", body: JSON.stringify({ baseCalculo: "Vencimiento", minutosAnticipacion: 30 }) }), 200, "reprogramar manual");
// Renombre posterior: el nombre informado debe ser el actual.
exigir(await api(`/api/tipos-entrada-agenda/${tipoId}`, { method: "PUT", body: JSON.stringify({ nombre: CAT, descripcion: null, color: null }) }), 200, "renombrar categoría");

// Histórico: una entrada de corridas anteriores ("QA AVISOS … FUTURA"), creada antes del contrato.
const lista = (await api(`/api/agenda?busqueda=${encodeURIComponent("QA AVISOS")}&page=1&pageSize=50`)).body;
const historica = (lista.items ?? lista).find((e) => /^QA AVISOS .* FUTURA$/.test(e.titulo) && e.fechaInicio >= dia(-30) && e.fechaInicio <= dia(30));
console.log(`Datos ${sello}: categoría ${tipoId}, regla ${regla.reglaVencimientoId}, entradas futura=${EF.entradaAgendaId} regla=${ER.entradaAgendaId} histórica=${historica?.entradaAgendaId}`);

// ---------- Contrato ----------
const aF = await avisos(EF.entradaAgendaId), aR = await avisos(ER.entradaAgendaId), aH = historica ? await avisos(historica.entradaAgendaId) : [];
const por = (items, o) => items.filter((a) => a.origen === o);
ok("API: entrada futura con 2 de categoría y 1 manual", por(aF, "Categoria").length === 2 && por(aF, "Manual").length === 1);
ok("API: el nombre es el actual tras renombrar la categoría", por(aF, "Categoria").every((a) => a.origenNombre === CATN && a.origenId === tipoId));
ok("API: reprogramar conserva el origen (categoría y manual)", repCat.origen === "Categoria" && repMan.origen === "Manual" && aF.find((a) => a.recordatorioAgendaId === repCat.recordatorioAgendaId)?.origen === "Categoria");
ok("API: entrada de regla con 1 de regla y 2 de categoría", por(aR, "Regla").length === 1 && por(aR, "Regla")[0].origenNombre === REGLA && por(aR, "Categoria").length === 2);
ok("API: Manual sin id ni nombre", por(aF, "Manual").every((a) => a.origenId === null && a.origenNombre === null));
ok("API: históricos vienen Desconocido, sin id ni nombre", aH.length > 0 && aH.every((a) => a.origen === "Desconocido" && a.origenId === null && a.origenNombre === null), `${aH.length} avisos`);

// ---------- Interfaz ----------
async function circuito(etiqueta, vp, movil) {
  console.log(`\n===== ${etiqueta} (${vp.width}x${vp.height}) =====`);
  const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const ctx = await nav.newContext({ viewport: vp, hasTouch: movil, isMobile: movil, deviceScaleFactor: 1, locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires" });
  await ctx.addInitScript((s) => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  const page = await ctx.newPage();
  const t = (s) => `[${etiqueta}] ${s}`;
  const dialogo = page.getByRole("dialog").last();
  const abrir = async (entrada) => {
    await page.goto(`${BASE}/agenda`); await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Todas", exact: true }).click();
    const desde = page.locator("#agenda-desde");
    if (!(await desde.isVisible())) await page.locator('[aria-controls="agenda-filtros-mas"]').click();
    await desde.fill(dia(-40)); await page.locator("#agenda-hasta").fill(dia(40));
    await page.locator("#agenda-busqueda").fill(entrada.titulo);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.waitForLoadState("networkidle");
    await page.getByText(entrada.titulo, { exact: true }).locator("visible=true").first().click({ timeout: 15000 });
    await dialogo.waitFor();
    await dialogo.getByRole("button", { name: /^Avisos/ }).click();
    await dialogo.locator("[data-aviso-id]").first().waitFor({ timeout: 10000 });
  };
  const fila = (id) => dialogo.locator(`[data-aviso-id="${id}"]`);
  const cerrar = async () => { await dialogo.getByRole("button", { name: "Cerrar" }).last().click(); await hasta(async () => (await page.getByRole("dialog").count()) === 0); };

  await abrir(EF);
  const items = dialogo.locator("[data-aviso-id]");
  ok(t("Futura: «Agregado a mano» en el manual"), (await fila(manual.recordatorioAgendaId).innerText()).includes("Agregado a mano"));
  ok(t("Futura: «Automático · categoría «X»» con el nombre actual"), (await items.filter({ hasText: `Automático · categoría «${CATN}»` }).count()) === 2 && (await items.filter({ hasText: CAT0N + "»" }).count()) === 0);
  ok(t("Reprogramado de categoría conserva su origen"), (await fila(repCat.recordatorioAgendaId).innerText()).includes(`Automático · categoría «${CATN}»`));
  ok(t("Reprogramado manual conserva su origen"), (await fila(repMan.recordatorioAgendaId).innerText()).includes("Agregado a mano"));
  ok(t("Sin textos de la deducción anterior"), !/creado con la entrada|no coincide con los avisos actuales/.test(await dialogo.innerText()));
  const noVistos = aF.filter((a) => !a.atendido).length;
  ok(t("«Marcar como visto» sin cambios: en cada aviso no visto"), (await dialogo.getByRole("button", { name: "Marcar como visto" }).count()) === noVistos, String(noVistos));
  await page.screenshot({ path: `${OUT}/${vp.width}_01-futura-categoria-manual.png` });
  await cerrar();

  await abrir(ER);
  const ir = dialogo.locator("[data-aviso-id]");
  ok(t("Regla: «Automático · regla «X»»"), (await ir.filter({ hasText: `Automático · regla «${REGLA}»` }).count()) === 1);
  ok(t("Regla: los de categoría siguen como categoría"), (await ir.filter({ hasText: `Automático · categoría «${CATN}»` }).count()) === 2);
  await page.screenshot({ path: `${OUT}/${vp.width}_02-regla.png` });
  await cerrar();

  if (historica) {
    await abrir(historica);
    const ih = dialogo.locator("[data-aviso-id]");
    const total = await ih.count();
    ok(t("Histórico: todos «Origen no disponible»"), total > 0 && (await ih.filter({ hasText: "Origen no disponible" }).count()) === total, String(total));
    ok(t("Histórico: no se deduce «Automático» ni «Agregado a mano»"), (await ih.filter({ hasText: /Automático|Agregado a mano/ }).count()) === 0);
    await page.screenshot({ path: `${OUT}/${vp.width}_03-historico.png` });
    await cerrar();
  }
  ok(t("sin scroll horizontal"), await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await nav.close();
}

await circuito("Escritorio", { width: 1440, height: 900 }, false);
await circuito("Celular", { width: 390, height: 844 }, true);

const fallas = resultados.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, "..", "resultados-origen.json"), JSON.stringify({ sello, fecha: new Date().toISOString(), datos: { categoria: tipoId, regla: regla.reglaVencimientoId, entradas: { futura: EF.entradaAgendaId, regla: ER.entradaAgendaId, historica: historica?.entradaAgendaId ?? null } }, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
console.log(`\n${resultados.length - fallas.length}/${resultados.length} OK`);
process.exit(fallas.length ? 1 : 0);
