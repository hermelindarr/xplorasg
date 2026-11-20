// Arma el documento del reporte (tablas con columnas en español) a partir de los datos del servidor.
import type { ReportData } from '../services/moderationApi';
import type { ReportDocument, ReportTable } from './reportExport';

const STATE: Record<string, string> = {
  borrador: 'Borrador', en_revision: 'En revisión', aprobado: 'Publicado', rechazado: 'Rechazado', suspendido: 'Suspendido',
};
const state = (value: unknown) => STATE[String(value)] ?? String(value ?? '');
const date = (value: unknown) => (value ? new Date(String(value)).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Mexico_City' }) : '');
const yesNo = (value: unknown) => (value ? 'Sí' : 'No');

export const buildReport = (data: ReportData): ReportDocument => {
  const tables: ReportTable[] = [
    {
      name: 'Prestadores',
      columns: [
        { key: 'prestador', label: 'Prestador' },
        { key: 'estado', label: 'Estatus', format: state },
        { key: 'municipios', label: 'Municipios' },
        { key: 'servicios', label: 'Servicios' },
        { key: 'publicados', label: 'Publicados' },
        { key: 'pendientes', label: 'Pendientes de revisión' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'correo', label: 'Correo' },
        { key: 'cuenta', label: 'Cuenta vinculada' },
        { key: 'registrado', label: 'Registrado', format: date },
      ],
      rows: data.prestadores,
    },
    {
      name: 'Lugares',
      columns: [
        { key: 'nombre', label: 'Lugar' },
        { key: 'municipio', label: 'Municipio' },
        { key: 'categoria', label: 'Categoría' },
        { key: 'estado', label: 'Estatus', format: state },
        { key: 'altitud', label: 'Altitud (m)' },
        { key: 'con_coordenadas', label: 'En el mapa', format: yesNo },
        { key: 'favoritos', label: 'Favoritos' },
        { key: 'actualizado', label: 'Actualizado', format: date },
      ],
      rows: data.lugares,
    },
    {
      name: 'Servicios',
      columns: [
        { key: 'nombre', label: 'Servicio' },
        { key: 'prestador', label: 'Prestador' },
        { key: 'municipio', label: 'Municipio' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'estado', label: 'Estatus', format: state },
        { key: 'cambios_pendientes', label: 'Cambios pendientes', format: yesNo },
        { key: 'contacto', label: 'Contacto' },
        { key: 'actualizado', label: 'Actualizado', format: date },
      ],
      rows: data.servicios,
    },
    {
      name: 'Municipios',
      columns: [
        { key: 'municipio', label: 'Municipio' },
        { key: 'lugares', label: 'Lugares' },
        { key: 'lugares_publicados', label: 'Lugares publicados' },
        { key: 'servicios', label: 'Servicios' },
        { key: 'servicios_publicados', label: 'Servicios publicados' },
      ],
      rows: data.municipios,
    },
  ];
  const a = data.actividad ?? {};
  const activity: ReportTable = {
    name: 'Actividad',
    columns: [{ key: 'metrica', label: 'Métrica' }, { key: 'valor', label: 'Valor' }],
    rows: [
      { metrica: 'Usuarios registrados', valor: a.usuarios ?? 0 },
      { metrica: 'Favoritos guardados', valor: a.favoritos ?? 0 },
      { metrica: 'Promociones activas', valor: a.promociones_activas ?? 0 },
      { metrica: 'Eventos próximos', valor: a.eventos_proximos ?? 0 },
      { metrica: 'Solicitudes pendientes de revisión', valor: a.solicitudes_pendientes ?? 0 },
    ],
  };
  const generated = new Date(data.generadoEn);
  return {
    title: 'Reporte general de XploraSG',
    subtitle: `Sierra Gorda de Querétaro. Generado el ${generated.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' })}.`,
    summary: [
      { label: 'Prestadores', value: data.prestadores.length },
      { label: 'Lugares', value: data.lugares.length },
      { label: 'Servicios', value: data.servicios.length },
      { label: 'Pendientes de revisión', value: a.solicitudes_pendientes ?? 0 },
      { label: 'Usuarios', value: a.usuarios ?? 0 },
    ],
    tables: [...tables, activity],
  };
};

