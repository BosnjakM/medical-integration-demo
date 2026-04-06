# Medizinische Schnittstellen – Integrations-Demo

**Eigenprojekt** zu Schnittstellen in der Krankenhaus-IT: **HL7**, **DICOM** und **GDT** sind hier nicht produktiv angebunden, sondern **gemockt** und über **HTTP/REST** angebunden – inklusive Parsing im Browser und kurzer fachlicher Einordnung in der UI.

## Was ist drin?

| Bereich | Inhalt |
|--------|--------|
| **HL7 v2** | 7 Mock-Patienten/Nachrichten als JSON mit `rawHl7` (Pipe-Notation) und `parsed`. REST: lesen + neuen Eintrag simulieren. |
| **DICOM** | 5 optionale Testbilder (Download von **pydicom**, Open Source). REST: Liste mit Metadaten (`dicom-parser`), Datei-Stream, Upload. Frontend zeigt Metadaten und eine **Graustufen-Vorschau** für unkomprimierte Bilder. |
| **GDT** | 5 Gerätedatensätze in einem **Demo-XML** (lesbar statt fester GDT-Zeilenlänge). REST: XML laden/speichern; Frontend parst mit `DOMParser`. |

## Voraussetzungen

- **Node.js** 18+ (empfohlen: aktuelle LTS)

## Installation

```bash
cd medical-interfaces-demo
npm run install:all
```

## DICOM-Testdateien laden

Die `.dcm`-Dateien liegen nicht im Repo (Binärdateien). Einmalig:

```bash
npm run download-dicom
```

Das Skript lädt kleine Dateien aus dem [pydicom](https://github.com/pydicom/pydicom)-Repository (Open Source).

## Starten (Entwicklung)

Zwei Prozesse parallel (Backend + Vite-Frontend):

```bash
npm run dev
```

- **Frontend:** http://localhost:5173 (Proxy leitet `/api` an den Server weiter)
- **Backend:** http://localhost:4001 (wechselbar mit `PORT=…`)

Nur Server:

```bash
npm run start
```

## API-Übersicht (Backend)

| Methode | Pfad | Zweck |
|--------|------|--------|
| GET | `/api/hl7/patients` | Alle HL7-Mock-Einträge (JSON) |
| GET | `/api/hl7/patients.xml` | Gleiche Daten als XML |
| POST | `/api/hl7/patients` | JSON-Body mit `parsed.patientId` usw. → anhängen |
| GET | `/api/gdt/raw` | `{ xml: "..." }` |
| GET | `/api/gdt/xml` | Rohes XML |
| POST | `/api/gdt/xml` | XML ersetzen (`{ "xml": "..." }` oder `text/xml` Body) |
| GET | `/api/dicom/list` | Dateien + Metadaten |
| GET | `/api/dicom/file/:name` | Einzeldatei (`application/dicom`) |
| POST | `/api/dicom/upload` | Multipart-Feld `dicom` |
| GET | `/api/health` | Healthcheck |

## Wie die Schnittstellen hier abgebildet sind

- **HL7:** In Produktion läuft HL7 v2 typischerweise über **MLLP/TCP** oder Middleware. Hier liegen Beispielnachrichten in `rawHl7` (Pipe-Notation); die Auswertung erfolgt tabellarisch und mit einem einfachen Pipe-Split im Frontend.
- **DICOM:** PACS/Viewer nutzen u. a. **C-FIND / C-MOVE / WADO-RS**. Dieses Projekt bildet den Weg **Datei + REST** ab: Ablage, Metadaten und Pixelvorschau (unkomprimiert) mit **dicom-parser**.
- **GDT:** In der Praxis oft **BDT/LDT** mit festen Feldlängen. Das Demo-XML zeigt typische Inhalte (Patient, Messwerte, Gerät) in lesbarer Form für **Parsing und Anzeige** im Browser.

## Projektstruktur

```
medical-interfaces-demo/
├── README.md
├── app.mjs                 # Einstieg für Vercel (Express-API)
├── vercel.json
├── package.json
├── public/                 # nur nach `npm run vercel-build` (Deploy, nicht committen)
├── client/                 # React (Vite)
│   └── src/
│       ├── tabs/           # HL7-, DICOM-, GDT-Tab
│       └── utils/          # parseGdt, parseHl7, dicomPreview
└── server/                 # Express
    ├── index.js            # lokaler Start + optional client/dist
    ├── app.js              # reine API (lokal + Vercel)
    ├── lib/dicomMeta.js
    ├── data/hl7/patients.json
    ├── data/gdt/devices.xml
    ├── data/dicom/         # .dcm nach download-dicom / vercel-build
    └── scripts/download-dicom-samples.js
```
Lokal testen wie auf Vercel (optional): [Vercel CLI](https://vercel.com/docs/cli) installieren, im Projektordner `vercel dev`.

## Lizenz-Hinweis

Die per Skript geladenen DICOM-Dateien stammen aus dem **pydicom**-Projekt (BSD-Lizenz). Siehe dortige Lizenzdatei für Details.
