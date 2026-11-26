# QA: Avisos claros (Agenda, panel, detalle, formulario y configuración)

Probado contra la **API real** (`http://localhost:5099`, backend `origin/main` 4bf8624), usando una base aislada (`mantaras_juridico_test_juzgados`). Fecha: 2026-11-26.

**Resultado: 74/74 OK**, en escritorio (1440×900) y celular (390×844, táctil).

- Detalle por verificación: [`resultados.json`](resultados.json).
- Salida de la corrida: [`salida.txt`](salida.txt).
- Capturas: [`capturas/`](capturas/).

Este cambio es solo de front. No cambia reglas, fechas, estados persistidos, permisos ni contratos. Ninguna pantalla marca avisos al abrirlos ni completa entradas automáticamente: la corrida verifica que el único `PATCH /atender` sea el del botón «Marcar como visto».

> La base aislada se reutiliza entre corridas. Cada corrida marca sus datos con un sello. Antes de empezar, el script marca como vistos los avisos pendientes de corridas anteriores de este mismo script (entradas «QA Avisos …»). Así el bloque, que muestra los 10 primeros, deja ver los de la corrida actual.

## Comportamiento real verificado antes de cambiar textos

Revisado en el código del backend y confirmado por la sesión de backend:

- **«Atender»** (`PATCH /api/recordatorios-agenda/{id}/atender`):
  - Solo registra `Atendido`, la fecha y el usuario.
  - **No toca la entrada ni su estado.**
  - Es idempotente y no se puede desmarcar.
  - Un aviso visto ya no se puede reprogramar ni quitar.
  - Por todo esto, la etiqueta pasa a ser «Marcar como visto».
- **Estados del aviso** (los calcula la API):

  | Estado en la API | Nombre en pantalla | Significado |
  |---|---|---|
  | `Pendiente` | **Programado** | Su fecha todavía no llegó |
  | `Vencido` | **Pendiente de ver** | Ya llegó y nadie lo marcó |
  | `Atendido` | **Visto** | Alguien lo marcó como visto |

  «Vencido» queda reservado para el plazo de la entrada.
- **Canal:** solo `Interno`. Los avisos aparecen dentro del sistema; no hay envío por correo ni WhatsApp.
- **Hora:**
  - Si la fecha base no tiene hora, la API calcula el aviso desde las **09:00 de Argentina**.
  - El aviso siempre tiene una hora concreta. La fecha de la entrada sin hora se muestra «sin hora», sin inventarle una.
- **Avisos automáticos:**
  - Se crean solo al crear la entrada: los de la categoría y, si la generó una regla, también los de la regla.
  - Tienen la misma `fechaCreacion` que la entrada. Los agregados a mano se crean después.
  - Editar fechas no los recalcula.
  - Reprogramar conserva la `fechaCreacion`.
- **Entradas completadas o canceladas:** sus avisos conservan su estado, pero ya no aparecen en Pendientes (`soloEntradasAbiertas`).

## Antes y después

| Dónde | Antes | Después |
|---|---|---|
| Términos | «Recordatorios», «Alertas sin atender», «Avisos» mezclados | **«Avisos»** en Agenda, panel, detalle, formulario y configuración |
| Acción | «Marcar atendido» / «Marcar atendida» | **«Marcar como visto»**, con la aclaración de que *no completa la entrada*; el mensaje posterior confirma que la entrada sigue en su estado |
| Estados | «Programado», «Sin atender», «Atendido» | **Programado**, **Pendiente de ver**, **Visto** |
| Fechas | «Horario actual», «Vence», fecha corta sin día | **«Fecha del aviso»** (día, fecha y hora de Argentina) separada de **«Fecha límite»** / **«Fecha del evento»**, con «sin hora» cuando no hay hora |
| Canal | No se explicaba | «Aparecen dentro del sistema… No se envían por correo ni por WhatsApp», en Agenda, panel, detalle, formulario y configuración |
| Origen | No se mostraba | «Agregado a mano» o «Automático · categoría «X» (1 día antes de la fecha límite)»; los que no coinciden con la categoría se atribuyen a la regla, a una configuración anterior o a una reprogramación |
| Acceso a la entrada | Solo el título era clicable | Título y botón explícito **«Abrir entrada»** |
| Panel de inicio | No mostraba avisos | El mismo bloque «Avisos pendientes de ver», con el mismo total que Agenda |
| Formulario de alta | Avisos solo dentro de «Más opciones» | Resumen **«Cuándo aparecerán los avisos»**, con fecha y hora concretas de cada aviso automático y adicional; las opciones avanzadas siguen en «Más opciones» |
| Agregar aviso en el detalle | Sin vista previa | «Aparecerá el mar, 15/12/2026, 07:00.» |
| Entrada cerrada | Sin aclaración | «Esta entrada está completada: sus avisos ya no aparecen en Pendientes, pero se conservan acá.» |
| Configuración | «Recordatorios predeterminados», «Tipo: X» | «Avisos automáticos», «Categoría: X» / «Regla de vencimiento: X» |

«Marcar como visto» se ofrece en todos los avisos no vistos, como antes. En los **programados** aclara: «Si lo marcás como visto antes de su fecha, ya no aparecerá como pendiente de ver».

## Datos de la corrida

| Entrada | Situación |
|---|---|
| Futura | 3 avisos programados: 2 automáticos de la categoría (inicio sin hora → 09:00; 1 día antes de la fecha límite a las 15:30) y 1 agregado a mano (1 hora antes del inicio) |
| Pasada | 2 avisos pendientes de ver, de la categoría |
| Completada | 2 avisos pendientes de ver, que no aparecen en Pendientes |
| Cancelada | 2 avisos pendientes de ver, que no aparecen en Pendientes |
| Generada por regla | Avisos de la categoría y uno de la regla (2 horas antes de la fecha límite) |

## Qué se verificó (en escritorio y celular)

- Las suposiciones del contrato, por API: automáticos con la misma `fechaCreacion` que la entrada, el manual distinto, y los estados.
- **Agenda › Pendientes:**
  - Bloque con el total de la API.
  - Fecha del aviso y fecha límite «sin hora».
  - Canal explicado.
  - No incluye entradas cerradas.
  - No quedan términos viejos.
  - Sin scroll horizontal.
- **«Abrir entrada»:** abre el detalle correcto, y abrirlo **no marca** los avisos (no sale ningún PATCH).
- **Detalle de la entrada:**
  - «Fecha límite» y «sin hora».
  - «Pendiente de ver» con su origen.
  - **Marcar como visto:** el aviso queda Visto y la entrada sigue Pendiente (verificado por API). El aviso muestra «Visto el … por …».
- **Entrada futura:**
  - 3 programados.
  - Distingue el manual de los automáticos.
  - Horas concretas: 08:00, 09:00 y 15:30.
  - Ofrece «Marcar como visto» en cada programado, con la aclaración.
  - Marcar un programado lo deja Visto y la entrada sigue Pendiente (verificado por API).
  - Vista previa al agregar un aviso.
- **Entrada generada por regla:** el aviso de la regla se atribuye a la regla.
- **Entradas completada y cancelada:** muestran la aclaración y conservan el estado real de sus avisos.
- **Formulario:**
  - Resumen con 2 avisos automáticos y fechas y horas concretas.
  - Canal y horario de Argentina.
  - «Más opciones» sigue disponible.
- **Panel:** el mismo total que la API, y «Abrir entrada» abre el detalle.
- **Configuración:** usa «Avisos automáticos» y aclara el canal.

## Mejoras pendientes de backend (documentadas, no incluidas en esta entrega)

1. **Origen del aviso en el contrato.**
   - `RecordatorioAgendaResponse` no informa si el aviso es de la categoría, de la regla o manual.
   - El front infiere «automático» porque tiene la misma `fechaCreacion` que la entrada, cosa que el backend confirmó. Atribuye a la categoría cuando el aviso coincide con su configuración actual.
   - No se puede distinguir con certeza entre categoría y regla, ni detectar un automático reprogramado.
   - Propuesta: `origen` (`Categoria` | `Regla` | `Manual`) y el nombre de la regla.
   - En los datos históricos, solo se puede reconstruir si fue automático o manual.
2. **Texto sembrado.** La descripción de la regla de seguimiento de cobro, creada en la migración `AgregarSeguimientoCobroJudicial`, dice «Alerta interna a los 120 días hábiles…» y aparece como nota de esas entradas. Para unificar el término haría falta una migración de datos.

## Cómo repetirla

Requisitos:

- La API en `:5099`, sobre una base aislada.
- El front con `npm run dev` y `NEXT_PUBLIC_API_URL=http://localhost:5099`.
- Playwright instalado.

```bash
QA_EMAIL=<admin de QA> QA_PASSWORD=<contraseña> CHROMIUM_PATH=<chrome.exe> \
  node docs/qa/avisos-claros/scripts/avisos-claros.mjs <carpeta-capturas>
```

Las credenciales se leen solo de variables de entorno. No figuran en el script, los resultados ni las capturas.

## Controles del front

- `npm run lint`: OK.
- `tsc --noEmit`: OK.
- `npm run build`: OK.
- Tests unitarios: 42 de 43 pasan, incluidos los 5 nuevos de `tests/avisos-agenda.test.mjs`. El único fallo es preexistente y no tiene relación con este cambio: está documentado en [`fallo-preexistente-casos-administrativos.md`](fallo-preexistente-casos-administrativos.md).
