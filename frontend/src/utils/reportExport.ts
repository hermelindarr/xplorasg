// Exportación del reporte del administrador, generada en el navegador (sin dependencias):
//   · Excel (.xlsx): libro con una hoja por tabla (Office Open XML empaquetado en ZIP sin compresión).
//   · CSV (.csv): una tabla, UTF-8 con BOM y separador coma (Excel lo abre con acentos correctos).
//   · Word (.doc): documento HTML con el formato que Word abre y edita.
//   · Impresión: el mismo documento en un iframe oculto → diálogo de imprimir / guardar como PDF.

export interface ReportColumn {
  key: string;
  label: string;
  /** Formato para mostrar el valor (fechas, sí/no…). */
  format?: (value: unknown) => string | number;
}

export interface ReportTable {
  name: string;
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
}

export interface ReportDocument {
  title: string;
  subtitle: string;
  summary: Array<{ label: string; value: string | number }>;
  tables: ReportTable[];
}

const cellValue = (column: ReportColumn, row: Record<string, unknown>): string | number => {
  const raw = row[column.key];
  if (column.format) return column.format(raw);
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return raw ? 'Sí' : 'No';
  if (typeof raw === 'number') return raw;
  return String(raw);
};

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ---------------------------------------------------------------- CSV

export const tableToCsv = (table: ReportTable): string => {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    table.columns.map((column) => escape(column.label)).join(','),
    ...table.rows.map((row) => table.columns.map((column) => escape(cellValue(column, row))).join(',')),
  ];
  return `﻿${lines.join('\r\n')}`;
};

export const downloadCsv = (table: ReportTable, filename: string) =>
  download(new Blob([tableToCsv(table)], { type: 'text/csv;charset=utf-8' }), filename);

// ---------------------------------------------------------------- XLSX (ZIP "store" + Office Open XML)

const xml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const columnName = (index: number) => {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
};

const sheetXml = (table: ReportTable) => {
  const header = `<row r="1">${table.columns.map((column, c) => `<c r="${columnName(c)}1" t="inlineStr" s="1"><is><t>${xml(column.label)}</t></is></c>`).join('')}</row>`;
  const body = table.rows.map((row, r) => {
    const cells = table.columns.map((column, c) => {
      const ref = `${columnName(c)}${r + 2}`;
      const value = cellValue(column, row);
      return typeof value === 'number' && Number.isFinite(value)
        ? `<c r="${ref}"><v>${value}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(String(value))}</t></is></c>`;
    }).join('');
    return `<row r="${r + 2}">${cells}</row>`;
  }).join('');
  const widths = table.columns.map((column, c) => {
    const longest = Math.max(column.label.length, ...table.rows.slice(0, 200).map((row) => String(cellValue(column, row)).length));
    return `<col min="${c + 1}" max="${c + 1}" width="${Math.min(60, Math.max(10, longest + 2))}" customWidth="1"/>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${header}${body}</sheetData></worksheet>`;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (data: Uint8Array) => {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i += 1) crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

/** ZIP sin compresión (método 0): suficiente para .xlsx y compatible con Excel, LibreOffice y Google Sheets. */
export const zipStore = (files: Array<{ name: string; content: string }>): Uint8Array => {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint16(8, 0, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014B50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054B50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const parts = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let position = 0;
  for (const part of parts) { out.set(part, position); position += part.length; }
  return out;
};

export const buildXlsx = (tables: ReportTable[]): Uint8Array => {
  const safeName = (name: string, index: number) => xml(name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Hoja ${index + 1}`);
  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${tables.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${tables.map((table, i) => `<sheet name="${safeName(table.name, i)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${tables.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${tables.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
    },
    ...tables.map((table, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: sheetXml(table) })),
  ];
  return zipStore(files);
};

export const downloadXlsx = (tables: ReportTable[], filename: string) => {
  const bytes = buildXlsx(tables);
  download(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
};

// ---------------------------------------------------------------- Word e impresión (mismo documento HTML)

export const reportHtml = (report: ReportDocument, forWord = false): string => {
  const esc = (value: string | number) => xml(String(value));
  const tables = report.tables.map((table) => `
    <h2>${esc(table.name)} <span class="count">(${table.rows.length})</span></h2>
    ${table.rows.length ? `<table>
      <thead><tr>${table.columns.map((column) => `<th>${esc(column.label)}</th>`).join('')}</tr></thead>
      <tbody>${table.rows.map((row) => `<tr>${table.columns.map((column) => {
        const value = cellValue(column, row);
        return `<td${typeof value === 'number' ? ' class="num"' : ''}>${esc(value)}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table>` : '<p class="empty">Sin registros.</p>'}`).join('');
  return `<!doctype html>
<html lang="es"${forWord ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"' : ''}>
<head>
<meta charset="utf-8">
<title>${esc(report.title)}</title>
${forWord ? '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' : ''}
<style>
  @page { size: letter landscape; margin: 1.6cm; }
  body { font-family: Calibri, Arial, sans-serif; color: #1F2C24; font-size: 10.5pt; line-height: 1.4; }
  h1 { font-family: Georgia, serif; font-weight: normal; font-size: 22pt; margin: 0 0 2pt; }
  .subtitle { color: #555; margin: 0 0 14pt; }
  .summary { border-collapse: collapse; margin: 0 0 18pt; }
  .summary td { padding: 4pt 16pt 4pt 0; }
  .summary .value { font-size: 15pt; font-family: Georgia, serif; }
  h2 { font-family: Georgia, serif; font-weight: normal; font-size: 14pt; margin: 18pt 0 6pt; border-bottom: 1px solid #E6DCCB; padding-bottom: 3pt; }
  h2 .count { color: #777; font-size: 10pt; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th { text-align: left; font-weight: bold; border-bottom: 1.5px solid #1F2C24; padding: 4pt 6pt; }
  td { border-bottom: 1px solid #E6DCCB; padding: 3.5pt 6pt; vertical-align: top; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .empty { color: #777; }
  footer { margin-top: 18pt; color: #777; font-size: 9pt; }
</style>
</head>
<body>
  <h1>${esc(report.title)}</h1>
  <p class="subtitle">${esc(report.subtitle)}</p>
  <table class="summary"><tr>${report.summary.map((item) => `<td><div class="value">${esc(item.value)}</div><div>${esc(item.label)}</div></td>`).join('')}</tr></table>
  ${tables}
  <footer>Generado desde el panel de administración de XploraSG.</footer>
</body>
</html>`;
};

export const downloadWord = (report: ReportDocument, filename: string) =>
  download(new Blob(['﻿', reportHtml(report, true)], { type: 'application/msword' }), filename);

export const printReport = (report: ReportDocument) => {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(reportHtml(report));
  doc.close();
  const run = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  if (doc.readyState === 'complete') setTimeout(run, 50);
  else frame.addEventListener('load', run, { once: true });
};
