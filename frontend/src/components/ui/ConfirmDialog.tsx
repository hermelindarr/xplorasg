// Confirmación de acciones destructivas o irreversibles (eliminar, rechazar).
// Usa <dialog> nativo con showModal(): bloquea el resto de la página, atrapa el foco,
// cierra con Escape y devuelve el foco al botón que lo abrió.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Qué va a pasar, en palabras del usuario. */
  children: ReactNode;
  confirmLabel: string;
  /** destructive: botón en arcilla (eliminar, rechazar). */
  tone?: 'destructive' | 'primary';
  /** Si se pide, la persona debe escribir un motivo (mínimo 5 caracteres) antes de confirmar. */
  reasonLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open, title, children, confirmLabel, tone = 'destructive', reasonLabel, busy = false, error, onConfirm, onCancel,
}: ConfirmDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reasonId = useId();
  const [reason, setReason] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // El motivo se limpia al cerrar, para que el siguiente diálogo empiece vacío.
  const cancel = () => { setReason(''); onCancel(); };
  const needsReason = Boolean(reasonLabel);
  const canConfirm = !busy && (!needsReason || reason.trim().length >= 5);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); if (!busy) cancel(); }}
      onClick={(event) => { if (event.target === ref.current && !busy) cancel(); }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-brand-sand bg-white p-0 text-brand-blue backdrop:bg-brand-night/55"
    >
      <form
        method="dialog"
        onSubmit={(event) => { event.preventDefault(); if (canConfirm) { onConfirm(reason.trim()); setReason(''); } }}
        className="grid gap-4 p-6"
      >
        <h2 id={titleId} className="text-2xl leading-tight text-brand-blue">{title}</h2>
        <div className="text-base leading-7 text-brand-blue/80">{children}</div>
        {needsReason && (
          <label htmlFor={reasonId} className="grid gap-1.5">
            <span className="text-label font-medium text-brand-blue/80">{reasonLabel}</span>
            <textarea
              id={reasonId}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              required
              minLength={5}
              maxLength={1000}
              autoFocus
              className="field resize-y"
            />
          </label>
        )}
        {error && <p role="alert" className="rounded-lg border border-clay-200 bg-clay-50 px-3.5 py-2.5 text-sm text-clay-900">{error}</p>}
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={cancel} disabled={busy} className="btn btn-secondary" autoFocus={!needsReason}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canConfirm}
            className={tone === 'destructive' ? 'btn bg-clay-700 text-white hover:bg-clay-800' : 'btn btn-accent'}
          >
            {busy ? 'Un momento…' : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
};
