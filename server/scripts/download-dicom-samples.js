import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICOM_DIR = path.join(__dirname, '..', 'data', 'dicom');

const SAMPLES = [
  {
    name: 'CT_small.dcm',
    url: 'https://raw.githubusercontent.com/pydicom/pydicom/main/src/pydicom/data/test_files/CT_small.dcm',
  },
  {
    name: 'MR_small.dcm',
    url: 'https://raw.githubusercontent.com/pydicom/pydicom/main/src/pydicom/data/test_files/MR_small.dcm',
  },
  {
    name: 'rtplan.dcm',
    url: 'https://raw.githubusercontent.com/pydicom/pydicom/main/src/pydicom/data/test_files/rtplan.dcm',
  },
  {
    name: 'MR_small_implicit.dcm',
    url: 'https://raw.githubusercontent.com/pydicom/pydicom/main/src/pydicom/data/test_files/MR_small_implicit.dcm',
  },
  {
    name: 'MR_small_padded.dcm',
    url: 'https://raw.githubusercontent.com/pydicom/pydicom/main/src/pydicom/data/test_files/MR_small_padded.dcm',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          fs.unlink(dest, () => {});
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${res.statusCode} für ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function main() {
  fs.mkdirSync(DICOM_DIR, { recursive: true });
  console.log('Zielordner:', DICOM_DIR);
  for (const s of SAMPLES) {
    const dest = path.join(DICOM_DIR, s.name);
    if (fs.existsSync(dest)) {
      console.log('Überspringe (existiert):', s.name);
      continue;
    }
    console.log('Lade:', s.name);
    try {
      await download(s.url, dest);
      console.log('  OK');
    } catch (e) {
      console.error('  Fehler:', e.message);
    }
  }
  console.log('Fertig.');
}

main();
