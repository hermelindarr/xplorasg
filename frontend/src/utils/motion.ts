// Desplazamientos hechos desde JavaScript (scrollTo / scrollIntoView). La regla CSS de "reducir movimiento"
// no alcanza a `behavior: 'smooth'` cuando se pide desde código, así que se decide aquí en cada llamada.
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 'smooth' normalmente; 'auto' (salto directo) si la persona pidió reducir el movimiento. */
export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');
