import test from 'node:test';
import assert from 'node:assert/strict';
import { rangoMes, desplazarMes, mesActualArgentina, mostrarFechaAgenda } from '../src/features/agenda/lib/periodoAgenda.ts';

test('el período mensual incluye el último día, también en años bisiestos', () => {
  assert.deepEqual(rangoMes('2028-02'), { desde: '2028-02-01', hasta: '2028-02-29' });
  assert.equal(rangoMes('2027-02').hasta, '2027-02-28');
  assert.equal(rangoMes('2026-04').hasta, '2026-04-30');
  assert.throws(() => rangoMes('2026-13'));
  assert.throws(() => rangoMes('0000-01'));
});

test('cambiar de mes cruza correctamente el año', () => {
  assert.equal(desplazarMes('2026-01', -1), '2025-12');
  assert.equal(desplazarMes('2026-12', 1), '2027-01');
});

test('el mes actual se calcula en Argentina y DateOnly se presenta sin desplazar el día', () => {
  assert.equal(mesActualArgentina(new Date('2026-10-01T01:00:00Z')), '2026-09');
  assert.equal(mesActualArgentina(new Date('2026-10-01T04:00:00Z')), '2026-10');
  assert.equal(mostrarFechaAgenda('2026-10-01'), '01/10/2026');
});
