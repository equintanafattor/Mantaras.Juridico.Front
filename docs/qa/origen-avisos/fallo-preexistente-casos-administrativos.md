# Fallo preexistente: `tests/casos-administrativos.test.mjs`

**No tiene relación** con el origen de los avisos: también falla en `main` (d4112b7), sin los cambios de esta rama. Es el mismo fallo registrado en `docs/qa/cobro-centrado-cliente/` , `docs/qa/filtro-juzgado/` y `docs/qa/avisos-claros/`.

- **Test:** "alta sin campos nuevos envía null explícito y preserva participantes" (`tests/casos-administrativos.test.mjs:14`).
- **Qué pasa:** `crearRequestDesdeForm` (`src/features/casos/lib/casoForm.ts`) ahora devuelve también `numeroBeneficio: null`. El objeto que espera el test no tiene ese campo, así que la comparación exacta (`deepStrictEqual`) falla:

  ```
  + actual - expected
  +   numeroBeneficio: null,
  ```

- **Causa probable:** la expectativa del test quedó desactualizada después de que se agregó `numeroBeneficio` al request de casos; no parece un error de código. Conviene confirmarlo con quien mantiene casos antes de cambiar el test.
- **Estado:** no se modifica en este cambio, para no mezclar alcances.
