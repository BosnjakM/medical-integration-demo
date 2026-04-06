export function parseGdtDemoXml(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('XML Parser-Fehler: ' + parseError.textContent);
  }

  const root = doc.documentElement;
  if (!root || root.localName !== 'gdtBatch') {
    throw new Error('Erwartetes Root-Element <gdtBatch>');
  }

  const batchAttrs = {};
  for (const a of root.attributes) {
    batchAttrs[a.name] = a.value;
  }

  const records = [];
  const deviceNodes = root.querySelectorAll('deviceRecord');

  deviceNodes.forEach((node) => {
    const gdtId = node.getAttribute('gdtId') || '';
    const deviceType = node.getAttribute('deviceType') || '';
    const fields = [];
    node.querySelectorAll('field').forEach((f) => {
      fields.push({
        id: f.getAttribute('id') || '',
        name: f.getAttribute('name') || '',
        value: (f.textContent || '').trim(),
      });
    });
    records.push({ gdtId, deviceType, fields });
  });

  return { batchAttrs, records };
}
