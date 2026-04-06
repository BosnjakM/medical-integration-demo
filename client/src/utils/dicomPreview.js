import dicomParser from 'dicom-parser';

export function renderDicomToCanvas(arrayBuffer, canvas) {
  const byteArray = new Uint8Array(arrayBuffer);
  let dataSet;
  try {
    dataSet = dicomParser.parseDicom(byteArray);
  } catch (e) {
    return { ok: false, message: 'DICOM Parse: ' + (e.message || String(e)) };
  }

  const rows = dataSet.uint16('x00280010');
  const cols = dataSet.uint16('x00280011');
  const bitsAllocated = dataSet.uint16('x00280100');
  const photo = (dataSet.string('x00280004') || '').trim();

  const pixelEl = dataSet.elements.x7fe00010;
  if (!pixelEl || !rows || !cols) {
    return {
      ok: false,
      message:
        'Keine Bildmatrix oder Pixeldaten (z. B. RTPLAN, komprimiertes Bild oder nur Metadaten). Metadaten siehe Tabelle.',
    };
  }

  if (photo !== 'MONOCHROME2' && photo !== 'MONOCHROME1') {
    return {
      ok: false,
      message: `Photometric Interpretation "${photo}" – Vorschau nur für MONOCHROME1/2 in dieser Demo.`,
    };
  }

  if (bitsAllocated !== 8 && bitsAllocated !== 16) {
    return { ok: false, message: `bitsAllocated=${bitsAllocated} wird hier nicht gerendert.` };
  }

  const totalPixels = rows * cols;
  let pixels;

  const pixelBytes = arrayBuffer.slice(pixelEl.dataOffset, pixelEl.dataOffset + pixelEl.length);

  if (bitsAllocated === 16) {
    pixels = new Int16Array(pixelBytes);
    if (pixels.length < totalPixels) {
      return { ok: false, message: 'Pixeldaten zu kurz für angegebene Matrix.' };
    }
  } else {
    pixels = new Uint8Array(pixelBytes);
    if (pixels.length < totalPixels) {
      return { ok: false, message: 'Pixeldaten zu kurz für angegebene Matrix.' };
    }
  }

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < totalPixels; i++) {
    const v = pixels[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;

  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(cols, rows);

  for (let i = 0; i < totalPixels; i++) {
    let v = pixels[i];
    if (photo === 'MONOCHROME1') {
      v = max + min - v;
    }
    const g = Math.round(((v - min) / range) * 255);
    const j = i * 4;
    imgData.data[j] = g;
    imgData.data[j + 1] = g;
    imgData.data[j + 2] = g;
    imgData.data[j + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return { ok: true };
}
