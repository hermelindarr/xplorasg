// Chatboot: retrato de la guacamaya verde (Ara militaris), ave emblemática del Sótano del Barro.
// Ilustración propia pensada para leerse bien desde 32 px: cabeza grande, frente roja,
// cara clara con el ojo dorado y el pico negro curvo. Se recorta dentro de un círculo.

/** Avatar circular de Chatboot. `ring` añade el borde verde de la marca (botón flotante). */
export const MacawAvatar = ({ className = 'size-10', ring = false, title }: { className?: string; ring?: boolean; title?: string }) => (
  <span
    className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-brand-light ${ring ? 'ring-2 ring-brand-green ring-offset-2 ring-offset-brand-paper' : 'border border-brand-sand'} ${className}`}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" fill="none" aria-hidden="true">
      <g transform="translate(-1.5 1.5)">
        <path d="M6 64c1-12 7-20 16-23l14 2c8 3 13 11 14 21z" fill="#2F7A55" />
        <path d="M10 64c2-8 6-13 11-15l3 15z" fill="#2A6F9E" />
        <path d="M40 64c-1-7-3-12-7-15l9 3c4 3 6 7 7 12z" fill="#2A6F9E" />
        <path d="M15 40c-4-13 2-27 15-30 10-2 19 3 21 12 2 8-2 15-8 19-9 5-22 5-28-1z" fill="#3D9A5F" />
        <path d="M15 40c-2-7-1-14 3-19 1 9 6 16 14 20-6 2-13 2-17-1z" fill="#2F7A55" />
        <path d="M33 10.5c5-1.2 10 .3 13.5 3.8-3 1.4-7.5 1.2-11-.6-1.2-.8-2-1.8-2.5-3.2z" fill="#D9432F" />
        <path d="M34 17c5-2.2 11-.8 13.6 3.6 1.6 2.8.8 6.4-1.8 8.2-4 2.6-10.2 1.2-12.4-3-1.4-2.8-1-6.6.6-8.8z" fill="#F6EFE6" />
        <path d="M35.5 25.5c2.2.6 4.4.6 6.4-.2M36.4 28c1.8.5 3.6.4 5.2-.2" stroke="#1F2C24" strokeOpacity=".35" strokeWidth=".9" strokeLinecap="round" />
        <circle cx="40.6" cy="20.8" r="3.1" fill="#E9B949" />
        <circle cx="40.6" cy="20.8" r="2" fill="#1F2C24" />
        <circle cx="41.3" cy="20.1" r=".7" fill="#fff" />
        <path d="M46.5 17.5c6-1.6 11 2.4 11 9 0 4-1.8 7.6-4.6 9.6.6-3.6-.4-6.6-3-8.2l-3.8 1.2c-.6-4.4-.4-8.4.4-11.6z" fill="#1F2C24" />
        <path d="M46.6 29.2c2.4-.6 4.6.2 5.6 2.2-1.6 1.6-4 2-5.8 1-.6-1-.6-2.2.2-3.2z" fill="#3A4A40" />
        <path d="M50 19.6c2.4.2 4.2 1.8 4.8 4" stroke="#fff" strokeOpacity=".25" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  </span>
);
