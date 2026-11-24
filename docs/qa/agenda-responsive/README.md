# QA responsive de Agenda (entregable 2)

Fecha: 2026-11-19 · Rama: `feat/agenda-responsive` · Base: commit `e11011f` (adaptación a tablet y celular) más las correcciones de este informe.

## Resultado

| Verificación | Resultado |
|---|---|
| `npm run build` | OK |
| `npm run lint` | OK |
| `npx tsc --noEmit` | OK |
| `node --test tests/*.test.mjs` | 21 de 22. El fallo es **preexistente** (ver más abajo) |
| Auditoría automatizada: 5 tamaños × 20 recorridos | 100 casos, 0 con problemas |
| Diálogos: título, cierre y acción final dentro de pantalla | 45 de 45 |
| Teclado simulado: título, campo y acción visibles | 21 de 21 |
| Objetivos táctiles de Agenda ≥ 44×44 px, sin superposición | 152 objetivos en 8 casos: 0 chicos, 0 superpuestos |
| Errores de consola o respuestas HTTP ≥ 400 | 0 |
| Guardados por interfaz verificados contra la API | 8 de 8 |
| Validación manual en Android real (Samsung A55, por red local) | Sin problemas |

## Alcance del commit `e11011f`

Los 32 archivos cambian solo presentación: clases, estructura de diálogos y consultas de contenedor. No cambian reglas de negocio, contratos de API ni cálculos de plazos. Hay un solo cambio de comportamiento: si falla el guardado del formulario de Agenda, la pantalla se desplaza hasta el mensaje de error.

## Problemas encontrados y correcciones

1. **Registro de envío de cobro con teclado abierto** (celular). El botón "Registrar envío" quedaba fuera de la vista. El diálogo pasó al patrón de pantalla completa (`DIALOG_PANEL` + `DialogBody` + `DIALOG_PIE`). La lógica del formulario no cambió. Archivo: `RegistrarEnvioCobroDialog.tsx`.
2. **Diálogos de pantalla completa en tablet.** Entre 640 y 800 px, `sm:max-w-3xl` y `sm:max-w-2xl` pisaban el margen lateral y el diálogo tocaba los bordes. `DIALOG_PANEL` ahora limita con `sm:w-[calc(100%-2rem)]`. Archivo: `components/ui/dialog.tsx`.
3. **Acciones a mitad de pantalla** en los seis diálogos de configuración (día inhábil, categoría, regla, aplicar regla y los dos de avisos). El formulario no era flex y `DIALOG_ACCIONES` (`mt-auto`) no llegaba al pie. Los formularios ahora usan `flex flex-1 flex-col gap-4`, con el mismo espaciado.
4. **Objetivos táctiles de Agenda.** Solo con puntero grueso (`pointer-coarse`); con mouse no cambia nada.
   - Links a cliente, caso y expediente en la vista Todas: medían 24 px de alto. Ahora `inline-flex`, con mínimo de 44×44.
   - Título de cada fila en la vista Todas: medía 32 px de alto. Ahora 44 px de alto mínimo.
   - Entradas de la grilla del calendario: medían 37 px de alto. Ahora 44 px de alto mínimo; la celda crece en lugar de recortar, y el título completo sigue en `title` y en el detalle.
   - "+N más" del calendario: ahora mínimo de 44×44.

## Fuera de alcance

Los botones generales de las fichas de cliente, caso y expediente miden 28–32 px en pantallas táctiles (Editar, Dar de baja, Agregar movimiento, íconos de clave). Quedan para una mejora aparte.

## Fallo preexistente: `tests/casos-administrativos.test.mjs`

- **Test:** «alta sin campos nuevos envía null explícito y preserva participantes».
- **Causa:** el test no espera `numeroBeneficio`, pero `src/features/casos/lib/casoForm.ts` lo envía (`numeroBeneficio: null`) desde el commit `09111ff` (2026-09-21, «mejorar flujos y relaciones de expedientes»). El test no se actualizó desde `6057aec`.
- **Evidencia:** se reproduce idéntico con el código de `acf708c`, anterior a la adaptación responsive. Entre `acf708c` y esta rama no hay cambios en `casos/lib`, `catalogos/lib` ni en el test.
- **Decisión:** no se modificó la lógica ni el test en este trabajo. Corresponde decidir aparte si se actualiza la expectativa del test o el payload.

## Cómo se probó

- **Base aislada:** `mantaras_juridico_qa_responsive` (Postgres local). La API la crea vacía y aplica las migraciones al arrancar. No se escribió en `mantaras_juridico`.
- **Datos ficticios con prefijo QA** (`scripts/seed-qa.mjs`): 2 clientes, casos, 30 expedientes judiciales y 22 envíos de cobro (8 con seguimiento vencido y 14 en curso), lo que da 2 páginas en `/cobro`. Además, entradas de Agenda del mes, 4 de ellas el mismo día, para que aparezca "+N más". Durante la carga se duplicaron 2 clientes y 1 caso ficticios, sin efecto en las pruebas.
- **Tamaños:** 360×740, 390×844, 768×1024 y 1024×768 con pantalla táctil emulada (puntero grueso), y 1440×900 con mouse.
- **Recorridos de la auditoría** (`scripts/audit.mjs`, solo lectura):
  - Panel.
  - Agenda: Pendientes, Calendario, Todas, filtros, detalle, alta, alta con más opciones, aplicar regla.
  - Configuración: pantalla, día inhábil, categoría, regla.
  - Fichas de cliente, caso y expediente con cobro.
  - Cobro: registrar envío, `/cobro`, `/cobro` página 2, diálogo de seguimiento.
- **Guardados** (`scripts/guardados.mjs`, en 390 táctil y en 1440):
  - Alta de Agenda.
  - Edición desde el detalle; en celular, con la altura reducida.
  - Fecha de envío futura bloqueada, sin escritura.
  - Registro de envío de cobro; en celular, con la altura reducida.

  Cada guardado se verificó contra la API: título, fecha, tipo de documento, fecha de envío y presencia en el listado de cobro.

### Reproducir

```bash
# API contra una base de QA vacía (la crea y migra al arrancar)
ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=mantaras_juridico_qa_responsive;Username=...;Password=..." \
BootstrapAdmin__Email=qa@local.test BootstrapAdmin__Password=... \
dotnet run --project src/Mantaras.Juridico.Api --urls http://localhost:5099

# Frontend con NEXT_PUBLIC_API_URL=http://localhost:5099
npm run build && npm run start

# En una carpeta con playwright instalado (npm i playwright)
QA_EMAIL=qa@local.test QA_PASSWORD=... node scripts/seed-qa.mjs
QA_EMAIL=qa@local.test QA_PASSWORD=... node scripts/guardados.mjs salida
QA_EMAIL=qa@local.test QA_PASSWORD=... node scripts/audit.mjs salida   # QA_SOLO=16,17 para repetir recorridos sueltos
```

`seed-qa.mjs` se niega a correr si la base tiene clientes que no son de QA.

## Probar desde un celular o tablet en la misma red

Desde el teléfono, `localhost` es el propio teléfono, así que hay que usar la IP de la PC en la red local, por ejemplo `192.168.10.117`. La IP se consulta con `ipconfig` y puede cambiar.

**Problemas de la configuración actual:**

- **Dirección de escucha:** `next start`/`next dev` y la API con `--urls http://localhost:5099` solo escuchan en la propia PC.
- **URL de la API:** `NEXT_PUBLIC_API_URL` se fija al compilar. Con `http://localhost:5099`, el teléfono busca la API en sí mismo.
- **CORS:** la política `Frontend` de la API (`Program.cs`) admite solo `http://localhost:3000` y el dominio de Vercel, escritos en el código, sin configuración por entorno. Una página abierta en `http://192.168.x.x:3000` que llama a la API por otro puerto es de otro origen y la API la rechaza.
- **`next dev`** además bloquea recursos de desarrollo pedidos desde otro origen si no están en `allowedDevOrigins`.

**Solución sin tocar código:** un proxy (`scripts/proxy-lan.mjs`, sin dependencias) expone un único origen `http://<IP>:8080`: `/api/*` va a la API y el resto al frontend. Como página y API comparten origen, no se aplica CORS. API y frontend siguen escuchando solo en `127.0.0.1`; solo el proxy queda expuesto a la red. Se usa `next start`, así que no influye `allowedDevOrigins`.

Este recorrido se verificó el 2026-11-19 desde la PC por su IP de red: login y `/cobro` con datos, sin errores de CORS ni HTTP. No se probó desde un teléfono.

```bash
# 1. API contra la base de QA (no la borres: ya tiene los datos ficticios)
cd Mantaras.Juridico.Back/src/Mantaras.Juridico.Api
ASPNETCORE_ENVIRONMENT=Development \
ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=mantaras_juridico_qa_responsive;Username=...;Password=..." \
BootstrapAdmin__Email=qa@local.test BootstrapAdmin__Password=... \
dotnet run --no-launch-profile --urls http://127.0.0.1:5099

# 2. Frontend compilado con la URL que verá el teléfono (la IP de la PC y el puerto del proxy)
cd Mantaras.Juridico.Front
NEXT_PUBLIC_API_URL=http://192.168.10.117:8080 npm run build
npx next start -H 127.0.0.1 -p 3000

# 3. Proxy en la red local
node docs/qa/agenda-responsive/scripts/proxy-lan.mjs
```

En PowerShell, las variables se definen antes con `$env:NOMBRE = "valor"`.

**Pasos finales:**

1. **Firewall de Windows:** la primera vez, permití Node en redes privadas cuando lo pregunte, o abrí el puerto desde una consola de administrador: `netsh advfirewall firewall add rule name="QA proxy 8080" dir=in action=allow protocol=TCP localport=8080 profile=private`. La red Wi-Fi tiene que estar marcada como privada.
2. **Desde el teléfono**, conectado a la misma Wi-Fi, abrí `http://192.168.10.117:8080` e ingresá con `qa@local.test`. Algunas redes de invitados aíslan los dispositivos entre sí.
3. **Si cambia la IP**, volvé a compilar el paso 2.
4. **Al terminar**, `npm run build` sin la variable vuelve a usar `.env.local`.

**Alternativa a futuro:** permitir que la API lea los orígenes de CORS desde la configuración. Es un cambio en el backend que no se hizo en este trabajo.

## Validación manual en Android

2026-11-19. Un Samsung A55 entró por la red local con el proxy de la sección anterior, contra la base de QA, y la revisión manual no mostró problemas. Cubre el celular Android con teclado real. No cubre iOS ni tablets.

## Pendiente: pruebas en dispositivos reales

La simulación del teclado (foco en un campo y alto de ventana al 55 %) aproxima `interactive-widget=resizes-content`, pero **no reemplaza** estas pruebas, que no se ejecutaron:

- **iOS Safari, con teclado real:** Safari no soporta `interactive-widget`, porque el teclado se superpone sin redimensionar la página. Hay que verificar que el pie fijo no quede tapado y probar la zona segura inferior (`safe-area-inset-bottom`).
- **Tablet real (Android e iPad):** que active el puntero grueso (`pointer-coarse`) y los tamaños de 44 px. También el calendario en grilla y en lista según la orientación.
- **Selectores nativos de fecha y hora** dentro de los diálogos de pantalla completa, en iOS y en tablets.

## Archivos

- `resultados-auditoria.json`: un registro por caso (tamaño × recorrido) con mediciones y problemas.
- `resultados-guardados.json`: los 8 pasos de guardado con lo verificado en la API.
- `capturas/`: selección de capturas de los cambios (calendario, vista Todas, diálogos con teclado simulado, cobro y guardados).
- `scripts/`: carga de datos, auditoría, guardados y `proxy-lan.mjs` para probar desde la red local.
## Días inhábiles en el calendario

El 24 de noviembre de 2026 se verificó el calendario en Chromium contra la API .NET local y un PostgreSQL recién inicializado para QA, en un puerto separado. La importación ejecutó la vista previa y la confirmación de la API con la copia del calendario oficial 2026 incluida en las pruebas del backend, servida por HTTP local.

- Alta, edición, desactivación y reactivación de un día manual desde Configuración. Al volver a Agenda por navegación interna, se comprobó el GET de días activos y que el mismo documento seguía abierto.
- Importación de feriados de 2026. El calendario mostró el feriado importado del 1 de enero y el día manual reactivado del 8 de enero. Los tres eventos de prueba siguieron visibles en sus fechas durante las cinco operaciones.
- Build, lint y las diez pruebas de período, calendario e importación aprobados.

La suite general tiene un fallo preexistente en `tests/casos-administrativos.test.mjs`, en «alta sin campos nuevos envía null explícito y preserva participantes». El payload de alta incluye `numeroBeneficio: null` y el objeto esperado omite esa propiedad. El test y la lógica de Casos Administrativos coinciden con la versión de `main` previa al cambio.
