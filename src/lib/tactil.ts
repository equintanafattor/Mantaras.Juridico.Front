// En pantallas táctiles (puntero grueso), agranda botones y campos de los
// descendientes a 40 px como mínimo. Con mouse se conserva el tamaño compacto.
export const TACTIL =
  "pointer-coarse:[&_[data-slot=button]]:min-h-10 pointer-coarse:[&_[data-slot=button]]:min-w-10 pointer-coarse:[&_select]:min-h-10 pointer-coarse:[&_input:not([type=checkbox]):not([type=radio])]:min-h-10";
