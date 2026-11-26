import test from 'node:test';
import assert from 'node:assert/strict';
import { nombreJuzgado, normalizarBusqueda, referenciaJuzgado } from '../src/features/catalogos/lib/juzgado.ts';

const exp = (juzgadoId, juzgadoNombre, juzgadoActivo) => ({ juzgadoId, juzgadoNombre, juzgadoActivo });

test('sin juzgado, los tres campos en null no generan referencia', () => {
  assert.equal(referenciaJuzgado(exp(null, null, null)), null);
  assert.equal(nombreJuzgado(exp(null, null, null)), null);
});

test('el juzgado inactivo se conserva como referencia y se marca al mostrarlo', () => {
  assert.deepEqual(referenciaJuzgado(exp(7, 'JUZGADO FEDERAL N° 2', false)), { id: 7, nombre: 'JUZGADO FEDERAL N° 2', activo: false });
  assert.equal(nombreJuzgado(exp(7, 'JUZGADO FEDERAL N° 2', false)), 'JUZGADO FEDERAL N° 2 (inactivo)');
  assert.equal(nombreJuzgado(exp(7, 'JUZGADO FEDERAL N° 2', true)), 'JUZGADO FEDERAL N° 2');
});

test('la búsqueda ignora mayúsculas, tildes y espacios repetidos', () => {
  assert.equal(normalizarBusqueda('  JUZGADO   FEDERAL DE PARANÁ '), 'juzgado federal de parana');
  assert.ok(normalizarBusqueda('JUZGADO FEDERAL DE PARANÁ').includes(normalizarBusqueda('parana')));
});

test('el filtro lee el catálogo completo, incluidos los inactivos y todas las páginas', async () => {
  const { leerOpciones } = await import('../src/features/catalogos/lib/leerOpciones.ts');
  const paginas = {
    1: { page: 1, hasNextPage: true, items: [{ id: 1, nombre: 'A', activo: true }, { id: 2, nombre: 'B', activo: false }] },
    2: { page: 2, hasNextPage: false, items: [{ id: 3, nombre: 'C', activo: true }] },
  };
  const leer = async (page) => paginas[page];
  assert.deepEqual((await leerOpciones(leer, true)).map((j) => j.id), [1, 2, 3]);
  assert.deepEqual((await leerOpciones(leer)).map((j) => j.id), [1, 3]);
});
