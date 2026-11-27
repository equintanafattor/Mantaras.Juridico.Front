import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularFechaAviso, describirOrigenAviso, ESTADO_AVISO, fechaHoraAviso, instanteArgentina, resumenAvisosFormulario } from '../src/features/agenda/lib/avisosAgenda.ts';

const entrada = { fechaInicio: '2026-12-01', horaInicio: null, fechaVencimiento: '2026-12-10', horaVencimiento: '15:30:00', fechaCreacion: '2026-11-26T12:00:00.123456Z' };

test('los estados reales del aviso se nombran sin "Vencido"', () => {
  assert.deepEqual(ESTADO_AVISO, { Pendiente: 'Programado', Vencido: 'Pendiente de ver', Atendido: 'Visto' });
});

test('sin hora se usa las 9:00 de Argentina, como backend; con hora, la hora real', () => {
  assert.equal(instanteArgentina('2026-12-01', null).toISOString(), '2026-12-01T12:00:00.000Z');
  assert.equal(instanteArgentina('2026-12-10', '15:30:00').toISOString(), '2026-12-10T18:30:00.000Z');
  assert.equal(calcularFechaAviso(entrada, { baseCalculo: 'Vencimiento', minutosAnticipacion: 1440 }).toISOString(), '2026-12-09T18:30:00.000Z');
  assert.equal(calcularFechaAviso({ ...entrada, fechaVencimiento: null }, { baseCalculo: 'Vencimiento', minutosAnticipacion: 0 }), null);
});

test('la fecha del aviso se muestra en horario de Argentina', () => {
  assert.match(fechaHoraAviso('2026-12-09T18:30:00Z'), /09\/12\/2026.*15:30/);
});

test('el origen sale del contrato, sin deducirlo de fechas', () => {
  assert.equal(describirOrigenAviso({ origen: 'Manual', origenNombre: null }), 'Agregado a mano');
  assert.equal(describirOrigenAviso({ origen: 'Categoria', origenNombre: 'Plazo procesal' }), 'Automático · categoría «Plazo procesal»');
  assert.equal(describirOrigenAviso({ origen: 'Regla', origenNombre: 'Seguimiento de cobro' }), 'Automático · regla «Seguimiento de cobro»');
});

test('históricos, campos ausentes o valores desconocidos: "Origen no disponible"', () => {
  for (const aviso of [{ origen: 'Desconocido', origenId: null, origenNombre: null }, { origen: null, origenNombre: null }, {}, { origen: 'Categoria', origenNombre: null }, { origen: 'Regla', origenNombre: '  ' }, { origen: 'Otro', origenNombre: 'X' }]) {
    assert.equal(describirOrigenAviso(aviso), 'Origen no disponible', JSON.stringify(aviso));
  }
  // Ni siquiera con la misma fecha de creación que la entrada se infiere "automático".
  assert.equal(describirOrigenAviso({ fechaCreacion: '2026-11-26T12:00:00Z' }), 'Origen no disponible');
});

test('el resumen del formulario ordena, deduplica como backend y explica los que no se crean', () => {
  const predeterminados = [
    { recordatorioPredeterminadoId: 1, baseCalculo: 'Vencimiento', minutosAnticipacion: 1440, activo: true },
    { recordatorioPredeterminadoId: 2, baseCalculo: 'Inicio', minutosAnticipacion: 0, activo: false },
  ];
  const items = resumenAvisosFormulario(entrada, predeterminados, [{ baseCalculo: 'Inicio', minutosAnticipacion: 60 }, { baseCalculo: 'Vencimiento', minutosAnticipacion: 1440 }]);
  assert.deepEqual(items.map(i => [i.fecha?.toISOString(), i.automatico]), [['2026-12-01T11:00:00.000Z', false], ['2026-12-09T18:30:00.000Z', true]]);
  const sinLimite = resumenAvisosFormulario({ ...entrada, fechaVencimiento: null }, predeterminados, []);
  assert.equal(sinLimite[0].fecha, null);
  assert.match(sinLimite[0].motivoSinFecha, /no tiene fecha límite/);
});
