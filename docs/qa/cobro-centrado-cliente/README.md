# QA — Expedientes de cobro centrados en el cliente

Prueba contra la **API real** (`http://localhost:5099`) sobre una base aislada (`mantaras_juridico_test_juzgados`). No se usaron respuestas simuladas. Fecha: 2026-11-26.

**Resultado: 86/86 OK** en escritorio (1440×900), celular (390×844, táctil) y tablet (768×1024, táctil).

- Detalle por verificación: [`resultados.json`](resultados.json).
- Salida de la corrida: [`salida.txt`](salida.txt).
- Capturas: [`capturas/`](capturas/).

> La base aislada se reutiliza entre funcionalidades y corridas, así que puede contener datos de pruebas anteriores. Cada corrida marca sus propios datos con un sello; en esta corrida fue `XOG7JD`.

## Contrato usado

`GET /api/expedientes/cobro` suma dos campos a cada ítem. Los parámetros, el orden, la paginación y `totalItems` no cambian, y siempre hay una fila por judicial. El detalle está en el backend, en `docs/brief-front-cobro-centrado-cliente.md`.

- `clientes`: los clientes distintos de todos los casos vinculados al judicial, con `clienteId`, `nombre`, `apellido`, `nombreCompleto`, `dni`, `cuil`, `activo` y `esPrincipal`. Nunca viene `null`; si no hay clientes, viene `[]`.
- `clientePrincipalId`: el único cliente, o el único cliente principal. Es `null` cuando no hay un principal inequívoco.

La búsqueda no cambió. Abarca:

- Del cliente: nombre, apellido, "Apellido, Nombre", "Nombre Apellido", DNI y CUIL.
- Del judicial: número, carátula, juzgado, estado legal y sus observaciones.
- Del caso: el título.

## Datos de la corrida

| Situación | Datos |
|---|---|
| Un cliente con varios judiciales | Cliente 67 con 21 judiciales: el 315 (vencido, Oficio) y 20 incidentes |
| Varios clientes sin principal único | Judicial 336, con los clientes 68 y 69, cada uno principal de un caso distinto |
| Principal único con otros clientes | Judicial 337: principal 70 y cónyuge 71 |
| Sin cliente | Judicial 314. Lo preparó backend, porque la API no permite crearlo: un caso exige un cliente principal y un judicial exige un caso |
| Paginación | 23 judiciales con el sello: 2 páginas de 20 |

## Qué se verificó (en cada tamaño de pantalla)

- **Contrato:**
  - Una fila por judicial.
  - `clientePrincipalId` para el cliente único, para el ambiguo (`null`) y para el principal con otros clientes.
  - `nombreCompleto`.
  - Búsqueda por DNI.
  - Judicial sin cliente.
- **Encabezados y búsqueda:**
  - La columna "Cliente" va primero.
  - Hay un texto de ayuda que indica qué datos busca la API.
- **Listado:**
  - El cliente es el dato principal; la carátula y el número son secundarios.
  - Se conservan el documento, la fecha de envío, el seguimiento y la señal de vencido.
  - Paginación (página 2 con 3 filas).
  - Sin scroll horizontal.
- **Navegación:**
  - El clic en la fila (o la tarjeta) abre la ficha del cliente.
  - El enlace del nombre del cliente también la abre, incluso con Enter desde el teclado (en escritorio).
  - El enlace al judicial abre el judicial y no el cliente.
  - "Ver seguimiento" abre el diálogo sin navegar, y al cerrarlo se sigue en el listado.
- **Asociaciones múltiples:**
  - El principal único muestra "y 1 cliente más" y la fila navega al principal.
  - Si hay varios clientes sin principal único, se avisa y hay un enlace por cliente. La fila no navega y no tiene cursor de navegación. Cada enlace abre el cliente elegido.
  - Si no hay cliente, se muestra "Sin cliente asociado", la fila no navega y se conserva el enlace al judicial.

## Cómo repetirla

Requisitos:

- La API corriendo en `:5099` sobre una base aislada.
- El front corriendo con `npm run dev`, con `NEXT_PUBLIC_API_URL=http://localhost:5099`.
- El judicial "PRUEBA COBRO SIN CLIENTE" ya cargado en esa base.
- Playwright instalado.

```bash
QA_EMAIL=<admin de QA> QA_PASSWORD=<contraseña> CHROMIUM_PATH=<chrome.exe> \
  node docs/qa/cobro-centrado-cliente/scripts/cobro-cliente.mjs <carpeta-capturas>
```

Las credenciales se leen solo de variables de entorno; el script, los resultados y las capturas no las contienen.

## Controles del front

- `npm run lint`: OK.
- `tsc --noEmit`: OK.
- `npm run build`: OK.
- Tests unitarios (`node --test tests/*.test.mjs`): todos OK, incluido `tests/cobro-cliente.test.mjs`, salvo un fallo preexistente que no tiene relación con esta funcionalidad. Está documentado en [`fallo-preexistente-casos-administrativos.md`](fallo-preexistente-casos-administrativos.md).
