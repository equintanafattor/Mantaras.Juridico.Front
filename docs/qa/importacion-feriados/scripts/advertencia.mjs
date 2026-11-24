// Aplica una regla de 10 días hábiles desde el 21/12/2026 (2026 importado, 2027 no) desde la interfaz.
// Uso: QA_EMAIL=... QA_PASSWORD=... CHROMIUM_PATH=... node advertencia.mjs  (requiere 2026 importado y 2027 sin calendario)
import { chromium } from "playwright";
const sesion = await (await fetch("http://localhost:5099/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD }) })).json();
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const [id, vp, movil] of [["1440", { width: 1440, height: 900 }, false], ["390", { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: movil, isMobile: movil, locale: "es-AR" });
  await ctx.addInitScript(s => sessionStorage.setItem("mantaras.auth.session", s), JSON.stringify(sesion));
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/agenda"); await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: "Agregar", exact: true }).first().click();
  await p.getByRole("dialog").getByText("Vencimiento", { exact: true }).click();
  await p.getByRole("button", { name: "Calcular con una regla" }).click();
  const d = p.getByRole("dialog").last(); await d.locator("#aplicar-regla").waitFor();
  await p.waitForLoadState("networkidle");
  const opcion = await d.locator("#aplicar-regla option").filter({ hasText: "PRUEBA FERIADOS" }).first().getAttribute("value");
  await d.locator("#aplicar-regla").selectOption(opcion);
  await d.locator("#aplicar-fecha-base").fill("2026-12-21");
  await d.getByRole("button", { name: "Calcular y agendar" }).click();
  await d.getByText("Agendado:").waitFor({ timeout: 20000 });
  const texto = await d.getByRole("alert").first().textContent().catch(() => "");
  console.log(id, "fecha:", (await d.getByRole("status").first().textContent()).trim());
  console.log(id, "advertencia:", texto.includes("2027") ? "OK" : "FALTA", "|", texto.slice(0, 160));
  await p.screenshot({ path: `salida/capturas/${id}_10-advertencia-anio-sin-calendario.png` });
  await ctx.close();
}
await b.close();
