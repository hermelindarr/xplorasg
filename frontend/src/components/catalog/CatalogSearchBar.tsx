// Buscador del catálogo (portada y Explorar): una fila con texto, municipio, categoría y "Buscar".
import type { FormEvent, ReactNode } from 'react';
import type { Category, Municipality } from '../../types/catalog';
import { useLanguage } from '../../i18n';
import { categoryLabel } from '../../i18n/common';
import { SearchIcon } from '../brand/icons';

export interface CatalogSearchLabels {
  searchLabel: string;
  searchPlaceholder: string;
  municipality: string;
  allMunicipalities: string;
  category: string;
  allCategoriesLong: string;
  search: string;
  popular: string;
  popularTerms: string[];
}

interface CatalogSearchBarProps {
  title: string;
  labels: CatalogSearchLabels;
  value: string;
  onValueChange: (value: string) => void;
  municipality: string;
  onMunicipalityChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  municipalities: Municipality[];
  categories: Category[];
  onSubmit: (event: FormEvent) => void;
  onQuickSearch: (term: string) => void;
  /** En la portada la tarjeta se monta sobre la foto del hero. */
  overlap?: boolean;
  /** "card": tarjeta grande de la portada. "bar": barra compacta de filtros para Explorar. */
  variant?: 'card' | 'bar';
}

const Chevron = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-brand-blue/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m7 10 5 5 5-5" /></svg>
);

const SelectField = ({ id, label, children, value, onChange }: {
  id: string; label: string; children: ReactNode; value: string; onChange: (value: string) => void;
}) => (
  <div className="relative min-w-0 border-t border-brand-sand lg:w-56 lg:border-l lg:border-t-0">
    <label htmlFor={id} className="pointer-events-none absolute left-5 top-2.5 label-quiet">{label}</label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-16 w-full cursor-pointer appearance-none truncate bg-transparent pb-2 pl-5 pr-10 pt-6 text-sm text-brand-blue outline-none transition-colors duration-300 hover:bg-brand-paper focus-visible:bg-brand-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
    >
      {children}
    </select>
    <Chevron />
  </div>
);

/** Selector de la barra compacta (Explorar): píldora sin etiqueta visible; la etiqueta queda para lectores de pantalla. */
const CompactSelect = ({ id, label, children, value, onChange }: {
  id: string; label: string; children: ReactNode; value: string; onChange: (value: string) => void;
}) => (
  <div className="relative min-w-0 sm:w-52">
    <label htmlFor={id} className="sr-only">{label}</label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full cursor-pointer appearance-none truncate rounded-full border border-brand-blue/15 bg-white pl-4 pr-9 text-sm text-brand-blue outline-none transition-colors duration-300 hover:border-brand-blue/35 focus-visible:border-brand-green"
    >
      {children}
    </select>
    <Chevron />
  </div>
);

export const CatalogSearchBar = ({
  title, labels, value, onValueChange, municipality, onMunicipalityChange, category, onCategoryChange,
  municipalities, categories, onSubmit, onQuickSearch, overlap = true, variant = 'card',
}: CatalogSearchBarProps) => {
  const { lang } = useLanguage();
  if (variant === 'bar') {
    return (
      <section className="mx-auto max-w-7xl px-5 pt-6 lg:px-8" aria-labelledby="home-search">
        <h2 id="home-search" className="sr-only">{title}</h2>
        <form onSubmit={onSubmit} role="search" className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="place-search">{labels.searchLabel}</label>
          <div className="relative min-w-0 flex-1 basis-64">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brand-blue/70" />
            <input
              id="place-search"
              type="search"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder={labels.searchPlaceholder}
              maxLength={120}
              className="h-11 w-full rounded-full border border-brand-blue/15 bg-white pl-10 pr-4 text-sm text-brand-blue outline-none transition-colors duration-300 placeholder:text-brand-blue/70 hover:border-brand-blue/35 focus-visible:border-brand-green"
            />
          </div>
          <CompactSelect id="municipality-filter" label={labels.municipality} value={municipality} onChange={onMunicipalityChange}>
            <option value="">{labels.allMunicipalities}</option>
            {municipalities.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
          </CompactSelect>
          {/* La categoría se elige con las pastillas de la lista (aquí se duplicaba). */}
          <button type="submit" className="btn btn-accent h-11 min-h-0 rounded-full px-5 text-sm">
            {labels.search}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 text-brand-blue/70">{labels.popular}</span>
          {labels.popularTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onQuickSearch(term)}
              className="inline-flex items-center rounded-full px-3 py-1 pointer-coarse:min-h-11 pointer-coarse:px-4 text-brand-blue/80 transition-colors duration-300 hover:bg-brand-light hover:text-brand-green"
            >
              {term}
            </button>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className={`relative z-20 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${overlap ? '-mt-10 lg:-mt-16' : 'mt-6'}`} aria-labelledby="home-search">
      <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_24px_60px_-28px_rgba(31,44,36,.45)] ring-1 ring-brand-blue/5 sm:p-6">
      <h2 id="home-search" className="font-display px-1 text-xl text-brand-blue sm:text-2xl">{title}</h2>
      <form
        onSubmit={onSubmit}
        role="search"
        className="mt-4 flex flex-col border-y border-brand-sand text-brand-blue lg:flex-row lg:items-stretch"
      >
        <label className="sr-only" htmlFor="place-search">{labels.searchLabel}</label>
        <div className="relative min-w-0 lg:flex-1">
          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-brand-blue/70" />
          <input
            id="place-search"
            type="search"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={labels.searchPlaceholder}
            maxLength={120}
            className="h-16 w-full bg-transparent pl-13 pr-3 text-sm sm:pr-4 sm:text-base text-brand-blue outline-none placeholder:text-brand-blue/70 focus-visible:bg-brand-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
          />
        </div>
        <SelectField id="municipality-filter" label={labels.municipality} value={municipality} onChange={onMunicipalityChange}>
          <option value="">{labels.allMunicipalities}</option>
          {municipalities.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
        </SelectField>
        <SelectField id="category-filter" label={labels.category} value={category} onChange={onCategoryChange}>
          <option value="">{labels.allCategoriesLong}</option>
          {categories.map((item) => <option key={item.id} value={item.nombre}>{categoryLabel(item.nombre, lang)}</option>)}
        </SelectField>
        <div className="border-t border-brand-sand py-3 lg:border-t-0 lg:py-2 lg:pl-3">
          <button type="submit" className="btn btn-accent h-12 w-full rounded-xl px-8 transition-transform duration-300 hover:-translate-y-px active:translate-y-0 lg:h-full lg:w-auto">
            {labels.search}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 px-1 text-sm">
        <span className="mr-1 text-brand-blue/70">{labels.popular}</span>
        {labels.popularTerms.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onQuickSearch(term)}
            className="inline-flex items-center rounded-full bg-brand-light px-3.5 py-1.5 pointer-coarse:min-h-11 pointer-coarse:px-4 text-brand-blue/80 transition-[background-color,color,transform] duration-300 hover:-translate-y-px hover:bg-brand-green hover:text-white active:translate-y-0"
          >
            {term}
          </button>
        ))}
      </div>
      </div>
    </section>
  );
};
