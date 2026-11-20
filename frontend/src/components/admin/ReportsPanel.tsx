// Reportes del administrador: lista de prestadores, lugares, servicios, municipios y métricas de actividad,
// descargables en Excel (.xlsx), CSV, Word (.doc) o para imprimir / guardar como PDF.
import { useState } from 'react';
import { errorMessage } from '../../services/authorizedFetch';
import { moderationApi } from '../../services/moderationApi';
import { buildReport } from '../../utils/adminReport';
import { downloadCsv, downloadWord, downloadXlsx, printReport, type ReportDocument } from '../../utils/reportExport';
import { FileIcon } from './AdminIcons';
import { Notice } from './AdminUi';

const stamp = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

export const ReportsPanel = ({ token }: { token: string }) => {
  const [report, setReport] = useState<ReportDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Se pide al servidor cada vez que se exporta, para que el archivo tenga los datos del momento.
  const fresh = async (): Promise<ReportDocument | null> => {
    setLoading(true);
    setError('');
    try {
      const response = await moderationApi.report(token);
      const built = buildReport(response.data);
      setReport(built);
      return built;
    } catch (requestError) {
      setError(errorMessage(requestError, 'No fue posible generar el reporte.'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const run = (action: (doc: ReportDocument) => void) => async () => {
    const doc = await fresh();
    if (doc) action(doc);
  };

  const formats = [
    { label: 'Excel (.xlsx)', hint: 'Todas las tablas, una hoja por tabla', button: 'Descargar', action: run((doc) => downloadXlsx(doc.tables, `xplorasg-reporte-${stamp()}.xlsx`)) },
    { label: 'Word (.doc)', hint: 'Documento editable con resumen y tablas', button: 'Descargar', action: run((doc) => downloadWord(doc, `xplorasg-reporte-${stamp()}.doc`)) },
    { label: 'Imprimir o PDF', hint: 'Abre el diálogo de impresión', button: 'Imprimir', action: run(printReport) },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
      <div>
        <ul className="divide-y divide-brand-sand border-y border-brand-sand">
          {formats.map((format) => (
            <li key={format.label} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-brand-blue">{format.label}</p>
                <p className="text-label text-brand-blue/70">{format.hint}</p>
              </div>
              <button type="button" disabled={loading} onClick={() => void format.action()} className="btn btn-secondary shrink-0">
                <FileIcon className="size-4" /> {loading ? 'Generando…' : format.button}
              </button>
            </li>
          ))}
        </ul>
        {error && <Notice tone="error" className="mt-4">{error}</Notice>}
      </div>

      <div>
        <p className="text-label text-brand-blue/70">CSV por tabla (para importar en otros sistemas):</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {['Prestadores', 'Lugares', 'Servicios', 'Municipios', 'Actividad'].map((name) => (
            <li key={name}>
              <button
                type="button"
                disabled={loading}
                onClick={() => void run((doc) => {
                  const table = doc.tables.find((item) => item.name === name);
                  if (table) downloadCsv(table, `xplorasg-${name.toLowerCase()}-${stamp()}.csv`);
                })()}
                className="btn btn-ghost border border-brand-blue/15"
              >
                {name}{report ? <span className="tabular-nums text-brand-blue/60"> {report.tables.find((item) => item.name === name)?.rows.length ?? 0}</span> : null}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-label leading-5 text-brand-blue/70">Incluye estatus de publicación, municipio y solicitudes pendientes. Los datos se toman del servidor en el momento de descargar.</p>
      </div>
    </div>
  );
};
