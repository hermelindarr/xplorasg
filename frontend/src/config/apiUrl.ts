// URL de la API de XploraSG.
// 1. Si se compila con VITE_API_URL, se usa esa.
// 2. En producción sin VITE_API_URL (por ejemplo, en cPanel), se usa el subdominio "api." del sitio:
//    https://xplorasg.com.mx  ->  https://api.xplorasg.com.mx   (también funciona desde www.)
// 2b. En Vercel (*.vercel.app), el mismo dominio: la API está en /api.
// 3. En desarrollo, http://localhost:3000.
const resolveApiUrl = (): string => {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // En Vercel la API vive en el mismo dominio (/api), publicada como función.
    if (hostname.endsWith('.vercel.app')) return `${protocol}//${window.location.host}`;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//api.${hostname.replace(/^www\./, '')}`;
    }
  }
  return 'http://localhost:3000';
};

export const API_URL = resolveApiUrl();
