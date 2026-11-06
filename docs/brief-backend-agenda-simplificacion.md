# Brief para backend: simplificación de Agenda y cobro

Rama: `feat/agenda-entregable-2` (front y back). Contratos revisados contra `origin/feat/agenda-entregable-2` del back (commit `c16914e`).

El front ya funciona con la API actual. Los puntos 1 a 4 corrigen o abaratan lo que hoy se resuelve con varias consultas o queda inconsistente. Los puntos 5 y 6 no se pueden resolver desde el front.

## 1. "Vencido" del seguimiento de cobro ignora el estado

**Problema.** En Agenda, `estaVencida` es `false` si la entrada está `Completada` o `Cancelada` (`AgendaService.CalcularVencimiento`). En cobro no pasa lo mismo:

- `EnvioCobroResponse.seguimientoVencido = diasParaSeguimiento < 0` (`ExpedientesService`, línea ~550), sin mirar el estado.
- El filtro `GET /api/expedientes/cobro?seguimientoVencido=true` (`ExpedienteRepository.ConstruirConsultaCobro`) compara solo `FechaVencimiento < fechaActual`.

Resultado: un seguimiento ya completado aparece en el filtro "Plazo vencido". El front oculta la etiqueta "Vencido" cuando el seguimiento está cerrado, pero no puede corregir el filtro porque la lista viene paginada.

**Propuesta.** Usar el mismo criterio que Agenda:

- `seguimientoVencido = abierta && dias < 0`, donde `abierta` significa que el estado no es `Completada` ni `Cancelada`.
- `seguimientoVencido=true` filtra los seguimientos abiertos con fecha pasada.
- `seguimientoVencido=false` devuelve los abiertos sin vencer y también los cerrados. Si se prefiere separarlos, agregar `estadoSeguimiento=abierto|cerrado`.

**Esperado.** Si se completa la entrada del seguimiento, el judicial sale del filtro "Plazo vencido" en la siguiente consulta.

## 2. Filtro de entradas abiertas en `GET /api/agenda`

**Problema.** La vista inicial "Pendientes" necesita todo lo abierto (`Pendiente`, `EnCurso`, `Pospuesta`) hasta los próximos 30 días, incluido lo vencido. `estado` acepta un solo valor, así que el front hace tres consultas, una por estado, y lee todas las páginas de cada una (`useAgendaPendientes`). Lo mismo pasa en las fichas de cliente y de expediente, que además no tienen límite de fecha.

**Propuesta.** Sumar `soloAbiertas=true` (o `estados=Pendiente,EnCurso,Pospuesta`) y `orden=referencia`. El orden sería: fecha de referencia (`FechaVencimiento ?? FechaFin ?? FechaInicio`) ascendente, después hora y después prioridad (de Urgente a Baja).

**Esperado.** Una sola consulta paginada y ya ordenada. Es compatible con el contrato actual: si no se envía el parámetro, la respuesta no cambia.

## 3. "Atrasada" en el listado y criterio único con el panel

**Problema.** Para lo que no tiene vencimiento, el panel cuenta como "vencidos" todo lo abierto con `(FechaVencimiento ?? FechaInicio) < hoy` (`PanelRepository`). Eso incluye eventos de varios días que todavía no terminaron. En el listado, el front calcula "atrasada" usando `FechaFin ?? FechaInicio`. Los dos criterios no coinciden.

**Propuesta.**

- Agregar `estaAtrasada` a `EntradaAgendaListadoResponse` y `EntradaAgendaResponse`: entrada abierta, sin vencimiento y con `(FechaFin ?? FechaInicio) < hoy` en la zona de la entrada.
- En el panel, separar `vencidos` (solo los que tienen `FechaVencimiento`) de `atrasados`, con el mismo criterio.

**Esperado.** El front deja de calcular la condición, y el panel y la Agenda muestran los mismos números.

## 4. Alertas de entradas ya cerradas

**Problema.** `GET /api/recordatorios-agenda?estado=Vencido` devuelve avisos sin atender aunque la entrada esté `Completada` o `Cancelada`. En "Alertas sin atender" quedan alertas de cosas ya resueltas.

**Propuesta (a definir con el estudio).** Elegir una de estas dos:

- (a) Al pasar la entrada a `Completada` o `Cancelada`, marcar como atendidos sus avisos ya vencidos, con usuario y fecha.
- (b) Agregar `soloEntradasAbiertas=true` a la consulta.

Recomendado: (b). Conserva la trazabilidad y no toca datos.

## 5. La regla de sistema de cobro se puede aplicar a mano

**Problema.** `POST /api/reglas-vencimiento/{id}/aplicar` acepta la regla `codigo = "SEGUIMIENTO_COBRO_JUDICIAL"`. Si se aplica desde Agenda, se crea un segundo seguimiento con su alerta, sin envío asociado.

**Front.** "Calcular con una regla" ya no ofrece las reglas con `codigo`. Configuración las marca como "Regla del sistema".

**Propuesta.** Rechazar con `400 ReglasVencimiento.ReglaDeSistema` el `aplicar` manual de reglas con `codigo` no nulo. Editarlas desde Configuración sigue permitido.

## 6. Nombre del tipo y de los responsables en el detalle

**Problema.** `GET /api/agenda/{id}` devuelve solo ids de clientes, casos, expedientes y responsables. Cuando el detalle se abre desde una alerta o desde cobro, el front no tiene los nombres y muestra "ID 123" o "Usuario no disponible".

**Propuesta.** Devolver en `EntradaAgendaResponse` las mismas colecciones `RelacionAgendaResponse` del listado (`clientes`, `casos`, `expedientes`, `responsables`) y mantener los `*Ids` por compatibilidad.

## Fuera de este ajuste (decisiones de cobro pendientes)

No se tocaron:

- fecha base definitiva
- corrección
- anulación
- reenvío
- envío de ambos documentos
- cierre o salida del listado

El front no calcula el plazo de 120 días hábiles ni genera alertas: muestra lo que informa la API.

## Estado de la integración (front, 06/11/2026)

Backend respondió en el commit `73fce85`. El front ya consume:

- Pendientes y fichas: una sola consulta con `soloAbiertas=true&orden=Referencia`.
- `estaAtrasada` y `transicionesPermitidas`. El front ya no tiene su propia tabla de transiciones.
- Relaciones con nombre en el detalle.
- `soloEntradasAbiertas=true` en "Alertas sin atender", que además muestra `entradaEstado`.
- Panel con `vencidos` y `atrasados` por separado.
- `seguimientoVencido` según el criterio de la API.
- Rechazo `Agenda.ReglaDeSistema`, con un mensaje que indica dónde registrar el envío.
- Mensajes claros para `General.RegistroConcurrente` y `General.ErrorInterno`.

Se probó en el navegador (Chrome, escritorio y Pixel 7) contra `http://localhost:5099`, con la base aislada `MantarasJuridico_cobro_test`.

Pendientes: decisiones 1 a 11 del brief de backend.
