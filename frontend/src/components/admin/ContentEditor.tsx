// Edición directa de una ficha por el administrador. Los cambios se aplican de inmediato
// (el administrador es quien valida); no cambia el estado de publicación.
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ApiError, errorMessage } from '../../services/authorizedFetch';
import { EDITABLE_FIELDS, FIELD_LABELS, LONG_FIELDS, moderationApi, type EditableContent } from '../../services/moderationApi';

interface ContentEditorProps {
  token: string;
  target: { kind: 'servicio' | 'lugar'; id: number; nombre: string } | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export const ContentEditor = ({ token, target, onClose, onSaved }: ContentEditorProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [content, setContent] = useState<EditableContent | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [image, setImage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  useEffect(() => {
    if (!target) return undefined;
    let active = true;
    moderationApi.content(token, target.kind, target.id)
      .then((response) => {
        if (!active) return;
        setContent(response.data);
        setDraft(Object.fromEntries(EDITABLE_FIELDS[target.kind].map((key) => [key, response.data[key] ?? ''])));
      })
      .catch((error) => { if (active) setLoadError(errorMessage(error, 'No fue posible cargar la ficha.')); });
    return () => { active = false; };
  }, [target, token]);

  const close = () => {
    if (saving) return;
    setContent(null);
    setDraft({});
    setImage('');
    setErrors({});
    setLoadError('');
    setSaveError('');
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!target || !content) return;
    const changes: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(draft)) {
      if ((content[key] ?? '') !== value) changes[key] = value.trim() || null;
    }
    if (image.trim()) changes.imagen_url = image.trim();
    if (!Object.keys(changes).length) {
      setSaveError('No hay cambios para guardar.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setErrors({});
    try {
      await moderationApi.update(token, target.kind, target.id, changes);
      setSaving(false);
      const name = (changes.nombre as string | undefined) ?? target.nombre;
      setContent(null);
      setDraft({});
      setImage('');
      onSaved(`Se guardaron los cambios de “${name}”.`);
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields);
      setSaveError(errorMessage(error, 'No fue posible guardar.'));
      setSaving(false);
    }
  };

  const fields = target ? EDITABLE_FIELDS[target.kind] : [];

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); close(); }}
      className="m-auto max-h-[calc(100svh-2rem)] w-[min(48rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-brand-sand bg-white p-0 text-brand-blue backdrop:bg-brand-night/55"
    >
      <form onSubmit={submit} noValidate className="flex max-h-[calc(100svh-2rem)] flex-col">
        <header className="border-b border-brand-sand px-6 py-4">
          <h2 id={titleId} className="text-2xl leading-tight">Editar {target?.kind === 'lugar' ? 'lugar' : 'servicio'}</h2>
          <p className="mt-1 text-label text-brand-blue/70">Los cambios se aplican de inmediato. El estado de publicación no cambia.</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loadError && <p role="alert" className="rounded-lg border border-clay-200 bg-clay-50 px-3.5 py-2.5 text-sm text-clay-900">{loadError}</p>}
          {!content && !loadError && <div className="h-64 animate-pulse rounded-lg bg-brand-sand/50" aria-busy="true" />}
          {content && (
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((key) => {
                const long = LONG_FIELDS.has(key);
                const id = `edit-${key}`;
                const common = {
                  id,
                  value: draft[key] ?? '',
                  'aria-invalid': Boolean(errors[key]),
                  'aria-describedby': `${id}-error`,
                  className: `field mt-1.5 ${long ? 'resize-y' : ''}`,
                };
                return (
                  <label key={key} htmlFor={id} className={long ? 'md:col-span-2' : ''}>
                    <span className="block text-label font-medium text-brand-blue/80">{FIELD_LABELS[key] ?? key}</span>
                    {long
                      ? <textarea rows={key === 'descripcion' ? 5 : 3} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} {...common} />
                      : <input onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} {...common} />}
                    {key === 'fuente_verificacion' && <span className="mt-1 block text-xs text-brand-blue/70">Obligatoria para publicar: de dónde se verificó la información.</span>}
                    {errors[key] && <span id={`${id}-error`} className="mt-1 block text-label text-clay-800">{errors[key]}</span>}
                  </label>
                );
              })}
              {target?.kind === 'servicio' && (
                <label htmlFor="edit-imagen" className="md:col-span-2">
                  <span className="block text-label font-medium text-brand-blue/80">Agregar foto principal (enlace https)</span>
                  <input id="edit-imagen" type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://…/foto.jpg" className="field mt-1.5" />
                  <span className="mt-1 block text-xs text-brand-blue/70">Se agrega como foto principal y cuenta como multimedia pública para publicar.</span>
                  {errors.imagen_url && <span className="mt-1 block text-label text-clay-800">{errors.imagen_url}</span>}
                </label>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-sand bg-brand-paper/60 px-6 py-3.5">
          {saveError && <p role="alert" className="mr-auto text-sm text-clay-800">{saveError}</p>}
          <button type="button" onClick={close} disabled={saving} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving || !content} className="btn btn-primary">{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </footer>
      </form>
    </dialog>
  );
};
