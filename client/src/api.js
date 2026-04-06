const base = '';

export async function fetchHl7Patients() {
  const r = await fetch(`${base}/api/hl7/patients`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'HL7 Fehler');
  return j.data;
}

export async function postHl7Patient(payload) {
  const r = await fetch(`${base}/api/hl7/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Speichern fehlgeschlagen');
  return j.data;
}

export async function fetchGdtXml() {
  const r = await fetch(`${base}/api/gdt/raw`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'GDT Fehler');
  return j.xml;
}

export async function postGdtXml(xmlString) {
  const r = await fetch(`${base}/api/gdt/xml`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xml: xmlString }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'GDT speichern fehlgeschlagen');
  return j;
}

export async function fetchDicomList() {
  const r = await fetch(`${base}/api/dicom/list`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'DICOM Liste Fehler');
  return j.data;
}

export function dicomFileUrl(fileName) {
  return `${base}/api/dicom/file/${encodeURIComponent(fileName)}`;
}

export async function uploadDicom(file) {
  const fd = new FormData();
  fd.append('dicom', file);
  const r = await fetch(`${base}/api/dicom/upload`, {
    method: 'POST',
    body: fd,
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Upload fehlgeschlagen');
  return j;
}
