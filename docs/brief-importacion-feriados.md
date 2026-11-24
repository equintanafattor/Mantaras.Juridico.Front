# Brief: importación de feriados nacionales (frontend)

Rama: `feat/importacion-feriados`, creada desde `main` (`93beabf`) e integrada en `main`.
Contrato del backend: `Mantaras.Juridico.Back/docs/brief-front-importacion-feriados.md`, rama back `feat/importacion-feriados`.

## Cambios

**Días inhábiles** (Agenda › Configuración)
- Botón **Importar feriados nacionales**, junto a "Nuevo día inhábil". La carga manual de ferias y excepciones judiciales sigue igual.
- Bloque de **cobertura del año filtrado**:
  - Si el año no tiene calendario importado, muestra un aviso con el botón "Importar {año}".
  - Si ya lo tiene, muestra la fuente con enlace, la última sincronización con su usuario y cuántos días hay importados y manuales.
- Cada día muestra su **origen**:
  - Insignias "Feriado nacional", "Feriado nacional · modificado" o "Manual".
  - En los importados, la fuente y la fecha publicada cuando el día fue movido.
  - Si alguien lo cambió a mano, se aclara que la importación ya no lo modifica.

**Diálogo de importación** (`ImportarFeriadosDialog.tsx`)
1. **Elegir año**: atajos para el año actual y el siguiente, con validación de 2000–2100 en el cliente.
2. **Vista previa**:
   - Fuente con enlace, fecha de publicación, fecha de consulta y última sincronización.
   - Resumen: nuevos, se actualizan, ya cargados y conflictos.
   - Secciones plegables:
     - "Se agregan o actualizan"
     - "Conflictos", con la explicación de cada uno
     - "Requieren revisión", con casillas; toda la fila es tocable
     - "Ya cargados"
     - "Importados que la fuente ya no publica"
     - "Omitidos"
3. **Confirmar**: el botón dice "Importar N días" o "Confirmar sin cambios". Hay un candado que impide envíos repetidos. Mientras guarda se ve "Importando…" y quedan bloqueados el cierre, el cambio de año y las casillas.
4. **Resultado**:
   - Muestra agregados, actualizados, de revisión, ya cargados y conflictos.
   - Distingue tres casos: importación nueva, "ya estaba aplicada" (`yaAplicada`) y "sincronizado sin cambios".
   - Después se refresca el listado, la cobertura y la agenda.
- **Errores**:
  - Año no disponible (404): aviso sin botón de reintentar.
  - Fuente caída (503) o con formato inválido (502): aviso con reintentar; se aclara que el calendario guardado no cambió.
  - Vista previa desactualizada (409): aviso, y se trae sola la vista previa actual. Las fechas de revisión marcadas se conservan si siguen siendo válidas.
- La vista previa no se reintenta sola ni se refresca en segundo plano. Al invalidar la agenda tampoco se vuelve a consultar la fuente.

**Advertencia de año sin calendario**
- `AdvertenciasCalculo.tsx`. Se muestra en el resultado de "Calcular con una regla" y en la tarjeta de seguimiento de cobro del expediente judicial.
- Agrega la indicación de dónde importar el año y aclara que la fecha ya calculada no cambia.

**Archivos**
- Nuevos: `lib/importacionFeriados.ts` (lógica pura, con pruebas), `hooks/useImportacionFeriados.ts`, `components/ImportarFeriadosDialog.tsx`, `components/CoberturaFeriadosAnio.tsx`, `components/AdvertenciasCalculo.tsx`, `tests/importacion-feriados.test.mjs`.
- Modificados: `types/diasInhabiles.ts`, `api/diasInhabilesAgendaApi.ts`, `DiasInhabilesAgendaPanel.tsx`, `AplicarReglaAgendaDialog.tsx`, `types/types.ts` (agenda y expedientes), `SeguimientoCobroCard.tsx`.

**Decisión aceptada: concurrencia**
- Si una edición manual y una importación se cruzan, puede quedar la última escritura. No se agrega control de concurrencia adicional.
- Sigue vigente lo que ya hace el backend: la confirmación devuelve 409 si algo cambió desde la vista previa.

**Sin cambios**
- No se recalculan los vencimientos.
- No cambian las reglas de cobro.
- No se importan calendarios judiciales.
- El navegador nunca consulta la fuente oficial.

## Contratos consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/dias-inhabiles/importacion-nacional/estado?anio=` | Cobertura del año filtrado |
| GET | `/api/dias-inhabiles/importacion-nacional/{anio}/vista-previa` | Vista previa |
| POST | `/api/dias-inhabiles/importacion-nacional/{anio}` `{ huella, fechasRevisionIncluidas }` | Confirmación |
| GET | `/api/dias-inhabiles` (campos nuevos `origen`, `fuente`, `fechaFuente`, `fechaSincronizacion`, `modificadoManualmente`) | Listado |
| — | `advertencias[]` en `AplicacionReglaVencimientoResponse` y `EnvioCobroResponse` | Advertencia de año sin calendario |

Los campos nuevos son opcionales en los tipos. Si el backend todavía no los tiene, la pantalla sigue funcionando: sin insignias de origen y sin advertencias.

## Pruebas reales

Contra la API aislada `http://localhost:5099`, con base PostgreSQL descartable en el puerto 55432 y el frontend en `next dev` con `NEXT_PUBLIC_API_URL=http://localhost:5099`. Se usó Playwright con Chromium. Scripts, capturas y resultados en `docs/qa/importacion-feriados/`.

Datos preparados vía API en 2025, antes de importar:
- el 01/05 manual y desactivado (da conflicto);
- el 09/07 manual activo con otra descripción (da existente);
- el 21/07 como "Feria judicial de invierno" (manual).

| Caso | Resultado |
|---|---|
| Cobertura: 2025 sin calendario muestra aviso | OK |
| Año no disponible (2027 → 404) y año fuera de rango (1999) | OK |
| Vista previa 2025: 14 nuevos, 1 ya cargado con motivo, 1 conflicto explicado, 15 para revisión | OK |
| 409: se editó el 09/07 vía API entre la vista previa y la confirmación → aviso, vista previa actualizada y la marca del 21/11 conservada | OK |
| Confirmación desde la interfaz: 14 feriados + 21/11 de revisión. Conflicto y manuales sin tocar, sin fechas duplicadas | OK (verificado vía API) |
| Refresco: cobertura "Feriados 2025 importados", insignias de origen importado y manual | OK |
| Repetición: nuevos 0, la base queda en 17 → 17 días, sin duplicados (`yaAplicada`) | OK |
| Doble clic: 3 clics en el mismo tick con el POST demorado 1,5 s → 1 solo POST; botón bloqueado | OK |
| Fuente caída (503) y fuente inválida (502): aviso y reintentar que recupera | OK (*) |
| 390 px y 768 px táctil: sin scroll horizontal, botones ≥ 40 px, filas de revisión tocables ≥ 44 px, confirmar visible en el pie fijo | OK (16/16) |
| Advertencia: regla de 10 días hábiles desde el 21/12/2026 da vence 05/01/2027 con advertencia de 2027 (1440 y 390 px) | OK |
| `npm run build`, `tsc --noEmit`, `eslint` | OK |
| `node --test tests/*.test.mjs` | 26/27. Falla `casos-administrativos` "alta sin campos nuevos…", que ya fallaba en `main` sin estos cambios |

(*) La caída de la fuente se simuló en el navegador con la respuesta exacta del contrato (código y estado HTTP). No se cortó la fuente real porque no se podía reiniciar la API aislada, que también usa el backend para sus verificaciones.

Observaciones de la prueba:
- La primera corrida se cortó por un fallo del script en el paso de doble clic, después de que la confirmación ya había llegado. Por eso falta la captura del resultado de la primera importación; la de la repetición sí está.
- Las capturas de pantalla completa de Playwright desactivan la emulación táctil de Chromium. Por eso se toman al final de cada recorrido.

## Pendientes

- **Advertencia en el seguimiento de cobro**: el componente está conectado, pero no se probó contra la API. La base aislada no tenía expedientes de cobro y crear uno modificaba la base de verificación del backend.
- **Fuente caída real**: probarla con la API apuntando a una URL inválida (`FeriadosNacionales:UrlPlantilla`).
- **Origen de los días de revisión incluidos** (por ejemplo, el puente turístico del 21/11): quedan como "Feriado nacional" porque el backend no distingue la categoría. Definir si conviene otra etiqueta.
- **2027 no está publicado** en la fuente: los cálculos que cruzan a 2027 van a mostrar la advertencia hasta que se importe.
- **Permisos**: hoy cualquier usuario autenticado puede importar. Definir si debe ser solo Administrador; en ese caso, ocultar el botón según el rol.
