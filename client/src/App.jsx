import { useState } from 'react';
import './App.css';
import Hl7Tab from './tabs/Hl7Tab.jsx';
import GdtTab from './tabs/GdtTab.jsx';
import DicomTab from './tabs/DicomTab.jsx';

export default function App() {
  const [tab, setTab] = useState('hl7');

  return (
    <div className="app">
      <header className="hero">
        <p className="hero-badge">Eigenprojekt · Schnittstellen &amp; Integration</p>
        <h1 className="hero-title">
          Medizinische Schnittstellen
          <span className="hero-title-line2">Integrations-Demo (Mock)</span>
        </h1>
        <p className="hero-lead">
          Kleine Full-Stack-Übung: typische Formate aus der Krankenhaus-IT werden über eine{' '}
          <strong>REST-API</strong> angebunden, im Browser <strong>angezeigt und geparst</strong> – ohne
          produktiven Patientenbetrieb, aber mit realistischen Bausteinen für{' '}
          <strong>Application Operations</strong> und Schnittstellen-Onboarding.
        </p>
        <ul className="hero-cards" aria-label="Inhalte dieser Demo">
          <li className="hero-card">
            <span className="hero-card-tag">HL7 v2</span>
            <span className="hero-card-text">Nachrichten-Mock, Pipe-Rohdaten &amp; Tabellenansicht</span>
          </li>
          <li className="hero-card">
            <span className="hero-card-tag">DICOM</span>
            <span className="hero-card-text">Testbilder, Metadaten &amp; einfache Bildvorschau</span>
          </li>
          <li className="hero-card">
            <span className="hero-card-tag">GDT</span>
            <span className="hero-card-text">Gerätedaten als XML, Parser &amp; Editor</span>
          </li>
        </ul>
      </header>

      <section className="demo-block" aria-labelledby="demo-title">
        <div className="demo-block-head">
          <h2 id="demo-title" className="demo-block-title">
            Live ausprobieren
          </h2>
          <p className="demo-block-desc">
            Wähle eine Schnittstelle – die Daten kommen vom Backend, das Frontend zeigt sie aufbereitet.
          </p>
        </div>
        <nav className="tabs" aria-label="Schnittstelle wählen">
          <button type="button" className={tab === 'hl7' ? 'active' : ''} onClick={() => setTab('hl7')}>
            HL7
          </button>
          <button type="button" className={tab === 'dicom' ? 'active' : ''} onClick={() => setTab('dicom')}>
            DICOM
          </button>
          <button type="button" className={tab === 'gdt' ? 'active' : ''} onClick={() => setTab('gdt')}>
            GDT
          </button>
        </nav>
      </section>

      {tab === 'hl7' && <Hl7Tab />}
      {tab === 'dicom' && <DicomTab />}
      {tab === 'gdt' && <GdtTab />}

      <footer className="app-footer">
        Stack: React · Vite · Node.js · Express · REST · Open-Source-DICOM-Samples (pydicom)
      </footer>
    </div>
  );
}
