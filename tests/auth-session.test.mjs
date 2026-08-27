import test from 'node:test';
import assert from 'node:assert/strict';
import {
  guardarSesion, eliminarSesion, obtenerSesion, obtenerAccessToken,
  obtenerSnapshotSesion, obtenerSnapshotSesionServidor, suscribirSesion,
  notificarSesionNoAutorizada, AUTH_UNAUTHORIZED_EVENT,
} from '../src/features/autenticacion/lib/authSession.ts';

const key = 'mantaras.auth.session';
const sesion = () => ({ accessToken: 'token-ficticio-para-pruebas', expiraEnUtc: '2099-01-01T00:00:00Z', usuario: { usuarioId: 1, nombre: 'PRUEBA', email: 'prueba@example.invalid', roles: ['Usuario'] } });
function navegador() {
  const valores = new Map();
  const events = new EventTarget();
  const storage = {
    getItem: k => valores.get(k) ?? null,
    setItem: (k, v) => valores.set(k, v),
    removeItem: k => valores.delete(k),
  };
  globalThis.window = Object.assign(events, { sessionStorage: storage });
  return window;
}

test('SSR no accede al navegador y distingue hidratación de sesión ausente', () => {
  delete globalThis.window;
  assert.equal(obtenerSnapshotSesionServidor(), undefined);
  assert.equal(obtenerSnapshotSesion(), null);
  assert.equal(obtenerSesion(), null);
});
test('snapshot estable, sesión persistida y token disponibles tras una recarga', () => {
  const w = navegador();
  w.sessionStorage.setItem(key, JSON.stringify(sesion()));
  assert.equal(obtenerSnapshotSesion(), obtenerSnapshotSesion());
  assert.deepEqual(obtenerSesion(), sesion());
  assert.equal(obtenerAccessToken(), sesion().accessToken);
});
test('login y logout notifican; desuscribirse elimina el listener', () => {
  navegador(); let cambios = 0;
  const cancelar = suscribirSesion(() => cambios++);
  guardarSesion(sesion());
  assert.equal(cambios, 1);
  eliminarSesion();
  assert.equal(cambios, 2);
  assert.equal(obtenerSnapshotSesion(), null);
  cancelar(); guardarSesion(sesion());
  assert.equal(cambios, 2);
});
test('datos corruptos o vencidos no se aceptan ni mutan durante el snapshot', () => {
  const w = navegador(); let cambios = 0;
  const cancelar = suscribirSesion(() => cambios++);
  for (const raw of ['{', 'null', '{}', JSON.stringify({ ...sesion(), expiraEnUtc: '2000-01-01' }), JSON.stringify({ ...sesion(), accessToken: '' }), JSON.stringify({ ...sesion(), expiraEnUtc: 'no-fecha' })]) {
    w.sessionStorage.setItem(key, raw);
    assert.equal(obtenerSnapshotSesion(), null);
    assert.equal(w.sessionStorage.getItem(key), raw);
  }
  assert.equal(cambios, 0);
  assert.equal(obtenerAccessToken(), null);
  assert.equal(w.sessionStorage.getItem(key), null);
  assert.equal(cambios, 1);
  cancelar();
});
test('401 conserva el evento existente para invalidar sesión y caché en el provider', () => {
  const w = navegador(); let avisos = 0;
  w.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => avisos++);
  notificarSesionNoAutorizada();
  assert.equal(avisos, 1);
});
test('storage solo notifica cambios de esta sesión en su área', () => {
  const w = navegador(); let cambios = 0;
  const cancelar = suscribirSesion(() => cambios++);
  const emitir = (k, area) => {
    const e = new Event('storage');
    Object.defineProperties(e, { key: { value: k }, storageArea: { value: area } });
    w.dispatchEvent(e);
  };
  emitir('otra-clave', w.sessionStorage);
  emitir(key, {});
  assert.equal(cambios, 0);
  emitir(key, w.sessionStorage);
  emitir(null, w.sessionStorage);
  assert.equal(cambios, 2);
  cancelar(); emitir(key, w.sessionStorage);
  assert.equal(cambios, 2);
});
