# QA del catálogo de Juzgados

Fecha: 2026-11-25 · Rama: `feat/catalogo-juzgados` · Contratos: `docs/brief-front-catalogo-juzgados.md` del repo del backend.

## Resultado

| Verificación | Resultado |
|---|---|
| `npm run build` | OK |
| `npm run lint` | OK |
| `npx tsc --noEmit` | OK |
| `node --test tests/*.mjs` | 31 de 32. El fallo de `casos-administrativos` es **preexistente**: falla igual en `main` sin estos cambios |
| Circuito E2E contra la API real, escritorio (1440×900) | 42 de 42 |
| Circuito E2E contra la API real, celular (390×844, táctil) | 42 de 42 |

El detalle de cada verificación está en [`resultados.json`](resultados.json) y las capturas en [`capturas/`](capturas/).

## Entorno

- API del backend en `http://localhost:5099` (rama `feat/catalogo-juzgados`), contra la base aislada `mantaras_juridico_test_juzgados`: un clon de desarrollo con la migración `AgregarCatalogoJuzgados` aplicada y expedientes de prueba "PRUEBA JZ …". No se usó la base de desarrollo ni respuestas simuladas.
- Front con `next dev` en `http://localhost:3000`.
- Usuario administrador que existe solo en la base aislada. Las credenciales no se guardan en el repositorio.

## Qué cubre el circuito (en cada tamaño)

1. **Catálogo:** alta (con espacios y minúsculas; se guarda normalizado en mayúsculas), edición del nombre, baja, listado con inactivos, restauración, y estado vacío de la búsqueda.
2. **Duplicados:** rechazo (409) de una variante en mayúsculas y espacios, y de un nombre igual a uno dado de baja.
3. **Juzgados migrados:** se ven en el detalle y se precargan en la edición. "PRUEBA JZ 03" (minúsculas y acento) muestra el juzgado unificado y "PRUEBA JZ 07" (null) queda sin juzgado.
4. **Selector con búsqueda en la edición:** sin distinguir mayúsculas ni tildes, estado sin resultados y selección con teclado. El `PUT` envía `juzgadoId` y no el texto anterior.
5. **Nombre actualizado:** después de renombrar desde Catálogos, el nombre nuevo aparece en el encabezado y en los datos del expediente judicial, en el detalle del expediente administrativo, y la búsqueda del listado de expedientes lo encuentra.
6. **Juzgado inactivo:** se marca "(inactivo)" en el detalle. En la edición se precarga y se ofrece como "valor guardado"; al guardar, el `PUT` conserva el mismo id y la API responde 200. No se ofrece en otro expediente ni en el alta.
7. **Quitar la selección:** el `PUT` envía `juzgadoId: null` explícito y la API desvincula el juzgado. Después, el juzgado inactivo ya no se ofrece.
8. **Alta de expediente judicial** (con un expediente administrativo existente): selección con búsqueda. El `POST` envía `juzgadoId` y la respuesta 201 trae `juzgadoNombre`.
9. **Error de carga del selector:** aviso con "Reintentar"; al reintentar, se recuperan las opciones.
10. **Sin scroll horizontal** en Catálogos y con el selector abierto.

## Datos usados y datos que quedan en la base aislada

- Los expedientes "PRUEBA JZ 01–10" no tienen expediente administrativo vinculado y el formulario exige uno, por eso se usaron solo en lectura. Las ediciones se hicieron sobre los expedientes 1 y 2 (escritorio) y 7 y 2 (celular) del clon. Al terminar, el script restaura su juzgado original por API.
- **La base puede contener datos de varias corridas**, de este script y de las pruebas del backend: juzgados QA con ids 12–16 ("JUZGADO QA FRONT …", activos o inactivos según en qué paso terminó cada corrida), expedientes judiciales 24–27 ("PRUEBA JZ QA FRONT ALTA …", creados por el paso de alta), y registros "PRUEBA JZ <marca>" dados de baja que dejaron las pruebas del backend. Los ids de la última corrida están en `resultados.json` (`creados`). Los nombres llevan un sello por corrida, así que el script se puede repetir sin limpiar.

## Cómo repetirlo

Requiere la API en `:5099` contra la base aislada, el front en `:3000` con `NEXT_PUBLIC_API_URL=http://localhost:5099`, y Playwright instalado fuera del repo (no es dependencia del proyecto).

```sh
QA_EMAIL=… QA_PASSWORD=… CHROMIUM_PATH=…/chrome.exe node scripts/juzgados.mjs capturas
```

Antes de correrlo, verificá que la API apunte a la base aislada: al arrancar aplica las migraciones pendientes.

## Fuera de alcance

- Alta de expediente judicial junto con un expediente administrativo nuevo (asistente de 3 pasos). Usa el mismo selector y el mismo `juzgadoId`; el typecheck cubre el request, pero no se recorrió de punta a punta.
