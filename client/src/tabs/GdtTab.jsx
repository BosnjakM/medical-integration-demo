import { Fragment, useEffect, useState } from 'react';
import SourceCallout from '../components/SourceCallout.jsx';
import { fetchGdtXml, postGdtXml } from '../api.js';
import { parseGdtDemoXml } from '../utils/parseGdt.js';

export default function GdtTab() {
  const [xml, setXml] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [editor, setEditor] = useState('');
  const [saveOk, setSaveOk] = useState('');

  function applyParse(xmlString) {
    try {
      const p = parseGdtDemoXml(xmlString);
      setParsed(p);
      setError('');
    } catch (e) {
      setParsed(null);
      setError(e.message);
    }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const x = await fetchGdtXml();
      setXml(x);
      setEditor(x);
      applyParse(x);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveEditor() {
    setError('');
    setSaveOk('');
    try {
      await postGdtXml(editor);
      setXml(editor);
      applyParse(editor);
      setSaveOk('Auf dem Server gespeichert (Datei data/gdt/devices.xml).');
    } catch (e) {
      setError(e.message);
    }
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setEditor(text);
      applyParse(text);
    };
    reader.readAsText(f);
  }

  return (
    <div className="panel">
      <h2>GDT (Mock als XML)</h2>
      <SourceCallout>
        <div className="source-callout__cols">
          <div className="source-callout__col">
            <h4>Mock-Daten &amp; Kontext</h4>
            <ul>
              <li>
                Eigene Demo-Datei (kein echter Praxis-Export):{' '}
                <span className="source-callout__path">server/data/gdt/devices.xml</span> – fünf Gerätedatensätze als
                lesbares XML, lose angelehnt an typische GDT-Feld-IDs (z. B. 3000, 3101).
              </li>
              <li>
                Hintergrund{' '}
                <strong>GDT</strong> (Gerätedatentransfer):{' '}
                <a href="https://de.wikipedia.org/wiki/Gerätedatentransfer" target="_blank" rel="noopener noreferrer">
                  Gerätedatentransfer (Wikipedia)
                </a>{' '}
                – in Praxis/KIS oft zeilen- oder positionsbasiert; hier bewusst XML zum Üben von Parsing &amp; UI.
              </li>
            </ul>
          </div>
          <div className="source-callout__col">
            <h4>Bibliotheken &amp; Ansatz</h4>
            <ul>
              <li>
                Parsing im Browser mit nativer Web-API{' '}
                <a href="https://developer.mozilla.org/en-US/docs/Web/API/DOMParser" target="_blank" rel="noopener noreferrer">
                  DOMParser
                </a>{' '}
                (<span className="source-callout__path">client/src/utils/parseGdt.js</span>).
              </li>
              <li>
                Backend:{' '}
                <a href="https://expressjs.com/" target="_blank" rel="noopener noreferrer">
                  Express
                </a>{' '}
                – XML ausliefern und (lokal) speichern per REST.
              </li>
            </ul>
          </div>
        </div>
      </SourceCallout>
      <p className="panel-intro">
        Reales GDT ist oft zeilen- oder positionsbasiert (BDT/LDT). Dieses Projekt nutzt ein lesbares XML-Schema,
        damit du Parsen, Validierung und Geräte-Felder ohne Spezial-Parser üben kannst.
      </p>

      <div className="toolbar">
        <button type="button" onClick={load} disabled={loading}>
          {loading ? 'Lade…' : 'Vom Server laden'}
        </button>
        <label className="file-btn">
          XML-Datei wählen
          <input type="file" accept=".xml,text/xml,application/xml" onChange={onFile} />
        </label>
        <button type="button" onClick={saveEditor}>
          Editor-Inhalt auf Server speichern
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {saveOk && <p className="hint-success">{saveOk}</p>}

      {parsed && (
        <div className="meta-grid meta-grid--tight">
          {Object.entries(parsed.batchAttrs).map(([k, v]) => (
            <div key={k}>
              <strong>Batch: {k}</strong>
              {v}
            </div>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>GDT-ID</th>
              <th>Gerätetyp</th>
              <th>Anzahl Felder</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(parsed?.records || []).map((rec) => (
              <Fragment key={rec.gdtId}>
                <tr>
                  <td>{rec.gdtId}</td>
                  <td>{rec.deviceType}</td>
                  <td>{rec.fields.length}</td>
                  <td>
                    <button type="button" className="secondary" onClick={() => setExpanded(expanded === rec.gdtId ? null : rec.gdtId)}>
                      {expanded === rec.gdtId ? 'Zu' : 'Felder'}
                    </button>
                  </td>
                </tr>
                {expanded === rec.gdtId && (
                  <tr>
                    <td colSpan={4} className="detail-cell">
                      <div className="detail-inner">
                      <div className="table-wrap">
                        <table className="table-nested">
                          <thead>
                            <tr>
                              <th>Feld-ID</th>
                              <th>Bezeichnung</th>
                              <th>Wert</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rec.fields.map((f) => (
                              <tr key={f.id + f.name}>
                                <td>{f.id}</td>
                                <td>{f.name}</td>
                                <td>{f.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">XML-Editor (lokal bearbeiten, dann speichern)</h3>
      <textarea
        className="code-editor"
        value={editor}
        onChange={(e) => setEditor(e.target.value)}
        rows={14}
        spellCheck={false}
      />
    </div>
  );
}
