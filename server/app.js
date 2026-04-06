import express from 'express';
import cors from 'cors';
import fs from 'fs';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { extractDicomMetadata } from './lib/dicomMeta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HL7_FILE = path.join(__dirname, 'data', 'hl7', 'patients.json');
const GDT_FILE = path.join(__dirname, 'data', 'gdt', 'devices.xml');
const DICOM_DIR = path.join(__dirname, 'data', 'dicom');

function multerDestDir() {
  if (process.env.VERCEL) {
    const p = path.join(os.tmpdir(), 'medical-dicom-upload');
    fs.mkdirSync(p, { recursive: true });
    return p;
  }
  return DICOM_DIR;
}

function isReadOnlyFsError(err) {
  const c = err && (err.code === 'EROFS' || err.code === 'EPERM' || err.code === 'EACCES');
  return Boolean(c);
}

function readHl7Patients() {
  const raw = fs.readFileSync(HL7_FILE, 'utf8');
  return JSON.parse(raw);
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeHl7Patients(list) {
  fs.writeFileSync(HL7_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function readGdtXml() {
  return fs.readFileSync(GDT_FILE, 'utf8');
}

function writeGdtXml(xmlString) {
  fs.writeFileSync(GDT_FILE, xmlString, 'utf8');
}

function listDicomFiles() {
  if (!fs.existsSync(DICOM_DIR)) return [];
  return fs
    .readdirSync(DICOM_DIR)
    .filter((f) => f.toLowerCase().endsWith('.dcm') || f.toLowerCase().endsWith('.dicom'));
}

export function createApiApp() {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(
    express.text({ type: ['text/plain', 'application/hl7-v2', 'application/xml', 'text/xml'], limit: '2mb' })
  );

  const upload = multer({
    dest: multerDestDir(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  app.get('/api/hl7/patients', (req, res) => {
    try {
      res.json({ ok: true, data: readHl7Patients() });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/hl7/patients.xml', (req, res) => {
    try {
      const list = readHl7Patients();
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<hl7MockPatients>\n';
      for (const p of list) {
        xml += `  <patient id="${escapeXml(p.id)}">\n`;
        xml += `    <messageType>${escapeXml(p.messageType)}</messageType>\n`;
        xml += `    <description>${escapeXml(p.description)}</description>\n`;
        xml += `    <rawHl7><![CDATA[${p.rawHl7 || ''}]]></rawHl7>\n`;
        xml += '    <parsed>\n';
        for (const [k, v] of Object.entries(p.parsed || {})) {
          xml += `      <field name="${escapeXml(k)}">${escapeXml(v)}</field>\n`;
        }
        xml += '    </parsed>\n';
        xml += '  </patient>\n';
      }
      xml += '</hl7MockPatients>\n';
      res.type('application/xml').send(xml);
    } catch (e) {
      res.status(500).type('text/plain').send(e.message);
    }
  });

  app.post('/api/hl7/patients', (req, res) => {
    try {
      const body = req.body;
      if (!body || !body.parsed || !body.parsed.patientId) {
        return res.status(400).json({ ok: false, error: 'parsed.patientId erforderlich' });
      }
      const list = readHl7Patients();
      const id = body.id || `P${String(list.length + 1).padStart(3, '0')}`;
      const entry = {
        id,
        messageType: body.messageType || 'ADT^A01',
        description: body.description || 'Manuell simuliert',
        rawHl7: body.rawHl7 || `MSH|...|${body.messageType || 'ADT^A01'}|DEMO|P|2.5\rPID|1||${id}^^^DEMO`,
        parsed: body.parsed,
      };
      const newList = [...list, entry];
      try {
        writeHl7Patients(newList);
      } catch (e) {
        if (isReadOnlyFsError(e) || process.env.VERCEL) {
          return res.status(503).json({
            ok: false,
            error:
              'Speichern nicht möglich (read-only auf Vercel). Lokal mit npm run dev funktioniert POST.',
          });
        }
        throw e;
      }
      res.json({ ok: true, data: entry });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/gdt/xml', (req, res) => {
    try {
      res.type('application/xml').send(readGdtXml());
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  app.get('/api/gdt/raw', (req, res) => {
    try {
      res.json({ ok: true, xml: readGdtXml() });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/gdt/xml', (req, res) => {
    try {
      const xml = typeof req.body === 'string' ? req.body : req.body?.xml;
      if (!xml || typeof xml !== 'string') {
        return res.status(400).json({ ok: false, error: 'XML-String im Body erwartet (text oder { xml })' });
      }
      if (!xml.includes('<gdtBatch')) {
        return res.status(400).json({ ok: false, error: 'Ungültiges GDT-Demo-XML (root gdtBatch fehlt)' });
      }
      try {
        writeGdtXml(xml);
      } catch (e) {
        if (isReadOnlyFsError(e) || process.env.VERCEL) {
          return res.status(503).json({
            ok: false,
            error:
              'Speichern nicht möglich (read-only auf Vercel). Lokal mit npm run dev funktioniert POST.',
          });
        }
        throw e;
      }
      res.json({ ok: true, message: 'GDT-XML gespeichert' });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/dicom/list', (req, res) => {
    try {
      const names = listDicomFiles();
      const items = names.map((name) => {
        const full = path.join(DICOM_DIR, name);
        const buf = fs.readFileSync(full);
        const meta = extractDicomMetadata(buf);
        return { fileName: name, sizeBytes: buf.length, meta };
      });
      res.json({ ok: true, data: items });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/dicom/file/:name', (req, res) => {
    const name = path.basename(req.params.name);
    const full = path.join(DICOM_DIR, name);
    if (!fs.existsSync(full) || !listDicomFiles().includes(name)) {
      return res.status(404).json({ ok: false, error: 'Datei nicht gefunden' });
    }
    res.setHeader('Content-Type', 'application/dicom');
    res.sendFile(full);
  });

  app.post('/api/dicom/upload', upload.single('dicom'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Feld "dicom" erwartet' });
    }
    const ext = path.extname(req.file.originalname) || '.dcm';
    const safeName = `upload_${Date.now()}${ext}`;
    const target = path.join(DICOM_DIR, safeName);
    try {
      fs.renameSync(req.file.path, target);
    } catch (e) {
      if (isReadOnlyFsError(e) || process.env.VERCEL) {
        return res.status(503).json({
          ok: false,
          error:
            'DICOM-Upload ins data-Verzeichnis geht auf Vercel nicht (read-only). Nur Anzeige der mitgelieferten Testdateien.',
        });
      }
      throw e;
    }
    const buf = fs.readFileSync(target);
    const meta = extractDicomMetadata(buf);
    res.json({ ok: true, fileName: safeName, meta });
  });

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'medical-interfaces-server', vercel: Boolean(process.env.VERCEL) });
  });

  return app;
}
