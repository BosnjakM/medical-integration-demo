import { Fragment, useEffect, useState } from 'react';
import SourceCallout from '../components/SourceCallout.jsx';
import { fetchHl7Patients, postHl7Patient } from '../api.js';
import { parseHl7PipeMessage, segmentsToRows } from '../utils/parseHl7.js';

export default function Hl7Tab() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [fam, setFam] = useState('Mustermann');
  const [given, setGiven] = useState('Max');
  const [pid, setPid] = useState('P-DEMO');
  const [birth, setBirth] = useState('19900101');

  async function load() {
    setError('');
    setLoading(true);
    try {
      const data = await fetchHl7Patients();
      setRows(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSimulate(e) {
    e.preventDefault();
    setError('');
    try {
      await postHl7Patient({
        messageType: 'ADT^A01',
        description: 'Per Formular simuliert',
        parsed: {
          patientId: pid,
          familyName: fam,
          givenName: given,
          birthDate: birth,
          sex: 'O',
          address: '',
          phone: '',
        },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="panel">
      <h2>HL7 v2 (Mock)</h2>
      <SourceCallout>
        <div className="source-callout__cols">
          <div className="source-callout__col">
            <h4>Mock-Daten &amp; Kontext</h4>
            <ul>
              <li>
                Eigene Beispiel-Nachrichten als JSON im Repo:{' '}
                <span className="source-callout__path">server/data/hl7/patients.json</span> – inkl.{' '}
                <code className="source-callout__mono">rawHl7</code> (Pipe-Notation) und strukturiertem{' '}
                <code className="source-callout__mono">parsed</code>.
              </li>
              <li>
                Hintergrund Standard:{' '}
                <a href="https://www.hl7.org/implement/standards/product_brief.cfm?product_id=185" target="_blank" rel="noopener noreferrer">
                  HL7 Version 2 (Product Brief, hl7.org)
                </a>
              </li>
              <li>
                Einordnung:{' '}
                <a href="https://en.wikipedia.org/wiki/Health_Level_7" target="_blank" rel="noopener noreferrer">
                  Health Level 7 (Wikipedia)
                </a>
              </li>
            </ul>
          </div>
          <div className="source-callout__col">
            <h4>Bibliotheken &amp; Ansatz</h4>
            <ul>
              <li>
                <strong>Kein</strong> HL7-Commercial-Parser: Segment-Demo im Browser per einfachem String-Split (
                <span className="source-callout__path">client/src/utils/parseHl7.js</span>).
              </li>
              <li>
                Backend:{' '}
                <a href="https://expressjs.com/" target="_blank" rel="noopener noreferrer">
                  Express
                </a>{' '}
                (Node.js) – REST statt MLLP/TCP, bewusst für Nachvollziehbarkeit.
              </li>
              <li>Frontend: React (Vite), <code>fetch</code> zur API.</li>
            </ul>
          </div>
        </div>
      </SourceCallout>
      <p className="panel-intro">
        Daten liegen als JSON mit <code>rawHl7</code> (Pipe-Syntax) und <code>parsed</code> vor – wie oft in
        Übungsumgebungen, bevor ein echter HL7-Listener (MLLP/TCP) angebunden wird.
      </p>

      <div className="toolbar">
        <button type="button" onClick={load} disabled={loading}>
          {loading ? 'Lade…' : 'Daten neu laden'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nachricht</th>
              <th>Kurzbeschreibung</th>
              <th>Patient-ID</th>
              <th>Name</th>
              <th>Geb.datum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>{r.id}</td>
                  <td>
                    <code>{r.messageType}</code>
                  </td>
                  <td>{r.description}</td>
                  <td>{r.parsed?.patientId ?? '—'}</td>
                  <td>
                    {(r.parsed?.familyName || '') + (r.parsed?.givenName ? ', ' + r.parsed.givenName : '') ||
                      '—'}
                  </td>
                  <td>{r.parsed?.birthDate ?? '—'}</td>
                  <td>
                    <button type="button" className="secondary" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      {expandedId === r.id ? 'Zu' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr>
                    <td colSpan={7} className="detail-cell">
                      <div className="detail-inner">
                        <strong>Strukturiert (parsed)</strong>
                        <div className="table-wrap">
                          <table className="table-nested">
                            <tbody>
                              {Object.entries(r.parsed || {}).map(([k, v]) => (
                                <tr key={k}>
                                  <th>{k}</th>
                                  <td>{String(v)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <strong>Roh (HL7 Pipe)</strong>
                        <pre className="raw">{r.rawHl7}</pre>
                        <strong>Segmente (einfacher Split-Parser)</strong>
                        <div className="table-wrap">
                          <table className="table-nested">
                            <thead>
                              <tr>
                                <th>Segment</th>
                                <th>Feld #</th>
                                <th>Wert</th>
                              </tr>
                            </thead>
                            <tbody>
                              {segmentsToRows(parseHl7PipeMessage(r.rawHl7)).map((row, i) => (
                                <tr key={i}>
                                  <td>{row.segment}</td>
                                  <td>{row.fieldIndex}</td>
                                  <td>{row.value}</td>
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

      <h3 className="section-title">Neuen Datensatz simulieren</h3>
      <form onSubmit={handleSimulate} className="form-grid">
        <label>
          Patienten-ID
          <input value={pid} onChange={(e) => setPid(e.target.value)} required />
        </label>
        <label>
          Nachname
          <input value={fam} onChange={(e) => setFam(e.target.value)} required />
        </label>
        <label>
          Vorname
          <input value={given} onChange={(e) => setGiven(e.target.value)} required />
        </label>
        <label>
          Geburtsdatum (YYYYMMDD)
          <input value={birth} onChange={(e) => setBirth(e.target.value)} required />
        </label>
        <button type="submit">An Server senden (POST)</button>
      </form>
    </div>
  );
}
