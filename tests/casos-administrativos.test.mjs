import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORM_CASO_INICIAL, crearFormDesdeCaso, crearRequestDesdeForm,
  esCasoFormValido, datosAdministrativosDesdeForm,
} from '../src/features/casos/lib/casoForm.ts';
import { leerOpciones } from '../src/features/catalogos/lib/leerOpciones.ts';

const cliente = { clienteId: 9, nombreCompleto: 'Cliente de prueba', dni: null, cuil: null, tipoParticipacion: 'Titular', esPrincipal: true };
const form = () => ({ ...FORM_CASO_INICIAL, titulo: ' Administrativo ', clientes: [{ ...cliente }] });
const activo = (id = 1) => ({ id, nombre: `OPCIÓN ${id}`, activo: true });
const detalle = () => ({ titulo: 'Histórico', faseInterna: 'Preadministrativa', tipoTramite: 'Trámite original', clientes: [cliente], numeroExpedienteAnses: '000-123', tipoBeneficioId: 1, tipoBeneficioNombre: 'JUBILACIÓN', tipoBeneficioActivo: false, tipoExpedienteAdministrativoId: 2, tipoExpedienteAdministrativoNombre: 'REAJUSTE', tipoExpedienteAdministrativoActivo: false });

test('alta sin campos nuevos envía null explícito y preserva participantes', () => {
  const f = form();
  assert.equal(esCasoFormValido(f), true);
  assert.deepEqual(crearRequestDesdeForm(f), { titulo: 'Administrativo', faseInterna: 'Preadministrativa', tipoTramite: null, clientes: [{ clienteId: 9, tipoParticipacion: 'Titular', esPrincipal: true }], numeroExpedienteAnses: null, tipoBeneficioId: null, tipoExpedienteAdministrativoId: null });
});
test('mapea datos administrativos, sin confundir TipoTramite ni perder ceros', () => {
  const f = { ...form(), numeroExpedienteAnses: ' 000-123/2026 ', tipoTramite: ' Otro trámite ', tipoBeneficio: activo(), tipoAdministrativo: activo(2) };
  const r = crearRequestDesdeForm(f);
  assert.equal(r.numeroExpedienteAnses, '000-123/2026');
  assert.equal(r.tipoTramite, 'Otro trámite');
  assert.equal(r.tipoBeneficioId, 1);
  assert.equal(r.tipoExpedienteAdministrativoId, 2);
  assert.equal('tipoBeneficioOriginal' in r, false);
});
test('la edición permite conservar ambos catálogos históricos inactivos', () => {
  const d = detalle(); const copia = structuredClone(d);
  const f = crearFormDesdeCaso(d);
  assert.equal(esCasoFormValido(f), true);
  assert.equal(crearRequestDesdeForm(f).tipoBeneficioId, 1);
  assert.equal(crearRequestDesdeForm(f).tipoExpedienteAdministrativoId, 2);
  f.clientes[0].esPrincipal = false;
  assert.deepEqual(d, copia);
});
test('rechaza nuevas asignaciones inactivas, incluidos IDs diferentes del histórico', () => {
  const f = crearFormDesdeCaso(detalle());
  assert.equal(esCasoFormValido({ ...f, tipoBeneficio: { ...activo(3), activo: false } }), false);
  assert.equal(esCasoFormValido({ ...f, tipoAdministrativo: { ...activo(3), activo: false } }), false);
  assert.equal(esCasoFormValido({ ...form(), tipoBeneficio: { ...activo(), activo: false } }), false);
});
test('Sin asignar y ANSES vacío limpian los campos sin enviar nombres ni metadatos', () => {
  const f = { ...crearFormDesdeCaso(detalle()), numeroExpedienteAnses: '  ', tipoBeneficio: null, tipoAdministrativo: null };
  const r = crearRequestDesdeForm(f);
  assert.equal(esCasoFormValido(f), true);
  assert.equal(r.numeroExpedienteAnses, null);
  assert.equal(r.tipoBeneficioId, null);
  assert.equal(r.tipoExpedienteAdministrativoId, null);
  assert.equal('tipoBeneficioNombre' in r, false);
});
test('tras persistir null ya no permite recuperar un catálogo inactivo', () => {
  const f = crearFormDesdeCaso({ ...detalle(), tipoBeneficioId: null });
  f.tipoBeneficio = { ...activo(), activo: false };
  assert.equal(esCasoFormValido(f), false);
});
test('ANSES admite 100 caracteres, rechaza 101 y no convierte el texto en número', () => {
  assert.equal(esCasoFormValido({ ...form(), numeroExpedienteAnses: '0'.repeat(100) }), true);
  assert.equal(esCasoFormValido({ ...form(), numeroExpedienteAnses: '0'.repeat(101) }), false);
  assert.equal(crearRequestDesdeForm({ ...form(), numeroExpedienteAnses: '0' }).numeroExpedienteAnses, '0');
});
test('no permite IDs inválidos ni más de un participante principal', () => {
  for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.equal(esCasoFormValido({ ...form(), tipoBeneficio: activo(id) }), false);
  assert.equal(esCasoFormValido({ ...form(), clientes: [] }), false);
  assert.equal(esCasoFormValido({ ...form(), clientes: [cliente, { ...cliente, clienteId: 10 }] }), false);
});
test('resumen del alta conjunta coincide con IDs y número enviados', () => {
  const f = crearFormDesdeCaso(detalle());
  const r = crearRequestDesdeForm(f); const resumen = datosAdministrativosDesdeForm(f);
  for (const key of ['numeroExpedienteAnses', 'tipoBeneficioId', 'tipoExpedienteAdministrativoId']) assert.equal(resumen[key], r[key]);
  assert.equal(resumen.tipoBeneficioActivo, false);
});
test('carga más de 100 opciones y deduplica entre páginas', async () => {
  const llamadas = [];
  const items = await leerOpciones(async page => {
    llamadas.push(page);
    return { page, hasNextPage: page === 1, items: page === 1 ? Array.from({ length: 100 }, (_, i) => activo(i + 1)) : [activo(100), activo(101)] };
  });
  assert.deepEqual(llamadas, [1, 2]);
  assert.equal(items.length, 101);
  assert.equal(items.at(-1).id, 101);
});
test('catálogo vacío es válido, pero páginas inconsistentes o repetidas fallan', async () => {
  assert.deepEqual(await leerOpciones(async page => ({ page, hasNextPage: false, items: [] })), []);
  await assert.rejects(leerOpciones(async () => ({ page: 2, hasNextPage: false, items: [] })));
  await assert.rejects(leerOpciones(async page => ({ page, hasNextPage: true, items: [activo()] })));
});
test('un error en una página rechaza el conjunto, sin entregar opciones parciales', async () => {
  await assert.rejects(leerOpciones(async page => {
    if (page === 2) throw new Error('Sin conexión');
    return { page, hasNextPage: true, items: [activo()] };
  }), /Sin conexión/);
});
test('las opciones excluyen registros inactivos incluso si la API los devuelve', async () => {
  const items = await leerOpciones(async page => ({ page, hasNextPage: false, items: [activo(), { ...activo(2), activo: false }] }));
  assert.deepEqual(items.map(x => x.id), [1]);
});
