// Explorar ("/explorar"): catálogo completo de lugares con búsqueda, filtros y paginación.
// Acepta filtros iniciales en la URL: ?q=…&municipio=…&categoria=…
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { defineMessages, useMessages } from '../i18n';
import { catalogMessages } from '../i18n/catalog';
import { homeMessages } from '../i18n/home';
import { CatalogSearchBar } from '../components/catalog/CatalogSearchBar';
import { PlaceResults } from '../components/catalog/PlaceResults';
import { PageHero } from '../components/ui/PageHero';
import { TextLink } from '../components/ui/TextLink';
import { scrollBehavior } from '../utils/motion';

const messages = defineMessages({
  title: 'Explora la Sierra Gorda',
  titleAccent: 'Sierra Gorda',
  description: 'Catálogo completo de lugares de la Sierra Gorda: busca y filtra por municipio y categoría.',
  eyebrow: 'Explora el territorio',
  text: 'Cascadas, misiones, sótanos y miradores de los seis municipios. Cada lugar indica su altitud: a más metros, más frío y más curvas para llegar.',
  viewOnMap: 'Ver en el mapa',
  statPlaces: 'lugares publicados',
  statMunicipalities: 'municipios',
  placesTitle: 'Lugares para conocer',
}, {
  title: 'Explore the Sierra Gorda',
  titleAccent: 'Sierra Gorda',
  description: 'Full catalog of places in the Sierra Gorda: search and filter by municipality and category.',
  eyebrow: 'Explore the region',
  text: 'Waterfalls, missions, sinkholes and viewpoints across the six municipalities. Each place shows its elevation: the higher it is, the colder it gets and the more curves on the way.',
  viewOnMap: 'View on the map',
  statPlaces: 'published places',
  statMunicipalities: 'municipalities',
  placesTitle: 'Places to visit',
});

const scrollToResults = () => document.getElementById('lugares')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });

export const ExplorePage = () => {
  const m = useMessages(messages);
  const labels = useMessages(catalogMessages);
  const h = useMessages(homeMessages);
  usePageTitle(m.title, m.description);
  const [params] = useSearchParams();
  // Los parámetros de la URL sólo fijan el estado inicial (p. ej. al llegar desde la portada).
  const [initial] = useState(() => ({
    search: params.get('q')?.trim().slice(0, 120) ?? '',
    municipality: params.get('municipio') ?? '',
    category: params.get('categoria') ?? '',
  }));
  const catalog = usePlaceSearch({ initial, onResults: scrollToResults });
  const { municipalities } = catalog;

  return (
    <>
      <PageHero
        compact
        title={m.title}
        subtitle={m.text}
        actions={<TextLink to="/mapa">{m.viewOnMap}</TextLink>}
      />

      <CatalogSearchBar
        title={h.searchTitle}
        labels={labels}
        value={catalog.searchInput}
        onValueChange={catalog.setSearchInput}
        municipality={catalog.municipality}
        onMunicipalityChange={catalog.setMunicipality}
        category={catalog.category}
        onCategoryChange={catalog.setCategory}
        municipalities={municipalities}
        categories={catalog.filterCategories}
        onSubmit={catalog.submitSearch}
        onQuickSearch={catalog.quickSearch}
        overlap={false}
        variant="bar"
      />

      <section id="lugares" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-20 pt-2 lg:px-8 lg:pb-28" aria-labelledby="explore-places">
        <h2 id="explore-places" className="sr-only">{m.placesTitle}</h2>
        <PlaceResults catalog={catalog} />
      </section>
    </>
  );
};
