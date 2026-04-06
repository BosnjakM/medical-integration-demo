import dicomParser from 'dicom-parser';

function getString(dataSet, tag) {
  try {
    const el = dataSet.elements[tag];
    if (!el) return '';
    return dataSet.string(tag) || '';
  } catch {
    return '';
  }
}

function getNumber(dataSet, tag) {
  try {
    const v = dataSet.uint16(tag);
    return v === undefined ? null : v;
  } catch {
    return null;
  }
}

export function extractDicomMetadata(buffer) {
  const byteArray = new Uint8Array(buffer);
  let dataSet;
  try {
    dataSet = dicomParser.parseDicom(byteArray);
  } catch (e) {
    return {
      error: true,
      message: e.message || 'DICOM konnte nicht gelesen werden',
    };
  }

  const meta = {
    error: false,
    patientName: getString(dataSet, 'x00100010'),
    patientId: getString(dataSet, 'x00100020'),
    patientBirthDate: getString(dataSet, 'x00100030'),
    patientSex: getString(dataSet, 'x00100040'),
    studyDate: getString(dataSet, 'x00080020'),
    studyTime: getString(dataSet, 'x00080030'),
    modality: getString(dataSet, 'x00080060'),
    studyDescription: getString(dataSet, 'x00081030'),
    seriesDescription: getString(dataSet, 'x0008103e'),
    rows: getNumber(dataSet, 'x00280010'),
    columns: getNumber(dataSet, 'x00280011'),
    bitsAllocated: getNumber(dataSet, 'x00280100'),
    photometricInterpretation: getString(dataSet, 'x00280004'),
    transferSyntaxUID: getString(dataSet, 'x00020010'),
  };

  return meta;
}
