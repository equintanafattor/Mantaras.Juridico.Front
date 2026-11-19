// Proxy para probar desde un celular o tablet en la misma red, sin tocar el código.
// Sirve frontend y API desde un único origen (http://<IP-de-la-PC>:8080):
//   /api/*  -> API      (por defecto http://127.0.0.1:5099)
//   resto   -> frontend (por defecto http://127.0.0.1:3000)
// Al ser el mismo origen, el navegador no aplica CORS y no hace falta agregar la IP
// a la política "Frontend" de la API, que solo admite http://localhost:3000.
//
// Uso:  node proxy-lan.mjs   (variables opcionales: PROXY_PORT, PROXY_API, PROXY_FRONT)
import http from "node:http";
import os from "node:os";

const PUERTO = Number(process.env.PROXY_PORT ?? 8080);
const API = new URL(process.env.PROXY_API ?? "http://127.0.0.1:5099");
const FRONT = new URL(process.env.PROXY_FRONT ?? "http://127.0.0.1:3000");

const servidor = http.createServer((req, res) => {
  const destino = req.url.startsWith("/api/") ? API : FRONT;
  const salida = http.request(
    {
      hostname: destino.hostname,
      port: destino.port,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: destino.host },
    },
    (r) => {
      res.writeHead(r.statusCode ?? 502, r.headers);
      r.pipe(res);
    },
  );
  salida.on("error", (e) => {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`No se pudo conectar con ${destino.origin}: ${e.message}`);
  });
  req.pipe(salida);
});

servidor.listen(PUERTO, "0.0.0.0", () => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => `http://${i.address}:${PUERTO}`);
  console.log(`Proxy escuchando en 0.0.0.0:${PUERTO} (API ${API.origin}, frontend ${FRONT.origin})`);
  console.log(`Abrí desde el celular: ${ips.join("  o  ") || "(no se encontró una IP de red)"}`);
});
