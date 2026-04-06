import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4001;

const app = createApiApp();

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const clientIndex = path.join(clientDist, 'index.html');
const serveProductionUi = process.env.NODE_ENV === 'production' && fs.existsSync(clientIndex);

if (serveProductionUi) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(clientIndex);
  });
} else {
  app.get('/', (req, res) => {
    res.type('html').send(`<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><title>medical-interfaces API</title></head>
<body style="font-family:system-ui;max-width:40rem;margin:2rem;line-height:1.5">
  <h1>medical-interfaces-demo – Backend</h1>
  <p>Entwicklung: UI unter <a href="http://localhost:5173">http://localhost:5173</a> (Vite). API unter <code>/api/…</code>.</p>
  <ul>
    <li><a href="/api/health">GET /api/health</a></li>
    <li><a href="/api/hl7/patients">GET /api/hl7/patients</a></li>
    <li><a href="/api/dicom/list">GET /api/dicom/list</a></li>
  </ul>
</body></html>`);
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(`DICOM-Ordner: ${path.join(__dirname, 'data', 'dicom')}`);
  if (serveProductionUi) {
    console.log('Production-UI: client/dist wird mit ausgeliefert (gleicher Port).');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} ist bereits belegt.\n` +
        `  • Prozess finden:  lsof -nP -iTCP:${PORT} -sTCP:LISTEN\n` +
        `  • Beenden:        kill -9 $(lsof -t -iTCP:${PORT} -sTCP:LISTEN)\n` +
        `  • Oder anderer Port:  PORT=4010 npm run dev\n`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
