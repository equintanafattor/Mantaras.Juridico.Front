export function queryString(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const text = typeof value === "string" ? value.trim() : String(value);
    if (text !== "") query.set(key, text);
  }
  const result = query.toString();
  return result ? `?${result}` : "";
}

export function validarId(id: number): number {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("El identificador debe ser un entero positivo seguro.");
  }
  return id;
}
