// Carga datos ficticios en la base aislada de QA. Se niega a correr si la API no apunta a una base vacía de QA.
import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");
const API = process.env.QA_API ?? "http://localhost:5099";
const EMAIL = process.env.QA_EMAIL ?? "qa@local.test";
const PASS = process.env.QA_PASSWORD;
if (!PASS) throw new Error("Definí QA_PASSWORD (usuario BootstrapAdmin de la base de QA).");

const login = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASS }) })).json();
if (!login.accessToken) throw new Error("Login QA falló");
const H = { "Content-Type": "application/json", Authorization: `Bearer ${login.accessToken}` };
async function api(method, url, body) {
  const r = await fetch(`${API}${url}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} → ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

// Reejecutable: reutiliza lo que ya creó (todo lleva el prefijo QA) y aborta si encuentra datos que no son de QA.
const todosClientes = (await api("GET", "/api/clientes?page=1&pageSize=100")).items;
if (todosClientes.some(c => !/^QA /.test(c.nombreCompleto ?? c.apellido ?? ""))) throw new Error("La base tiene clientes que no son de QA. Abortado.");
const buscarCliente = async (nombre, apellido) => todosClientes.find(c => c.nombreCompleto === `${apellido}, ${nombre}`) ?? api("POST", "/api/clientes", { nombre, apellido });
const c1 = await buscarCliente("Ana", "QA Ficticia");
const c2 = await buscarCliente("Bruno Maximiliano Alejandro", "QA Apellido Muy Largo Para Probar Recortes");
const casosPrevios = (await api("GET", "/api/casos?page=1&pageSize=100")).items;
const expPrevios = (await api("GET", "/api/expedientes?page=1&pageSize=100")).items;

const hoy = new Date();
const fecha = dias => { const d = new Date(hoy); d.setDate(d.getDate() - dias); return d.toISOString().slice(0, 10); };
const expedientes = [];
let caso;
for (let i = 1; i <= 30; i++) {
  const numero = `QA ${String(i).padStart(5, "0")}/2026`;
  let e = expPrevios.find(x => x.numeroExpediente === numero);
  if (!e) {
    const titulo = i === 1 ? "QA Reajuste jubilatorio con un título largo para probar el ajuste de línea" : `QA Caso ${i}`;
    const ocupados = new Set();
    let c = casosPrevios.find(x => x.titulo === titulo && !ocupados.has(x.casoId));
    if (!c) c = await api("POST", "/api/casos", { titulo, faseInterna: "Preadministrativa", clientes: [{ clienteId: c1.clienteId, tipoParticipacion: "Titular", esPrincipal: true }, ...(i === 1 ? [{ clienteId: c2.clienteId, tipoParticipacion: "Heredero", esPrincipal: false }] : [])] });
    e = await api("POST", "/api/expedientes", { casoIds: [c.casoId], expedientePadreId: null, tipoExpediente: "Principal", numeroExpediente: numero, caratula: `QA FICTICIA, ANA c/ ANSES s/ REAJUSTES VARIOS ${i}${i === 1 ? " — CARÁTULA EXTENSA PARA VERIFICAR QUE NO ENSANCHE LA FICHA EN CELULAR" : ""}`, juzgado: "Juzgado Federal QA N.º 1", fechaInicio: fecha(400), estadoLegal: null, tipoTramite: null });
  }
  expedientes.push(e);
}
caso = { casoId: (await api("GET", `/api/expedientes/${expedientes[0].expedienteId}`)).casos?.[0]?.casoId };
// 22 con envío: 8 vencidos (hace > 120 días hábiles), 14 en curso. 3 quedan sin envío.
for (let i = 0; i < 22; i++) {
  const d = await api("GET", `/api/expedientes/${expedientes[i].expedienteId}`);
  if (d.envioCobro) continue;
  await api("PUT", `/api/expedientes/${d.expedienteId}`, { casoIds: d.casos.map(x => x.casoId), expedientePadreId: d.expedientePadreId ?? null, tipoExpediente: d.tipoExpediente, numeroExpediente: d.numeroExpediente, caratula: d.caratula, juzgado: d.juzgado, fechaInicio: d.fechaInicio, estadoLegal: d.estadoLegal, tipoTramite: d.tipoTramite, envioCobro: { tipoDocumento: i % 2 ? "Oficio" : "Cedula", fechaEnvio: i < 8 ? fecha(220 + i) : fecha(5 + i * 3) } });
}

const opciones = await api("GET", "/api/agenda/opciones");
const tipo = opciones.tiposEntrada.find(t => t.activo) ?? opciones.tiposEntrada[0];
const resp = opciones.responsables.map(r => r.id).slice(0, 1);
const mes = hoy.toISOString().slice(0, 8);
const entradas = [
  ["QA Audiencia de conciliación", "10"], ["QA Llamado al cliente", "10"], ["QA Presentar escrito", "10"],
  ["QA Revisar notificación con un título bastante largo para comprobar el recorte en la grilla", "10"],
  ["QA Reunión de seguimiento", "12"], ["QA Control de plazos", "18"],
];
const previas = (await api("GET", `/api/agenda?desde=${mes}01&hasta=${mes}28&page=1&pageSize=100`)).items.map(x => x.titulo);
for (const [titulo, dia] of entradas) {
  if (previas.includes(titulo)) continue;
  await api("POST", "/api/agenda", { tipoEntradaAgendaId: tipo.id ?? tipo.tipoEntradaAgendaId, titulo, descripcion: null, prioridad: "Normal", fechaInicio: `${mes}${dia}`, horaInicio: "09:30:00", fechaFin: null, horaFin: null, fechaVencimiento: null, horaVencimiento: null, clienteIds: [c1.clienteId], casoIds: [caso.casoId], expedienteIds: [expedientes[0].expedienteId], responsableIds: resp, recurrencia: null });
}
const sinEnvio = [];
for (const e of expedientes.slice(22)) if (!(await api("GET", `/api/expedientes/${e.expedienteId}`)).envioCobro) sinEnvio.push(e.expedienteId);
const salida = { clienteIds: [c1.clienteId, c2.clienteId], casoId: caso.casoId, expedienteVencido: expedientes[0].expedienteId, expedienteEnCurso: expedientes[8].expedienteId, expedientesSinEnvio: sinEnvio, mesAgenda: mes.slice(0, 7) };
fs.writeFileSync(path.join(DIR, "seed-ids.json"), JSON.stringify(salida, null, 2));
console.log(JSON.stringify(salida));
