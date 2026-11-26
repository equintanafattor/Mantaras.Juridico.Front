# QA: filtro "Juzgado" en el listado de expedientes judiciales

La prueba corrió contra la **API real** (`http://localhost:5099`), con el backend en `origin/main` 4bf8624, que incluye el filtro publicado en 9cb3213. La base estaba aislada (`mantaras_juridico_test_juzgados`). Fecha: 2026-11-26.

**Resultado: 87/87 OK** en escritorio (1440×900), celular (390×844, táctil) y tablet (768×1024, táctil).

- Detalle por verificación: [`resultados.json`](resultados.json).
- Salida completa de la corrida: [`salida.txt`](salida.txt).
- Capturas: [`capturas/`](capturas/).

> La base aislada se reutiliza entre funcionalidades y corridas, así que puede contener datos de pruebas anteriores. Cada corrida marca sus propios datos con un sello; esta usó `XPRHQY`.

## Contrato

`GET /api/expedientes?juzgadoId={id}` es opcional y se combina (AND) con `casoId`, `busqueda` y `soloActivos`. El backend aplica el filtro antes de contar y paginar, acepta juzgados inactivos y, si el id no existe, devuelve una lista vacía.

El front:

- Lee el catálogo completo para el selector (`soloActivos=false`, todas las páginas).
- Marca los juzgados inactivos.
- Envía `juzgadoId` al servidor; no filtra solo la página cargada.

## Datos de la corrida

| Dato | Detalle |
|---|---|
| Juzgado A (activo, id 118) | 12 expedientes, uno de ellos dado de baja |
| Juzgado B (id 119) | Dado de baja, con 1 expediente |
| Totales esperados según la API | A con solo activos: 11. A incluyendo inactivos: 12. B: 1. A más búsqueda: 1 |

## Qué se verificó (en cada tamaño de pantalla)

- **Estado inicial:**
  - El filtro muestra "Todos los juzgados" y no envía `juzgadoId`.
  - "Todos los juzgados" es la primera opción de la lista.
- **Búsqueda en el selector:**
  - Encuentra A y B.
  - B aparece marcado "Inactivo".
  - Sin coincidencias, muestra un mensaje.
- **Selección:**
  - Envía `juzgadoId` y `page=1`.
  - El selector muestra el juzgado elegido.
  - El total y las páginas coinciden con los del servidor.
- **Juzgado inactivo:** el selector lo identifica y el listado muestra sus expedientes.
- **Combinación** con la búsqueda, con un expediente administrativo propio y con "Incluir inactivos".
- **Paginación:**
  - `page=2` mantiene `juzgadoId` y trae el resto.
  - Cambiar la selección vuelve a la página 1.
- **Resultados vacíos:** muestra el mensaje con "Limpiar filtros".
- **Limpieza:**
  - "Limpiar" y "Limpiar filtros" vuelven a "Todos los juzgados".
  - El listado muestra el total sin filtros.
  - No sale ninguna petición nueva con `juzgadoId`.
  - Elegir la opción "Todos los juzgados" también quita el filtro.
- **Error del catálogo** (simulado cortando `/api/juzgados`):
  - Aparece un aviso con "Reintentar" y el listado sigue siendo utilizable.
  - El reintento recupera el filtro.
- **Diseño:** sin scroll horizontal, tampoco con la lista abierta.

No hay un patrón de persistencia de filtros en la pantalla (son estados locales), así que el filtro sigue el mismo criterio y no se persiste.

## Cómo repetirla

Requisitos:

- La API en `:5099`, sobre una base aislada.
- El front con `npm run dev` y `NEXT_PUBLIC_API_URL=http://localhost:5099`.
- Playwright instalado.

```bash
QA_EMAIL=<admin de QA> QA_PASSWORD=<contraseña> CHROMIUM_PATH=<chrome.exe> \
  node docs/qa/filtro-juzgado/scripts/filtro-juzgado.mjs <carpeta-capturas>
```

Las credenciales se leen solo de variables de entorno; el script, los resultados y las capturas no las contienen.

## Controles del front

Corridos después de integrar `origin/main` (b8ae308):

- `npm run lint`: OK.
- `tsc --noEmit`: OK.
- `npm run build`: OK.
- Tests unitarios: 37 de 38 pasan, incluido el test nuevo del catálogo completo para el filtro. El único fallo es preexistente y no tiene relación con esta funcionalidad: está documentado en [`fallo-preexistente-casos-administrativos.md`](fallo-preexistente-casos-administrativos.md).
