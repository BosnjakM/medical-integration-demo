import { useEffect, useRef, useState } from 'react';
import SourceCallout from '../components/SourceCallout.jsx';
import { dicomFileUrl, fetchDicomList, uploadDicom } from '../api.js';
import { drawCanvasTestPattern } from '../utils/canvasTestPattern.js';
import { renderDicomToCanvas } from '../utils/dicomPreview.js';

export default function DicomTab() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [previewMsg, setPreviewMsg] = useState('');
  const [testPattern, setTestPattern] = useState(false);
  const canvasRef = useRef(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDicomList();
      setItems(data);
      if (data.length && !selected) {
        setSelected(data[0]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    if (testPattern) {
      drawCanvasTestPattern(canvas);
      setPreviewMsg(
        'Testmuster (kein DICOM): prüft nur, ob das Canvas Zeichnen kann. „Anzeigen“ bei einer Datei lädt wieder DICOM-Pixel.'
      );
      return;
    }

    if (!selected?.fileName) return;

    const url = dicomFileUrl(selected.fileName);

    (async () => {
      setPreviewMsg('Lade Pixel…');
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();
        const result = renderDicomToCanvas(buf, canvas);
        if (result.ok) {
          setPreviewMsg('');
        } else {
          setPreviewMsg(result.message || 'Keine Vorschau');
          const ctx = canvas.getContext('2d');
          canvas.width = 320;
          canvas.height = 120;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText('Keine Bildvorschau', 16, 64);
        }
      } catch (e) {
        setPreviewMsg(e.message);
      }
    })();
  }, [selected, testPattern]);

  async function onUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    try {
      await uploadDicom(f);
      await load();
    } catch (err) {
      setError(err.message);
    }
    e.target.value = '';
  }

  const meta = selected?.meta;

  return (
    <div className="panel">
      <h2>DICOM (Testbilder)</h2>
      <SourceCallout>
        <div className="source-callout__cols">
          <div className="source-callout__col">
            <h4>Mock-Daten &amp; Kontext</h4>
            <ul>
              <li>
                Testdateien aus dem Open-Source-Projekt{' '}
                <a href="https://github.com/pydicom/pydicom" target="_blank" rel="noopener noreferrer">
                  pydicom
                </a>
                , geladen per Skript aus{' '}
                <a
                  href="https://github.com/pydicom/pydicom/tree/main/src/pydicom/data/test_files"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  pydicom/data/test_files
                </a>{' '}
                (z. B. <code className="source-callout__mono">CT_small.dcm</code>,{' '}
                <code className="source-callout__mono">MR_small.dcm</code>).
              </li>
              <li>
                Standard:{' '}
                <a href="https://www.dicomstandard.org/current" target="_blank" rel="noopener noreferrer">
                  DICOM Standard (aktuell, dicomstandard.org)
                </a>
              </li>
              <li>
                Ablage im Projekt nach <span className="source-callout__path">npm run download-dicom</span>:{' '}
                <span className="source-callout__path">server/data/dicom/*.dcm</span>
              </li>
            </ul>
          </div>
          <div className="source-callout__col">
            <h4>Bibliotheken &amp; Ansatz</h4>
            <ul>
              <li>
                <a href="https://github.com/cornerstonejs/dicomParser" target="_blank" rel="noopener noreferrer">
                  dicom-parser
                </a>{' '}
                (npm) – Metadaten Server + Pixel-Vorschau im Browser (
                <span className="source-callout__path">client/src/utils/dicomPreview.js</span>).
              </li>
              <li>
                Backend:{' '}
                <a href="https://expressjs.com/" target="_blank" rel="noopener noreferrer">
                  Express
                </a>{' '}
                liefert Dateien und voraggregierte Metadaten per REST.
              </li>
            </ul>
          </div>
        </div>
      </SourceCallout>
      <p className="panel-intro">
        Metadaten kommen per <code>dicom-parser</code> auf dem Server (und optional im Client für die Vorschau).
        Nach Klon: im Ordner <code>server/</code> <code>npm run download-dicom</code> ausführen, falls noch keine{' '}
        <code>.dcm</code>-Dateien vorliegen.{' '}
        <strong>Hinweis:</strong> Mehrere MR-Dateien (z. B. <code>MR_small</code>, <code>MR_small_implicit</code>,{' '}
        <code>MR_small_padded</code>) sind dieselbe kleine Test-MR in verschiedenen DICOM-Kodierungen – das Bild
        sieht daher gleich aus. <code>CT_small.dcm</code> ist eine andere Serie (128×128) und sieht anders aus.
      </p>

      <div className="toolbar">
        <button type="button" onClick={load} disabled={loading}>
          {loading ? 'Lade…' : 'Liste aktualisieren'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setTestPattern(true)}
          title="Nur Canvas prüfen, ohne DICOM-Datei"
        >
          Canvas-Testmuster
        </button>
        <label className="file-btn">
          DICOM hochladen
          <input type="file" accept=".dcm,.dicom,application/dicom" onChange={onUpload} />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {items.length === 0 && !loading && (
        <p className="error">Keine DICOM-Dateien im Ordner data/dicom. Bitte Download-Skript ausführen.</p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Datei</th>
              <th>Größe</th>
              <th>Modalität</th>
              <th>Patient</th>
              <th>Matrix</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.fileName}>
                <td>
                  <code>{it.fileName}</code>
                </td>
                <td>{it.sizeBytes} B</td>
                <td>{it.meta?.modality || (it.meta?.error ? '?' : '—')}</td>
                <td>{it.meta?.patientName || '—'}</td>
                <td>
                  {it.meta?.rows && it.meta?.columns ? `${it.meta.rows}×${it.meta.columns}` : '—'}
                </td>
                <td>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setTestPattern(false);
                      setSelected(it);
                    }}
                  >
                    Anzeigen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <h3 className="section-title">
            Auswahl: <code className="filename-tag">{selected.fileName}</code>
          </h3>
          {meta?.error ? (
            <p className="error">Metadaten: {meta.message}</p>
          ) : (
            <div className="meta-grid">
              {[
                ['Patient', meta?.patientName],
                ['Patient-ID', meta?.patientId],
                ['Geb.datum', meta?.patientBirthDate],
                ['Geschlecht', meta?.patientSex],
                ['Studium-Datum', meta?.studyDate],
                ['Modalität', meta?.modality],
                ['Studien-Beschreibung', meta?.studyDescription],
                ['Serien-Beschreibung', meta?.seriesDescription],
                ['Photometric', meta?.photometricInterpretation],
                ['Bits', meta?.bitsAllocated],
                ['Transfer Syntax', meta?.transferSyntaxUID],
              ].map(([label, val]) => (
                <div key={label}>
                  <strong>{label}</strong>
                  {val ?? '—'}
                </div>
              ))}
            </div>
          )}

          <div className="dicom-preview">
            <canvas ref={canvasRef} />
            {previewMsg && <p className="hint">{previewMsg}</p>}
          </div>
        </>
      )}
    </div>
  );
}
