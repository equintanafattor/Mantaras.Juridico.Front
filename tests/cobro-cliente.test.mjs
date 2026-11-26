import test from 'node:test';
import assert from 'node:assert/strict';
import { destinoClienteCobro, documentoCliente } from '../src/features/expedientes/lib/clienteCobro.ts';

const cliente = (clienteId, extra = {}) => ({
  clienteId, nombre: `N${clienteId}`, apellido: `A${clienteId}`, nombreCompleto: `A${clienteId}, N${clienteId}`,
  dni: null, cuil: null, activo: true, esPrincipal: false, ...extra,
});

test('sin clientes asociados no navega a ningún cliente', () => {
  assert.deepEqual(destinoClienteCobro({ clientes: [], clientePrincipalId: null }), { tipo: 'sin-cliente' });
  // Tolera una respuesta previa al contrato, sin el campo.
  assert.deepEqual(destinoClienteCobro({ clientePrincipalId: null }), { tipo: 'sin-cliente' });
});

test('con el principal que resuelve backend, la fila lleva a ese cliente', () => {
  const destino = destinoClienteCobro({ clientes: [cliente(1, { esPrincipal: true }), cliente(2)], clientePrincipalId: 1 });
  assert.equal(destino.tipo, 'cliente');
  assert.equal(destino.cliente.clienteId, 1);
  assert.deepEqual(destino.otros.map((c) => c.clienteId), [2]);
});

test('un único cliente es inequívoco aunque backend no lo marque', () => {
  const destino = destinoClienteCobro({ clientes: [cliente(5)], clientePrincipalId: null });
  assert.equal(destino.tipo, 'cliente');
  assert.equal(destino.cliente.clienteId, 5);
});

test('varios clientes sin principal inequívoco ofrecen todos, sin elegir uno arbitrario', () => {
  const clientes = [cliente(1, { esPrincipal: true }), cliente(2, { esPrincipal: true }), cliente(3)];
  assert.deepEqual(destinoClienteCobro({ clientes, clientePrincipalId: null }), { tipo: 'varios', clientes });
  // Un id que no está entre los clientes no se usa para navegar.
  assert.equal(destinoClienteCobro({ clientes, clientePrincipalId: 99 }).tipo, 'varios');
});

test('el documento prioriza DNI y usa CUIL si falta', () => {
  assert.equal(documentoCliente({ dni: '30111222', cuil: '20-30111222-3' }), 'DNI 30111222');
  assert.equal(documentoCliente({ dni: null, cuil: '20-30111222-3' }), 'CUIL 20-30111222-3');
  assert.equal(documentoCliente({ dni: null, cuil: null }), null);
});
