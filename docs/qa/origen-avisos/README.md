# QA: origen explícito de los avisos

Se probó contra la **API real** (`http://localhost:5099`), sobre una base aislada (`mantaras_juridico_test_juzgados`). El backend corrió desde la rama `feat/origen-avisos`, creada a partir de 4bf8624 y todavía sin publicar. Fecha: 2026-11-27.

**Resultado: 28/28 OK**, en escritorio (1440×900) y celular (390×844, táctil).

- Detalle de cada verificación: [`resultados.json`](resultados.json).
- Salida completa: [`salida.txt`](salida.txt).
- Capturas: [`capturas/`](capturas/).

Esto resuelve la primera mejora pendiente de backend que quedó registrada en [`../avisos-claros/README.md`](../avisos-claros/README.md).

> La base aislada se reutiliza entre corridas. Cada corrida marca sus datos con un sello; la que figura acá es `YZ6APE`. Una corrida anterior (`YZ552W`) falló solo por un error del script: comparaba el nombre de la categoría sin tener en cuenta que el backend lo guarda en mayúsculas.

## Contrato consumido

Campos de `RecordatorioAgendaResponse`, presentes en GET, POST `/entrada/{id}`, PUT `/{id}` y PATCH `/{id}/atender`:

| Campo | Valores |
|---|---|
| `origen` | `Manual` \| `Categoria` \| `Regla` \| `Desconocido`. Siempre viene. `Desconocido` corresponde a todos los avisos anteriores al contrato. |
| `origenId` | Id de la categoría o de la regla. Es `null` con `Manual` o `Desconocido`. |
| `origenNombre` | Nombre **actual** de la categoría o de la regla: refleja los cambios de nombre y se devuelve aunque esté dada de baja. Es `null` con `Manual` o `Desconocido`. Los nombres de categoría llegan en mayúsculas, porque el catálogo los normaliza así. |

Reglas que confirmó el backend (el detalle está en el brief del back, `docs/brief-front-origen-avisos.md`):

- El origen se guarda al crear el aviso.
- Reprogramar y marcar como visto conservan el origen.
- Los avisos históricos quedan como `Desconocido`: no se deduce nada a partir de las fechas.
- Si un aviso de regla coincide en fecha con uno de categoría, queda uno solo y figura como `Categoria`.

## Qué se muestra

| Contrato | Texto |
|---|---|
| `Manual` | Agregado a mano |
| `Categoria` + nombre | Automático · categoría «X» |
| `Regla` + nombre | Automático · regla «X» |
| `Desconocido`, `null`, campo ausente, nombre vacío o un valor no previsto | Origen no disponible |

Se **eliminó** la deducción anterior, que comparaba la fecha de creación del aviso con la de la entrada y la configuración actual de la categoría. También se quitó la consulta de avisos predeterminados que el detalle hacía solo para eso. «Marcar como visto» no cambió: ni la acción ni cuándo está disponible.

## Datos de la corrida

| Entrada | Avisos |
|---|---|
| Futura (408) | 2 de categoría y 1 manual. Se reprogramaron uno de categoría y el manual. Después se renombró la categoría. |
| Generada por regla (409) | 1 de regla y 2 de categoría |
| Histórica (182, de una corrida anterior al contrato) | 3 avisos con origen `Desconocido` |

## Qué se verificó (en escritorio y celular)

- **Por API:**
  - Los orígenes y la cantidad de avisos de cada origen.
  - Que se muestra el nombre actual después de renombrar la categoría.
  - Que reprogramar conserva el origen, tanto en el aviso de categoría como en el manual.
  - Que la regla aparece con su nombre.
  - Que los avisos `Manual` vienen sin id ni nombre.
  - Que los históricos llegan como `Desconocido`.
- **En el detalle:**
  - «Agregado a mano» y «Automático · categoría «NOMBRE ACTUAL»». El nombre anterior ya no aparece.
  - Los dos avisos reprogramados conservan su origen.
  - «Automático · regla «X»» en la entrada generada por regla.
  - En los históricos, todos los avisos dicen «Origen no disponible», sin inventar «Automático» ni «Agregado a mano».
  - No queda ningún texto de la deducción anterior.
  - «Marcar como visto» sigue apareciendo en cada aviso no visto.
  - No hay scroll horizontal.

## Cambio de backend incluido en su rama

En los seguimientos de cobro nuevos, la nota dice «Aviso interno a los 120 días hábiles…» en lugar de «Alerta interna…». Una migración de datos actualiza solo las notas automáticas originales y la regla, cuando no fueron personalizadas. Esto resuelve la segunda mejora pendiente registrada en avisos claros. No requiere cambios en el front.

## Cómo repetirla

Requisitos:

- La API de la rama `feat/origen-avisos` del back, en `:5099`, sobre una base aislada.
- El front corriendo con `npm run dev` y `NEXT_PUBLIC_API_URL=http://localhost:5099`.
- Playwright instalado.

```bash
QA_EMAIL=<admin de QA> QA_PASSWORD=<contraseña> CHROMIUM_PATH=<chrome.exe> \
  node docs/qa/origen-avisos/scripts/origen-avisos.mjs <carpeta-capturas>
```

Las credenciales se leen solo de variables de entorno. No aparecen en el script, en los resultados ni en las capturas.

## Controles del front

- `npm run lint`: OK.
- `tsc --noEmit`: OK.
- `npm run build`: OK.
- Tests unitarios: 43 de 44 pasan, incluidos los 6 de `tests/avisos-agenda.test.mjs` (con los nuevos casos de origen y de «Origen no disponible»). El único fallo es preexistente y no tiene relación con este cambio: está documentado en [`fallo-preexistente-casos-administrativos.md`](fallo-preexistente-casos-administrativos.md).
