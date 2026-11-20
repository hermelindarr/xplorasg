import { describe, expect, it } from 'vitest';
import { buildXlsx, reportHtml, tableToCsv, zipStore, type ReportTable } from '../src/utils/reportExport';
import { buildReport } from '../src/utils/adminReport';

const table: ReportTable = {
  name: 'Prestadores',
  columns: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'servicios', label: 'Servicios' },
    { key: 'activo', label: 'Activo' },
  ],
  rows: [
    { nombre: 'Cabañas "El Río", Jalpan', servicios: 3, activo: true },
    { nombre: 'Peñamiller <Ecotours>', servicios: 0, activo: false },
  ],
};

/** Lee las entradas de un ZIP (cabeceras locales) para comprobar nombres, tamaños y CRC. */
const readZip = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries: Array<{ name: string; text: string; crc: number }> = [];
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034B50) {
    const crc = view.getUint32(offset + 14, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const text = new TextDecoder().decode(bytes.subarray(offset + 30 + nameLength, offset + 30 + nameLength + size));
    entries.push({ name, text, crc });
    offset += 30 + nameLength + size;
  }
  return { entries, end: view.getUint32(bytes.length - 22, true) };
};

describe('exportación del reporte', () => {
  it('CSV con BOM, encabezados y comillas escapadas', () => {
    const csv = tableToCsv(table);
    expect(csv.startsWith('﻿Nombre,Servicios,Activo')).toBe(true);
    expect(csv).toContain('"Cabañas ""El Río"", Jalpan",3,Sí');
    expect(csv).toContain('Peñamiller <Ecotours>,0,No');
  });

  it('ZIP válido: cabeceras, fin de directorio y CRC32 conocido', () => {
    const zip = zipStore([{ name: 'a.txt', content: 'hola' }]);
    const { entries, end } = readZip(zip);
    expect(end).toBe(0x06054B50);
    expect(entries[0].name).toBe('a.txt');
    expect(entries[0].text).toBe('hola');
    // El CRC se compara con un cálculo independiente y con el vector de prueba oficial.
    const crc32 = (text: string) => {
      let c = 0xFFFFFFFF;
      for (const byte of new TextEncoder().encode(text)) {
        c ^= byte;
        for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      }
      return (c ^ 0xFFFFFFFF) >>> 0;
    };
    expect(entries[0].crc).toBe(crc32('hola'));
    expect(crc32('123456789')).toBe(0xCBF43926); // vector de prueba oficial de CRC-32
  });

  it('XLSX con las partes de Office Open XML, una hoja por tabla y texto escapado', () => {
    const { entries } = readZip(buildXlsx([table, { ...table, name: 'Lugares/Servicios' }]));
    const names = entries.map((entry) => entry.name);
    expect(names).toEqual(expect.arrayContaining([
      '[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml',
      'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml',
    ]));
    const workbook = entries.find((entry) => entry.name === 'xl/workbook.xml')!.text;
    expect(workbook).toContain('name="Prestadores"');
    expect(workbook).toContain('name="Lugares Servicios"'); // "/" no se permite en nombres de hoja
    const sheet = entries.find((entry) => entry.name === 'xl/worksheets/sheet1.xml')!.text;
    expect(sheet).toContain('Cabañas &quot;El Río&quot;, Jalpan');
    expect(sheet).toContain('Peñamiller &lt;Ecotours&gt;');
    expect(sheet).toContain('<c r="B2"><v>3</v></c>'); // números como números
    for (const entry of entries) {
      const doc = new DOMParser().parseFromString(entry.text, 'application/xml');
      expect(doc.getElementsByTagName('parsererror').length).toBe(0);
    }
  });

  it('el documento Word/impresión incluye resumen, tablas y escapa HTML', () => {
    const report = buildReport({
      generadoEn: '2026-11-18T10:00:00Z',
      actividad: { usuarios: 12, favoritos: 4, promociones_activas: 1, eventos_proximos: 2, solicitudes_pendientes: 3 },
      prestadores: [{ prestador: '<script>x</script>', estado: 'aprobado', servicios: 1, publicados: 1, pendientes: 0 }],
      lugares: [{ nombre: 'Cañón del Paraíso', municipio: 'Peñamiller', estado: 'en_revision', con_coordenadas: true }],
      servicios: [],
      municipios: [{ municipio: 'Jalpan de Serra', lugares: 4, lugares_publicados: 4, servicios: 3, servicios_publicados: 2 }],
    });
    expect(report.tables.map((t) => t.name)).toEqual(['Prestadores', 'Lugares', 'Servicios', 'Municipios', 'Actividad']);
    const html = reportHtml(report, true);
    expect(html).toContain('xmlns:w="urn:schemas-microsoft-com:office:word"');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('En revisión');
    expect(html).toContain('Sin registros.');
  });
});
