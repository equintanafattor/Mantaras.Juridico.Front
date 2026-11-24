import test from 'node:test';
import assert from 'node:assert/strict';
import { aniosEnRango, diasInhabilesPorFecha } from '../src/features/agenda/lib/diasInhabilesCalendario.ts';

test('la grilla de enero y diciembre cruza de año y se consultan ambos', () => {
  assert.deepEqual(aniosEnRango('2026-12-28', '2027-01-31'), [2026, 2027]);
  assert.deepEqual(aniosEnRango('2026-06-01', '2026-07-05'), [2026]);
});

test('sólo se muestran días activos dentro del período visible', () => {
  const dias = [
    { fecha: '2026-12-25', descripcion: 'Navidad', activo: true },
    { fecha: '2026-12-08', descripcion: 'Inmaculada', activo: true },
    { fecha: '2027-01-01', descripcion: 'Año nuevo', activo: false },
    { fecha: '2027-01-15', descripcion: 'Feria judicial', origen: 'Manual', activo: true },
  ];
  const mapa = diasInhabilesPorFecha(dias, '2026-12-28', '2027-01-31');
  assert.deepEqual([...mapa.keys()], ['2027-01-15']);
});
