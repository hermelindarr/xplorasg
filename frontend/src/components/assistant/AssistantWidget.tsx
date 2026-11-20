// Chatboot flotante: botón con el retrato de la guacamaya verde. Se abre como tarjeta en escritorio
// y como hoja inferior en móvil, sin tapar la navegación principal.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMessages } from '../../i18n';
import { assistantMessages } from '../../i18n/assistant';
import { CloseIcon } from '../brand/icons';
import { MacawAvatar } from '../brand/Macaw';
// El chat (con voz) se descarga al abrir el asistente por primera vez, no al cargar cada página.
const AssistantChat = lazy(() => import('./AssistantChat').then((module) => ({ default: module.AssistantChat })));

const TEASER_KEY = 'xplora:assistantTeaser';

export const AssistantWidget = () => {
  const m = useMessages(assistantMessages);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hidden = pathname === '/asistente' || pathname.startsWith('/admin') || pathname === '/login';

  // La burbuja se retira sola a los 8 s para no tapar contenido.
  useEffect(() => {
    if (!teaser) return;
    const timer = window.setTimeout(() => {
      setTeaser(false);
      try { sessionStorage.setItem(TEASER_KEY, '1'); } catch { /* sin almacenamiento */ }
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [teaser]);

  // Burbuja de bienvenida una sola vez por sesión.
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(TEASER_KEY) === '1'; } catch { /* sin almacenamiento */ }
    if (seen) return;
    // Aparece cuando la persona ya se desplazó (no tapa el buscador del inicio) y tras unos segundos.
    let timer = 0;
    const onScroll = () => {
      if (window.scrollY < 700 || timer) return;
      timer = window.setTimeout(() => setTeaser(true), 1200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const dismissTeaser = () => {
    setTeaser(false);
    try { sessionStorage.setItem(TEASER_KEY, '1'); } catch { /* sin almacenamiento */ }
  };

  const toggle = () => {
    dismissTeaser();
    setMounted(true);
    setOpen((value) => !value);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    // En móvil la hoja ocupa la pantalla: se bloquea el scroll del fondo.
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    const previous = document.body.style.overflow;
    if (mobile) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Otras pantallas pueden abrir el asistente con el evento 'xplora:open-assistant'.
  useEffect(() => {
    const open = () => { setMounted(true); setOpen(true); };
    window.addEventListener('xplora:open-assistant', open);
    return () => window.removeEventListener('xplora:open-assistant', open);
  }, []);

  // Cerrar al cambiar de página (se deriva durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  if (hidden) return null;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={m.closeWidget}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[1090] bg-brand-blue/30 sm:hidden"
        />
      )}

      {mounted && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={m.chatName}
          hidden={!open}
          className="assistant-panel fixed inset-x-0 bottom-0 z-[1100] flex h-[86dvh] flex-col overflow-hidden rounded-t-xl border border-brand-blue/15 bg-brand-paper shadow-soft sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-xl"
        >
          <header className="relative flex items-center gap-3 border-b border-brand-sand bg-brand-light px-5 py-3.5 text-brand-blue">
            <MacawAvatar className="size-11" />
            <div className="relative min-w-0 flex-1">
              <p className="font-display truncate text-lg leading-tight">{m.chatName}</p>
              <p className="label-quiet mt-0.5 flex items-center gap-1.5 truncate">
                <i className={`size-1.5 shrink-0 rounded-full ${online ? 'bg-brand-green' : 'bg-ochre-600'}`} aria-hidden="true" />
                {online ? m.widgetStatus : m.statusOffline}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChatKey((value) => value + 1)}
              aria-label={m.newChat}
              title={m.newChat}
              className="relative grid size-9 pointer-coarse:size-11 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-sand/70 hover:text-brand-blue"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" /></svg>
            </button>
            <Link
              to="/asistente"
              aria-label={m.expand}
              title={m.expand}
              className="relative grid size-9 pointer-coarse:size-11 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-sand/70 hover:text-brand-blue"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>
            </Link>
            <button
              type="button"
              onClick={() => { setOpen(false); fabRef.current?.focus(); }}
              aria-label={m.closeWidget}
              className="relative grid size-9 pointer-coarse:size-11 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-sand/70 hover:text-brand-blue"
            >
              <CloseIcon className="size-4" />
            </button>
          </header>
          <div className="min-h-0 flex-1">
            <Suspense fallback={<div className="h-full animate-pulse bg-brand-paper" role="status" aria-busy="true" />}>
              <AssistantChat key={chatKey} variant="widget" autoFocus={open} onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      <div className={`fixed bottom-[5.5rem] right-4 z-[1100] items-end gap-3 sm:bottom-6 sm:right-6 ${open ? 'hidden sm:flex' : 'flex'}`}>
        {teaser && !open && (
          <div className="animate-fade-up relative mb-3 hidden max-w-[230px] rounded-2xl rounded-br-sm bg-brand-green px-4 py-3 font-display text-base leading-snug text-white shadow-[0_10px_30px_-10px_rgba(31,44,36,.5)] sm:block">
            {m.widgetTeaser}
            <button type="button" onClick={dismissTeaser} aria-label={m.closeWidget} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-brand-sand bg-white text-brand-blue/70 hover:text-brand-blue">
              <CloseIcon className="size-3" />
            </button>
          </div>
        )}
        <button
          ref={fabRef}
          type="button"
          onClick={toggle}
          aria-label={open ? m.closeWidget : m.openWidget}
          aria-expanded={open}
          className={`assistant-fab group relative grid size-16 place-items-center rounded-full shadow-[0_10px_30px_-8px_rgba(31,44,36,.45)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 active:scale-95 ${open ? 'is-open bg-brand-blue text-white' : 'bg-brand-paper'}`}
        >
          <span className={`absolute inset-0 grid place-items-center transition-[opacity,transform] duration-300 ${open ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}>
            <MacawAvatar ring className="size-14 transition-transform duration-300 group-hover:scale-105" />
          </span>
          {!open && (
            <span className={`absolute right-0.5 top-0.5 size-3.5 rounded-full border-2 border-brand-paper ${online ? 'bg-brand-green' : 'bg-ochre-600'}`} aria-hidden="true" />
          )}
          <span className={`absolute transition-[opacity,transform] duration-300 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}>
            <CloseIcon className="size-5" />
          </span>
        </button>
      </div>
    </>
  );
};
