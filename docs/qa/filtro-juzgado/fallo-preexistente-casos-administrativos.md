# Fallo preexistente: `tests/casos-administrativos.test.mjs`

**No tiene relación** con el filtro por juzgado: también falla en `main` (b8ae308), sin los cambios de esta funcionalidad. Es el mismo fallo registrado en `docs/qa/cobro-centrado-cliente/`.

- **Test:** "alta sin campos nuevos envía null explícito y preserva participantes" (`tests/casos-administrativos.test.mjs:14`).
- **Qué pasa:** `crearRequestDesdeForm` (`src/features/casos/lib/casoForm.ts`) ahora devuelve también `numeroBeneficio: null`. El objeto que espera el test no tiene ese campo, así que la comparación exacta (`deepStrictEqual`) falla:

  ```
  + actual - expected
  +   numeroBeneficio: null,
  ```

- **Causa probable:** la expectativa del test quedó desactualizada después de que se agregó `numeroBeneficio` al request de casos; no parece un error de código. Conviene confirmarlo con quien mantiene casos antes de cambiar el test.
- **Estado:** no se modifica en este cambio, para no mezclar alcances.
