// QA real del listado "Expedientes de cobro" centrado en el cliente, contra la API aislada (:5099).
// Uso: QA_EMAIL=... QA_PASSWORD=... CHROMIUM_PATH=... node cobro-cliente.mjs <carpeta-capturas>
// Crea sus propios datos (marcados con un sello por corrida). El judicial sin cliente
// ("PRUEBA COBRO SIN CLIENTE") lo prepara backend, porque la API no permite crearlo.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000", API = "http://localhost:5099";
const OUT = path.resolve(process.argv[2] ?? "capturas-cobro"); fs.mkdirSync(OUT, { recursive: true });
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD }) });
if (!login.ok) throw new Error(`Login falló: ${login.status}`);
const sesion = await login.json();
const H = { Authorization: `Bearer ${sesion.accessToken}`, "Content-Type": "application/json" };
const api = async (url, init = {}) => { const r = await fetch(`${API}${url}`, { ...init, headers: H }); const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : null }; };
const resultados = [];
const ok = (nombre, cond, detalle = "") => { resultados.push({ nombre, ok: !!cond, detalle }); console.log(`${cond ? "OK  " : "FAIL"} ${nombre}${detalle ? " — " + detalle : ""}`); };
const hasta = async (fn, ms = 10000) => { const fin = Date.now() + ms; let v; while (Date.now() < fin) { v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 150)); } return v; };
const sello = Date.now().toString(36).toUpperCase().slice(-6);
const num = String(Date.now()).slice(-7);
const exigir = (r, esperado, que) => { if (r.status !== esperado) throw new Error(`${que}: ${r.status} ${JSON.stringify(r.body)}`); return r.body; };

// ---------- Datos propios ----------
const VACIO = { cuil: null, claveSeguridadSocial: null, derivadoPor: null, derivadoPorTelefono: null, derivadoPorEmail: null, fechaNacimiento: null, telefono: null, celular: null, email: null, domicilio: null, localidad: null, provincia: null };
const crearCliente = async (apellido, i) => exigir(await api("/api/clientes", { method: "POST", body: JSON.stringify({ ...VACIO, nombre: `Qa${sello}`, apellido: `${apellido} ${sello}`, dni: `${num}${i}` }) }), 201, "cliente");
const crearCaso = async (titulo, clientes) => exigir(await api("/api/casos", { method: "POST", body: JSON.stringify({ numeroExpedienteAnses: null, numeroBeneficio: null, tipoBeneficioId: null, tipoExpedienteAdministrativoId: null, titulo, faseInterna: "Preadministrativa", tipoTramite: null, clientes }) }), 201, "caso");
const base = (casoIds, caratula, padre) => ({ casoIds, expedientePadreId: padre ?? null, tipoExpediente: padre ? "Incidente" : "Principal", numeroExpediente: `QA-${sello}-${caratula.slice(-2)}`, caratula, juzgadoId: null, fechaInicio: null, estadoLegal: null, tipoTramite: null });
const crearJudicial = async (casoIds, caratula, padre) => exigir(await api("/api/expedientes", { method: "POST", body: JSON.stringify(base(casoIds, caratula, padre)) }), 201, "judicial");
const enviar = async (j, casoIds, caratula, padre, fechaEnvio, tipoDocumento = "Cedula") =>
  exigir(await api(`/api/expedientes/${j.expedienteId}`, { method: "PUT", body: JSON.stringify({ ...base(casoIds, caratula, padre), envioCobro: { tipoDocumento, fechaEnvio } }) }), 200, "envío");

const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
const P = `PRUEBA COBRO ${sello}`;
const X = await crearCliente("Unico", 1), Y = await crearCliente("Ambiguo Uno", 2), Z = await crearCliente("Ambiguo Dos", 3), W = await crearCliente("Principal", 4), V = await crearCliente("Secundario", 5);
const c1 = await crearCaso(`${P} caso X`, [{ clienteId: X.clienteId, tipoParticipacion: "Titular", esPrincipal: true }]);
const c2 = await crearCaso(`${P} caso Y`, [{ clienteId: Y.clienteId, tipoParticipacion: "Titular", esPrincipal: true }]);
const c3 = await crearCaso(`${P} caso Z`, [{ clienteId: Z.clienteId, tipoParticipacion: "Titular", esPrincipal: true }]);
const c4 = await crearCaso(`${P} caso W`, [{ clienteId: W.clienteId, tipoParticipacion: "Titular", esPrincipal: true }, { clienteId: V.clienteId, tipoParticipacion: "Conyuge", esPrincipal: false }]);

// X: un principal vencido y 20 incidentes en cobro (varios judiciales del mismo cliente, más de una página).
const jx = await crearJudicial([c1.casoId], `${P} X 00`);
await enviar(jx, [c1.casoId], `${P} X 00`, null, "2025-01-02", "Oficio"); // 120 días hábiles: vencido
const deX = [jx];
for (let i = 1; i <= 20; i++) { const car = `${P} X ${String(i).padStart(2, "0")}`; const j = await crearJudicial([c1.casoId], car, jx.expedienteId); await enviar(j, [c1.casoId], car, jx.expedienteId, hoy); deX.push(j); }
const jAmb = await crearJudicial([c2.casoId, c3.casoId], `${P} AMBIGUO`); await enviar(jAmb, [c2.casoId, c3.casoId], `${P} AMBIGUO`, null, hoy);
const jW = await crearJudicial([c4.casoId], `${P} PRINCIPAL W`); await enviar(jW, [c4.casoId], `${P} PRINCIPAL W`, null, hoy);
console.log(`Datos ${sello}: X=${X.clienteId} (21 judiciales), ambiguo=${jAmb.expedienteId} (Y=${Y.clienteId}, Z=${Z.clienteId}), W=${W.clienteId}+V=${V.clienteId} en ${jW.expedienteId}`);

// ---------- Contrato ----------
const cobro = async (q) => (await api(`/api/expedientes/cobro?page=1&pageSize=100&${q}`)).body;
const todos = await cobro(`busqueda=${encodeURIComponent(sello)}`);
const item = (id) => todos.items.find((x) => x.expedienteId === id);
ok("API: una fila por judicial (23 con el sello)", todos.totalItems === 23, String(todos.totalItems));
ok("API: X único → clientePrincipalId = X", item(jx.expedienteId)?.clientePrincipalId === X.clienteId);
ok("API: ambiguo → null con 2 clientes", item(jAmb.expedienteId)?.clientePrincipalId === null && item(jAmb.expedienteId)?.clientes.length === 2);
ok("API: W principal y V secundario", item(jW.expedienteId)?.clientePrincipalId === W.clienteId && item(jW.expedienteId)?.clientes.map((c) => c.clienteId).join() === `${W.clienteId},${V.clienteId}`);
ok("API: nombreCompleto Apellido, Nombre", item(jx.expedienteId)?.clientes[0].nombreCompleto === `Unico ${sello}, Qa${sello}`);
const porDni = await cobro(`busqueda=${num}1`);
ok("API: busca por DNI del cliente", porDni.totalItems === 21, String(porDni.totalItems));
const sin = await cobro(`busqueda=${encodeURIComponent("PRUEBA COBRO SIN CLIENTE")}`);
const jSin = sin.items[0];
ok("API: existe el judicial sin cliente (preparado por backend)", jSin && jSin.clientes.length === 0 && jSin.clientePrincipalId === null, jSin ? `id ${jSin.expedienteId}` : "no encontrado");

// ---------- Interfaz ----------
async function circuito(etiqueta, vp, movil) {
  console.log(`\n===== ${etiqueta} (${vp.width}x${vp.height}) =====`);
  const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const ctx = await nav.newContext({ viewport: vp, hasTouch: movil, isMobile: movil, deviceScaleFactor: 1, locale: "es-AR" });
  await ctx.addInitScript((s) => { try { sessionStorage.setItem("mantaras.auth.session", s); } catch {} }, JSON.stringify(sesion));
  const page = await ctx.newPage();
  const t = (s) => `[${etiqueta}] ${s}`;
  const fila = (id) => page.locator(`[data-expediente-id="${id}"]`).locator("visible=true");
  const pie = page.locator("footer").filter({ hasText: /expedientes? de cobro/ }).last();
  const sinScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const ruta = () => new URL(page.url()).pathname;
  const buscar = async (texto) => {
    await page.getByRole("textbox", { name: "Buscar expedientes de cobro" }).fill(texto);
    await page.waitForResponse((r) => r.url().includes("/api/expedientes/cobro") && r.url().includes(encodeURIComponent(texto).replace(/%20/g, "+")) || r.url().includes(`busqueda=${encodeURIComponent(texto)}`), { timeout: 8000 }).catch(() => {});
  };
  const volver = async (texto) => {
    await page.goto(`${BASE}/cobro`); await page.waitForLoadState("networkidle");
    if (texto) { await buscar(texto); await page.waitForLoadState("networkidle"); }
  };
  // Clic en una zona sin controles de la fila (no en enlaces ni botones).
  const clicNeutro = async (id) => {
    const f = fila(id);
    await f.waitFor();
    const zona = movil ? f.locator("dl dt").first() : f.locator("td").nth(2);
    await zona.click();
  };

  await volver();
  ok(t("encabezado Cliente primero"), movil || (await page.locator("thead th").first().innerText()).trim() === "Cliente");
  ok(t("ayuda de búsqueda visible"), await page.getByText(/Busca por nombre, apellido, DNI o CUIL del cliente/).isVisible());
  await buscar(sello); await hasta(async () => /23 expedientes de cobro/.test(await pie.innerText().catch(() => "")));
  ok(t("búsqueda por sello: 23 filas en 2 páginas"), /23 expedientes de cobro · Página 1 de 2/.test(await pie.innerText()), await pie.innerText());
  ok(t("sin scroll horizontal"), await sinScroll());
  await page.screenshot({ path: `${OUT}/${vp.width}_01-listado.png`, fullPage: !movil });

  // Paginación
  await page.getByRole("button", { name: "Siguiente" }).click();
  await hasta(async () => /Página 2 de 2/.test(await pie.innerText()));
  const filasP2 = await page.locator("[data-expediente-id]").locator("visible=true").count();
  ok(t("página 2: 3 filas"), filasP2 === 3, String(filasP2));
  await page.getByRole("button", { name: "Anterior" }).click();
  await hasta(async () => /Página 1 de 2/.test(await pie.innerText()));

  // Varios judiciales del mismo cliente → filas separadas, cada una al cliente X.
  await buscar(`${num}1`); await hasta(async () => /21 expedientes de cobro/.test(await pie.innerText().catch(() => "")));
  ok(t("búsqueda por DNI: 21 judiciales de X, una fila cada uno"), /21 expedientes de cobro/.test(await pie.innerText()));
  const fx = fila(jx.expedienteId);
  ok(t("fila X: cliente como dato principal"), (await fx.getByRole("link", { name: `Unico ${sello}, Qa${sello}` }).count()) === 1);
  ok(t("fila X: carátula y número como secundario"), (await fx.innerText()).includes(`${P} X 00`) && (await fx.innerText()).includes(`QA-${sello}-00`));
  ok(t("fila X: documento Oficio y señal de vencido"), (await fx.innerText()).includes("Oficio") && /Venci/.test(await fx.innerText()), (await fx.innerText()).replace(/\s+/g, " ").slice(0, 200));
  ok(t("fila X: fecha de envío"), (await fx.innerText()).includes("02/01/2025"));
  await page.screenshot({ path: `${OUT}/${vp.width}_02-cliente-varios-judiciales.png`, fullPage: !movil });

  await clicNeutro(deX[3].expedienteId);
  await page.waitForURL(`**/clientes/${X.clienteId}`, { timeout: 8000 }).catch(() => {});
  ok(t("clic en la fila abre la ficha del cliente"), ruta() === `/clientes/${X.clienteId}`, ruta());

  await volver(`${num}1`);
  await fila(jx.expedienteId).getByRole("link", { name: /Abrir expediente judicial/ }).click();
  await page.waitForURL(`**/expedientes/${jx.expedienteId}`, { timeout: 8000 }).catch(() => {});
  ok(t("enlace al judicial abre el judicial, no el cliente"), ruta() === `/expedientes/${jx.expedienteId}`, ruta());

  await volver(`${num}1`);
  await fila(jx.expedienteId).getByRole("button", { name: "Ver seguimiento" }).click();
  const dialogo = page.getByRole("dialog");
  ok(t("Ver seguimiento abre el diálogo y no navega"), (await hasta(() => dialogo.isVisible())) && ruta() === "/cobro", ruta());
  await page.screenshot({ path: `${OUT}/${vp.width}_03-seguimiento.png` });
  await page.keyboard.press("Escape"); await hasta(async () => !(await dialogo.isVisible()));
  ok(t("al cerrar el diálogo sigue en cobro"), ruta() === "/cobro");

  await fila(jx.expedienteId).getByRole("link", { name: `Unico ${sello}, Qa${sello}` }).click();
  await page.waitForURL(`**/clientes/${X.clienteId}`, { timeout: 8000 }).catch(() => {});
  ok(t("enlace del nombre abre el cliente"), ruta() === `/clientes/${X.clienteId}`, ruta());

  // Principal único con más clientes.
  await volver(`${P} PRINCIPAL W`);
  const fw = fila(jW.expedienteId); await fw.waitFor();
  ok(t("W principal y 'y 1 cliente más'"), (await fw.innerText()).includes(`Principal ${sello}`) && (await fw.innerText()).includes("y 1 cliente más"));
  await clicNeutro(jW.expedienteId);
  await page.waitForURL(`**/clientes/${W.clienteId}`, { timeout: 8000 }).catch(() => {});
  ok(t("fila con principal único navega al principal"), ruta() === `/clientes/${W.clienteId}`, ruta());

  // Ambiguo: enlaces individuales, la fila no navega.
  await volver(`${P} AMBIGUO`);
  const fa = fila(jAmb.expedienteId); await fa.waitFor();
  ok(t("ambiguo: aviso de varios clientes"), (await fa.innerText()).includes("2 clientes, sin principal único"));
  ok(t("ambiguo: un enlace por cliente"), (await fa.getByRole("link", { name: new RegExp(`Ambiguo (Uno|Dos) ${sello}`) }).count()) === 2);
  ok(t("ambiguo: sin chevron ni cursor de navegación"), !(await fa.evaluate((el) => getComputedStyle(el).cursor === "pointer")));
  await page.screenshot({ path: `${OUT}/${vp.width}_04-ambiguo.png`, fullPage: !movil });
  await clicNeutro(jAmb.expedienteId); await page.waitForTimeout(800);
  ok(t("ambiguo: clic en la fila no navega"), ruta() === "/cobro", ruta());
  await fa.getByRole("link", { name: `Ambiguo Dos ${sello}, Qa${sello}` }).click();
  await page.waitForURL(`**/clientes/${Z.clienteId}`, { timeout: 8000 }).catch(() => {});
  ok(t("ambiguo: el enlace elegido abre ese cliente"), ruta() === `/clientes/${Z.clienteId}`, ruta());

  // Sin cliente.
  if (jSin) {
    await volver("PRUEBA COBRO SIN CLIENTE");
    const fs0 = fila(jSin.expedienteId); await fs0.waitFor();
    ok(t("sin cliente: lo indica claramente"), (await fs0.innerText()).includes("Sin cliente asociado"));
    await page.screenshot({ path: `${OUT}/${vp.width}_05-sin-cliente.png`, fullPage: !movil });
    await clicNeutro(jSin.expedienteId); await page.waitForTimeout(800);
    ok(t("sin cliente: la fila no navega"), ruta() === "/cobro", ruta());
    await fs0.getByRole("link", { name: /Abrir expediente judicial/ }).click();
    await page.waitForURL(`**/expedientes/${jSin.expedienteId}`, { timeout: 8000 }).catch(() => {});
    ok(t("sin cliente: conserva el acceso al judicial"), ruta() === `/expedientes/${jSin.expedienteId}`, ruta());
  }

  // Teclado (escritorio): el nombre del cliente es un enlace enfocable.
  if (!movil) {
    await volver(`${P} PRINCIPAL W`);
    await fila(jW.expedienteId).getByRole("link", { name: `Principal ${sello}, Qa${sello}` }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`**/clientes/${W.clienteId}`, { timeout: 8000 }).catch(() => {});
    ok(t("teclado: Enter en el cliente abre su ficha"), ruta() === `/clientes/${W.clienteId}`, ruta());
  }

  await volver(sello);
  ok(t("sin scroll horizontal al final"), await sinScroll());
  await nav.close();
}

await circuito("Escritorio", { width: 1440, height: 900 }, false);
await circuito("Celular", { width: 390, height: 844 }, true);
await circuito("Tablet", { width: 768, height: 1024 }, true);

const fallas = resultados.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, "..", "resultados-cobro.json"), JSON.stringify({ sello, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
console.log(`\n${resultados.length - fallas.length}/${resultados.length} OK`);
process.exit(fallas.length ? 1 : 0);
