// QA real de "Avisos claros" (Agenda, panel, detalle, formulario y configuración) contra la API aislada (:5099).
// Uso: QA_EMAIL=... QA_PASSWORD=... CHROMIUM_PATH=... node avisos-claros.mjs <carpeta-capturas>
// Crea sus propios datos marcados con un sello por corrida. Verifica además, por API, que abrir
// un aviso no lo marca y que "Marcar como visto" no cambia el estado de la entrada.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000", API = "http://localhost:5099";
const OUT = path.resolve(process.argv[2] ?? "capturas-avisos"); fs.mkdirSync(OUT, { recursive: true });
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
const ddmm = (iso) => iso.split("-").reverse().join("/");

// ---------- Datos ----------
const CAT = `QA Avisos ${sello}`;
const tipo = exigir(await api("/api/tipos-entrada-agenda", { method: "POST", body: JSON.stringify({ nombre: CAT, descripcion: null, color: null }) }), 201, "categoría");
const tipoId = tipo.tipoEntradaAgendaId ?? tipo.id;
exigir(await api(`/api/recordatorios-predeterminados/tipos-entrada/${tipoId}`, { method: "PUT", body: JSON.stringify({ recordatorios: [{ baseCalculo: "Inicio", minutosAnticipacion: 0 }, { baseCalculo: "Vencimiento", minutosAnticipacion: 1440 }] }) }), 200, "avisos de categoría");
const entradaReq = (titulo, fechaInicio, fechaVencimiento, horaVencimiento = null) => ({ tipoEntradaAgendaId: tipoId, titulo, descripcion: null, prioridad: "Normal", fechaInicio, horaInicio: null, fechaFin: null, horaFin: null, fechaVencimiento, horaVencimiento, clienteIds: [], casoIds: [], expedienteIds: [], responsableIds: [] });
const crear = async (titulo, ini, venc, hora) => exigir(await api("/api/agenda", { method: "POST", body: JSON.stringify(entradaReq(titulo, ini, venc, hora)) }), 201, `entrada ${titulo}`);
const avisos = async (id) => (await api(`/api/recordatorios-agenda?entradaAgendaId=${id}&page=1&pageSize=50`)).body.items;

const E1 = await crear(`QA AVISOS ${sello} FUTURA`, dia(10), dia(20), "15:30:00");
const manual = exigir(await api(`/api/recordatorios-agenda/entrada/${E1.entradaAgendaId}`, { method: "POST", body: JSON.stringify({ baseCalculo: "Inicio", minutosAnticipacion: 60 }) }), 201, "aviso manual");
const E2 = await crear(`QA AVISOS ${sello} PASADA`, dia(-3), dia(-1));
const E3 = await crear(`QA AVISOS ${sello} COMPLETADA`, dia(-3), dia(-1));
const E4 = await crear(`QA AVISOS ${sello} CANCELADA`, dia(-3), dia(-1));
exigir(await api(`/api/agenda/${E3.entradaAgendaId}/estado`, { method: "PATCH", body: JSON.stringify({ estado: "Completada" }) }), 200, "completar");
exigir(await api(`/api/agenda/${E4.entradaAgendaId}/estado`, { method: "PATCH", body: JSON.stringify({ estado: "Cancelada" }) }), 200, "cancelar");
// Regla con aviso propio (2 horas antes de la fecha límite), aplicada sobre una fecha pasada.
const regla = exigir(await api("/api/reglas-vencimiento", { method: "POST", body: JSON.stringify({ tipoEntradaAgendaId: tipoId, nombre: `Regla QA Avisos ${sello}`, descripcion: null, cantidadDias: 5, tipoComputo: "DiasCorridos", sentidoCalculo: "Despues", prioridadGenerada: "Normal", horaSugerida: null, activo: true }) }), 201, "regla");
const reglaId = regla.reglaVencimientoId;
exigir(await api(`/api/recordatorios-predeterminados/reglas-vencimiento/${reglaId}`, { method: "PUT", body: JSON.stringify({ recordatorios: [{ baseCalculo: "Vencimiento", minutosAnticipacion: 120 }] }) }), 200, "avisos de regla");
const apl = exigir(await api(`/api/reglas-vencimiento/${reglaId}/aplicar`, { method: "POST", body: JSON.stringify({ fechaBase: dia(-8), origenFechaBase: "Manual", entradaAgendaOrigenId: null, casoOrigenId: null, expedienteOrigenId: null, observacionOrigenId: null, claveIdempotencia: `qa-avisos-${sello}`, clienteIds: [], casoIds: [], expedienteIds: [], responsableIds: [] }) }), 201, "aplicar regla");
const E5 = apl.entrada;
console.log(`Datos ${sello}: categoría ${tipoId}, regla ${reglaId}, entradas E1=${E1.entradaAgendaId} E2=${E2.entradaAgendaId} E3=${E3.entradaAgendaId} E4=${E4.entradaAgendaId} E5=${E5.entradaAgendaId}`);
// Avisos pendientes de corridas anteriores de este mismo script (base aislada): se marcan como vistos
// para que el bloque, limitado a los 10 primeros, muestre los de esta corrida.
const viejos = (await api("/api/recordatorios-agenda?estado=Vencido&soloEntradasAbiertas=true&page=1&pageSize=100")).body.items
  .filter((a) => /qa avisos/i.test(a.entradaTitulo) && !a.entradaTitulo.includes(sello));
for (const a of viejos) await api(`/api/recordatorios-agenda/${a.recordatorioAgendaId}/atender`, { method: "PATCH" });
console.log(`Avisos de corridas anteriores marcados como vistos: ${viejos.length}`);

// ---------- Contrato y supuestos ----------
const a1 = await avisos(E1.entradaAgendaId), a2 = await avisos(E2.entradaAgendaId), a5 = await avisos(E5.entradaAgendaId);
ok("API: E1 tiene 3 avisos programados (2 automáticos + 1 manual)", a1.length === 3 && a1.every((a) => a.estado === "Pendiente"), a1.map((a) => a.estado).join());
ok("API: los automáticos comparten fechaCreacion con la entrada; el manual no", a1.filter((a) => Date.parse(a.fechaCreacion) === Date.parse(E1.fechaCreacion)).length === 2 && Date.parse(manual.fechaCreacion) !== Date.parse(E1.fechaCreacion));
ok("API: E2 tiene 2 avisos pendientes de ver (estado Vencido)", a2.length === 2 && a2.every((a) => a.estado === "Vencido"));
ok("API: E5 (regla) tiene avisos de categoría y de regla con la fecha de creación de la entrada", a5.length === 3 && a5.every((a) => Date.parse(a.fechaCreacion) === Date.parse(E5.fechaCreacion)), String(a5.length));

// ---------- Interfaz ----------
async function circuito(etiqueta, vp, movil, marcar) {
  console.log(`\n===== ${etiqueta} (${vp.width}x${vp.height}) =====`);
  const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const ctx = await nav.newContext({ viewport: vp, hasTouch: movil, isMobile: movil, deviceScaleFactor: 1, locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires" });
  await ctx.addInitScript((s) => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  const page = await ctx.newPage();
  const t = (s) => `[${etiqueta}] ${s}`;
  const parches = [];
  let marcadosProgramados = 0;
  page.on("request", (req) => { if (req.method() === "PATCH" && req.url().includes("/atender")) parches.push(req.url()); });
  const sinScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const bloque = () => page.locator("section[aria-labelledby=avisos-pendientes-de-ver]").locator("visible=true").first();
  const dialogo = page.getByRole("dialog").last();
  const abrirAvisos = async () => { await dialogo.getByRole("button", { name: /^Avisos/ }).click(); await dialogo.locator("[data-aviso-id]").first().waitFor({ timeout: 10000 }).catch(() => {}); };
  const cerrar = async () => { await dialogo.getByRole("button", { name: "Cerrar" }).last().click(); await hasta(async () => (await page.getByRole("dialog").count()) === 0); };

  // Agenda › Pendientes
  await page.goto(`${BASE}/agenda`); await page.waitForLoadState("networkidle");
  await bloque().waitFor({ timeout: 15000 });
  const pendientesApi = (await api("/api/recordatorios-agenda?estado=Vencido&soloEntradasAbiertas=true&page=1&pageSize=1")).body.totalItems;
  const a2 = (await avisos(E2.entradaAgendaId)).filter((a) => a.estado === "Vencido");
  const titulo = await bloque().locator("h2").innerText();
  ok(t("Agenda: bloque «Avisos pendientes de ver» con el total de la API"), titulo.includes(`(${pendientesApi})`), `${titulo} / API ${pendientesApi}`);
  ok(t("Agenda: explica que no se envían por correo ni WhatsApp"), /no se envían por correo ni por WhatsApp/i.test(await bloque().innerText()));
  ok(t("Agenda: sin términos viejos (Alertas, atender)"), !/Alertas sin atender|Marcar atendid/.test(await page.locator("main").innerText()));
  const filaE2 = bloque().locator(`[data-aviso-id="${a2[0].recordatorioAgendaId}"]`);
  const visibleE2 = (await filaE2.count()) > 0;
  ok(t("Agenda: muestra fecha del aviso y fecha límite (sin hora) de E2"), visibleE2 && /Fecha del aviso:.*\d{2}\/\d{2}\/\d{4}/s.test(await filaE2.innerText()) && (await filaE2.innerText()).includes("sin hora"), visibleE2 ? "" : "E2 fuera de los primeros 10");
  ok(t("Agenda: no lista avisos de entradas completadas o canceladas"), (await bloque().locator("[data-aviso-id]").filter({ hasText: new RegExp(`${sello} (COMPLETADA|CANCELADA)`) }).count()) === 0);
  ok(t("sin scroll horizontal en Agenda"), await sinScroll());
  await page.screenshot({ path: `${OUT}/${vp.width}_01-agenda-pendientes.png`, fullPage: !movil });

  // Abrir la entrada desde el aviso no lo marca.
  await page.getByRole("textbox").first().isVisible().catch(() => {});
  const abrirDesde = visibleE2 ? filaE2 : null;
  if (abrirDesde) await abrirDesde.getByRole("button", { name: "Abrir entrada" }).click();
  else { await page.goto(`${BASE}/agenda`); }
  if (abrirDesde) {
    await dialogo.waitFor();
    ok(t("Abrir entrada abre el detalle de la entrada asociada"), (await dialogo.getByRole("heading").first().innerText()).includes(`${sello} PASADA`));
    const dl = await dialogo.locator("dl").first().innerText();
    ok(t("Detalle: «Fecha límite» con «sin hora»"), /Fecha límite/.test(dl) && /sin hora/.test(dl), dl.replace(/\s+/g, " "));
    await abrirAvisos();
    const lista = dialogo.locator("[data-aviso-id]");
    ok(t("Detalle: avisos «Pendiente de ver» con «Fecha del aviso»"), (await lista.filter({ hasText: "Pendiente de ver" }).count()) === a2.length && (await lista.first().innerText()).includes("Fecha del aviso"));
    ok(t("Detalle: origen automático de la categoría"), (await lista.filter({ hasText: `Automático · categoría «${CAT}»` }).count()) === 2);
    ok(t("Detalle: explica que no se envían por correo ni WhatsApp y que no completa la entrada"), /no se envían por correo ni por WhatsApp/i.test(await dialogo.innerText()) && /no completa la entrada/.test(await dialogo.innerText()));
    const pendientesIds = new Set(a2.map((a) => a.recordatorioAgendaId)); const sinMarcar = (await avisos(E2.entradaAgendaId)).filter((a) => pendientesIds.has(a.recordatorioAgendaId)).every((a) => !a.atendido);
    ok(t("Abrir el detalle y los avisos no los marca como vistos"), sinMarcar && parches.length === 0);
    await page.screenshot({ path: `${OUT}/${vp.width}_02-detalle-pendientes-de-ver.png` });
    if (marcar) {
      const objetivo = lista.filter({ hasText: "Pendiente de ver" }).first();
      const id = Number(await objetivo.getAttribute("data-aviso-id"));
      await objetivo.getByRole("button", { name: "Marcar como visto" }).click();
      await hasta(async () => /Aviso marcado como visto\. La entrada sigue pendiente\./.test(await dialogo.innerText()));
      ok(t("Marcar como visto: mensaje aclara que la entrada sigue pendiente"), /La entrada sigue pendiente/.test(await dialogo.innerText()));
      const tras = (await avisos(E2.entradaAgendaId)).find((a) => a.recordatorioAgendaId === id);
      const entrada = (await api(`/api/agenda/${E2.entradaAgendaId}`)).body;
      ok(t("API: el aviso quedó Visto (Atendido) y la entrada sigue Pendiente"), tras?.estado === "Atendido" && entrada.estado === "Pendiente", `${tras?.estado} / ${entrada.estado}`);
      await hasta(async () => (await dialogo.locator(`[data-aviso-id="${id}"]`).innerText().catch(() => "")).includes("Visto el"));
      ok(t("Detalle: el aviso muestra «Visto» con fecha y usuario"), /Visto el .*por /.test(await dialogo.locator(`[data-aviso-id="${id}"]`).innerText()));
      await page.screenshot({ path: `${OUT}/${vp.width}_03-marcado-como-visto.png` });
    }
    await cerrar();
  }

  // Entrada futura con varias fechas de aviso: automáticos y manual.
  const abrirPorId = async (entrada) => {
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
  };
  await abrirPorId(E1);
  await abrirAvisos();
  const l1 = dialogo.locator("[data-aviso-id]");
  const prog = (await avisos(E1.entradaAgendaId)).filter((a) => a.estado === "Pendiente");
  ok(t("Futura: avisos «Programado» según la API"), (await l1.filter({ hasText: "Programado" }).count()) === prog.length && prog.length >= 2, String(prog.length));
  ok(t("Futura: identifica el manual y los automáticos"), (await l1.filter({ hasText: "Agregado a mano" }).count()) === 1 && (await l1.filter({ hasText: "Automático · categoría" }).count()) === 2);
  ok(t("Futura: fecha del aviso 1 día antes de la fecha límite a las 15:30"), (await l1.filter({ hasText: `${ddmm(dia(19))}` }).filter({ hasText: "15:30" }).count()) === 1);
  ok(t("Futura: el aviso sin hora usa las 09:00 y el manual las 08:00"), (await l1.filter({ hasText: ddmm(dia(10)) }).filter({ hasText: "09:00" }).count()) === 1 && (await l1.filter({ hasText: ddmm(dia(10)) }).filter({ hasText: "08:00" }).count()) === 1);
  ok(t("Futura: ofrece «Marcar como visto» en cada programado, con aclaración"), (await l1.filter({ hasText: "Programado" }).getByRole("button", { name: "Marcar como visto" }).count()) === prog.length && (await l1.filter({ hasText: "Si lo marcás como visto antes de su fecha" }).count()) === prog.length);
  if (marcar) {
    // Se marca un programado (el de la fecha límite): queda Visto y la entrada no cambia.
    const objetivo = l1.filter({ hasText: "Programado" }).filter({ hasText: "15:30" }).or(l1.filter({ hasText: "Programado" }).first()).first();
    const id = Number(await objetivo.getAttribute("data-aviso-id"));
    await objetivo.getByRole("button", { name: "Marcar como visto" }).click();
    await hasta(async () => /Aviso marcado como visto\. La entrada sigue pendiente\./.test(await dialogo.innerText()));
    const tras = (await avisos(E1.entradaAgendaId)).find((a) => a.recordatorioAgendaId === id);
    const entrada = (await api(`/api/agenda/${E1.entradaAgendaId}`)).body;
    ok(t("Futura: marcar un programado lo deja Visto y la entrada sigue Pendiente"), tras?.estado === "Atendido" && entrada.estado === "Pendiente", `${tras?.estado} / ${entrada.estado}`);
    marcadosProgramados++;
  }
  await dialogo.getByLabel("Anticipación").fill("2"); await dialogo.getByLabel("Unidad").selectOption("Horas");
  ok(t("Futura: vista previa concreta al agregar un aviso"), /Aparecerá el .*07:00/.test(await dialogo.innerText()));
  await page.screenshot({ path: `${OUT}/${vp.width}_04-detalle-programados.png` });
  await cerrar();

  // Generada por regla: el aviso propio de la regla se atribuye a la regla.
  await abrirPorId(E5);
  await abrirAvisos();
  ok(t("Regla: un aviso atribuido a la regla de vencimiento"), (await dialogo.locator("[data-aviso-id]").filter({ hasText: "regla de vencimiento que generó la entrada" }).count()) === 1);
  await cerrar();

  // Completada y cancelada.
  for (const [entrada, estado] of [[E3, "completada"], [E4, "cancelada"]]) {
    await abrirPorId(entrada);
    await abrirAvisos();
    ok(t(`${estado}: explica que sus avisos no aparecen en Pendientes`), new RegExp(`Esta entrada está ${estado}: sus avisos ya no aparecen en Pendientes`).test(await dialogo.innerText()));
    ok(t(`${estado}: conserva el estado real de sus avisos`), (await dialogo.locator("[data-aviso-id]").filter({ hasText: "Pendiente de ver" }).count()) === 2);
    if (estado === "completada") await page.screenshot({ path: `${OUT}/${vp.width}_05-completada.png` });
    await cerrar();
  }

  // Formulario: resumen de cuándo aparecerán.
  await page.goto(`${BASE}/agenda`); await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Agregar" }).first().click();
  await page.locator('label:has(input[name="agenda-clase"][value="tarea"])').click();
  await page.locator("#agenda-form-tipo").selectOption(String(tipoId));
  await page.locator("#agenda-form-fechaInicio").fill(dia(5));
  await page.locator("#agenda-form-fechaVencimiento").fill(dia(7));
  await page.locator("#agenda-form-horaVencimiento").fill("11:00");
  const resumen = page.locator("section[aria-labelledby=agenda-form-resumen-avisos]");
  await hasta(async () => (await resumen.locator("li").count()) === 2);
  const rt = await resumen.innerText();
  ok(t("Formulario: resumen con 2 avisos automáticos y fechas concretas"), (await resumen.locator("li").count()) === 2 && rt.includes(`${ddmm(dia(5))}, 09:00`) && rt.includes(`${ddmm(dia(6))}, 11:00`), rt.replace(/\s+/g, " "));
  ok(t("Formulario: aclara canal interno y horario de Argentina"), /no por correo ni WhatsApp/.test(rt) && /Horarios de Argentina/.test(rt));
  ok(t("Formulario: opciones avanzadas siguen disponibles"), (await page.getByText(/Más opciones/).count()) > 0);
  await page.screenshot({ path: `${OUT}/${vp.width}_06-formulario-resumen.png`, fullPage: false });
  await page.keyboard.press("Escape");

  // Panel de inicio: mismo bloque y mismo total.
  await page.goto(`${BASE}/`); await page.waitForLoadState("networkidle");
  await bloque().waitFor({ timeout: 15000 }).catch(() => {});
  const pendientesAhora = (await api("/api/recordatorios-agenda?estado=Vencido&soloEntradasAbiertas=true&page=1&pageSize=1")).body.totalItems;
  ok(t("Panel: «Avisos pendientes de ver» con el mismo total que la API y Agenda"), (await bloque().locator("h2").innerText()).includes(`(${pendientesAhora})`), await bloque().locator("h2").innerText().catch(() => "sin bloque"));
  const primero = bloque().locator("[data-aviso-id]").first();
  await primero.getByRole("button", { name: "Abrir entrada" }).click();
  await dialogo.waitFor({ timeout: 10000 }).catch(() => {});
  ok(t("Panel: «Abrir entrada» abre el detalle"), await dialogo.isVisible());
  ok(t("sin scroll horizontal en el panel"), await sinScroll());
  await page.screenshot({ path: `${OUT}/${vp.width}_07-panel.png`, fullPage: !movil });
  await cerrar().catch(() => {});

  // Configuración
  await page.goto(`${BASE}/agenda/configuracion`); await page.waitForLoadState("networkidle");
  const cfg = await page.locator("main").innerText().catch(() => "");
  ok(t("Configuración: «Avisos automáticos» y aclaración del canal"), /Avisos automáticos por categoría/.test(cfg) && /no por correo ni WhatsApp/.test(cfg) && !/Recordatorios predeterminados/.test(cfg));
  ok(t("Sin PATCH /atender salvo el «Marcar como visto» explícito"), parches.length === (marcar && abrirDesde ? 1 : 0) + marcadosProgramados, String(parches.length));
  await nav.close();
}

await circuito("Escritorio", { width: 1440, height: 900 }, false, true);
await circuito("Celular", { width: 390, height: 844 }, true, true);

const fallas = resultados.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, "..", "resultados-avisos.json"), JSON.stringify({ sello, fecha: new Date().toISOString(), datos: { categoria: tipoId, regla: reglaId, entradas: { futura: E1.entradaAgendaId, pasada: E2.entradaAgendaId, completada: E3.entradaAgendaId, cancelada: E4.entradaAgendaId, regla: E5.entradaAgendaId } }, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
console.log(`\n${resultados.length - fallas.length}/${resultados.length} OK`);
process.exit(fallas.length ? 1 : 0);
