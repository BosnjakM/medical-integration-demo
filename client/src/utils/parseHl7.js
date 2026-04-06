export function parseHl7PipeMessage(raw) {
  if (!raw || typeof raw !== 'string') return [];

  const lines = raw.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const fields = line.split('|');
    const segment = fields[0] || '';
    return { segment, fields };
  });
}

export function segmentsToRows(segments) {
  const rows = [];
  segments.forEach(({ segment, fields }) => {
    fields.forEach((val, idx) => {
      if (idx === 0) return;
      rows.push({
        segment,
        fieldIndex: idx,
        value: val,
      });
    });
  });
  return rows;
}
