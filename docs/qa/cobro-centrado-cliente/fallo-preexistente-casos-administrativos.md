# Fallo preexistente: `tests/casos-administrativos.test.mjs`

Este fallo **no tiene que ver** con la funcionalidad de cobro centrado en el cliente. Ya falla en `main` sin ningún cambio de esa funcionalidad.

- **Test:** "alta sin campos nuevos envía null explícito y preserva participantes", en `tests/casos-administrativos.test.mjs:14`.
- **Qué pasa:** `crearRequestDesdeForm` (en `src/features/casos/lib/casoForm.ts`) ahora devuelve también `numeroBeneficio: null`, pero el objeto que espera el test no incluye ese campo, así que la comparación exacta (`deepStrictEqual`) falla:

  ```
  + actual - expected
  +   numeroBeneficio: null,
  ```

- **Lectura probable:** la expectativa del test quedó desactualizada después de que se agregó `numeroBeneficio` al request de casos; el código no parece tener un error. Hay que confirmarlo con quien mantiene casos antes de tocar el test.
- **Estado:** no se modificó en este cambio, para no mezclar alcances.
