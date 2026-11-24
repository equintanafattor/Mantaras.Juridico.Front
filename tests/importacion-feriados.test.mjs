import test from 'node:test';
import assert from 'node:assert/strict';
import { leerAnioImportacion, interpretarErrorImportacion, explicarConflicto, fechasRevisionVigentes, origenDiaInhabil, seAplicaAlConfirmar } from '../src/features/agenda/lib/importacionFeriados.ts';

const item = (extra) => ({ fecha: '2025-05-01', descripcion: 'Día del Trabajador', categoria: 'FeriadoNacional', estado: 'Nuevo', registrosFuente: [], diaInhabilIdExistente: null, fechaExistente: null, origenExistente: null, descripcionExistente: null, activoExistente: null, modificadoManualmenteExistente: null, motivo: null, ...extra });

test('el año de importación respeta el rango del backend', () => {
  assert.equal(leerAnioImportacion(' 2025 '), 2025);
  for (const malo of ['', '25', '1999', '2101', '20a5', '20255']) assert.throws(() => leerAnioImportacion(malo));
});

test('los errores de la API se traducen por código', () => {
  const api = (status, code) => Object.assign(new Error('x'), { status, errors: [{ code, message: 'mensaje api' }] });
  assert.equal(interpretarErrorImportacion(api(404, 'DiasInhabiles.AnioNoDisponible')).tipo, 'anio-no-disponible');
  assert.equal(interpretarErrorImportacion(api(503, 'DiasInhabiles.FuenteNoDisponible')).tipo, 'fuente-no-disponible');
  assert.equal(interpretarErrorImportacion(api(502, 'DiasInhabiles.FuenteInvalida')).tipo, 'fuente-invalida');
  assert.equal(interpretarErrorImportacion(api(409, 'DiasInhabiles.VistaPreviaDesactualizada')).tipo, 'desactualizada');
  assert.deepEqual(interpretarErrorImportacion(api(400, 'DiasInhabiles.DatosInvalidos')).mensaje, 'mensaje api');
  assert.equal(interpretarErrorImportacion(new TypeError('Failed to fetch')).mensaje, 'Failed to fetch');
});

test('los conflictos se explican aunque el backend no envíe motivo', () => {
  assert.equal(explicarConflicto(item({ estado: 'Conflicto', motivo: 'Del backend' })), 'Del backend');
  assert.match(explicarConflicto(item({ estado: 'Conflicto', fechaExistente: '2025-05-02' })), /02\/05\/2025/);
  assert.match(explicarConflicto(item({ estado: 'Conflicto', activoExistente: false })), /desactivado/);
});

test('sólo se envían fechas de revisión que siguen siendo importables', () => {
  const revision = [item({ fecha: '2025-03-31' }), item({ fecha: '2025-11-21', estado: 'Existente' }), item({ fecha: '2025-04-18', estado: 'Actualizable' })];
  assert.deepEqual(fechasRevisionVigentes(['2025-11-21', '2025-04-18', '2025-03-31', '2025-12-08'], revision), ['2025-03-31', '2025-04-18']);
  assert.equal(seAplicaAlConfirmar(item({ estado: 'Conflicto' })), false);
});

test('el origen distingue importados, modificados y manuales', () => {
  assert.deepEqual(origenDiaInhabil({ origen: 'FeriadoNacional', modificadoManualmente: false }), { etiqueta: 'Feriado nacional', importado: true });
  assert.equal(origenDiaInhabil({ origen: 'FeriadoNacional', modificadoManualmente: true }).etiqueta, 'Feriado nacional · modificado');
  assert.equal(origenDiaInhabil({ origen: 'Manual' }).importado, false);
});
