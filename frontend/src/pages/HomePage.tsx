/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
// Portada ("/"): selección curada del catálogo. La lista completa con filtros vive en Explorar.
import { useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../services/catalogApi';
import type { TourismService } from '../types/catalog';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { useMessages } from '../i18n';
import { catalogMessages } from '../i18n/catalog';
import { homeMessages } from '../i18n/home';
import { CatalogSearchBar } from '../components/catalog/CatalogSearchBar';
import { PlaceResults } from '../components/catalog/PlaceResults';
import { HomeHero } from '../components/home/HomeHero';
import { HomeIntro } from '../components/home/HomeIntro';
import { HomeDestinations } from '../components/home/HomeDestinations';
import { HomeThemes } from '../components/home/HomeThemes';
import { HomeProviders } from '../components/home/HomeProviders';
import { HomeFinalCta } from '../components/home/HomeFinalCta';
import { firstWithPhoto, pickHeroSlides, pickMosaic } from '../components/home/homeData';
import { SectionHeading } from '../components/ui/SectionHeading';
import { TextLink } from '../components/ui/TextLink';

const MOSAIC_SIZE = 9;

// La sección de resultados sólo existe después de buscar: se espera al siguiente cuadro para desplazarse a ella.
const scrollToResults = () => requestAnimationFrame(() => {
  document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/** Enlace a Explorar que conserva la búsqueda y los filtros activos de la portada. */
const exploreLink = (search: string, municipality: string, category: string) => {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (municipality) params.set('municipio', municipality);
  if (category) params.set('categoria', category);
  const query = params.toString();
  return query ? `/explorar?${query}` : '/explorar';
};

export const HomePage = () => {
  const m = useMessages(homeMessages);
  const labels = useMessages(catalogMessages);
  usePageTitle(m.pageTitle, m.pageDescription);
  const catalog = usePlaceSearch({ onResults: scrollToResults });
  const { places, catalogSample, search, municipality, category } = catalog;

  // Prestadores (una sola vez)
  const [services, setServices] = useState<TourismService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .services({ limit: 50 }, controller.signal)
      .then((response) => setServices(response.data))
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setServicesLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Las secciones curadas usan la muestra sin filtros; así no cambian al buscar.
  const pool = catalogSample.length ? catalogSample : places;
  const heroSlides = useMemo(() => pickHeroSlides(pool), [pool]);
  const mosaicPlaces = useMemo(() => pickMosaic(pool, heroSlides, MOSAIC_SIZE), [pool, heroSlides]);
  const finalPlace = useMemo(
    () => firstWithPhoto(pool, () => true, new Set(), ['presa-jalpan', 'las-adjuntas', 'neblinas']) ?? pool[0] ?? null,
    [pool],
  );

  return (
    <>
      <HomeHero slides={heroSlides} />

      <CatalogSearchBar
        title={m.searchTitle}
        labels={labels}
        value={catalog.searchInput}
        onValueChange={catalog.setSearchInput}
        municipality={municipality}
        onMunicipalityChange={catalog.setMunicipality}
        category={category}
        onCategoryChange={catalog.setCategory}
        municipalities={catalog.municipalities}
        categories={catalog.filterCategories}
        onSubmit={catalog.submitSearch}
        onQuickSearch={catalog.quickSearch}
      />

      <HomeIntro />
      <HomeDestinations places={mosaicPlaces} />
      <HomeThemes
        places={pool}
        services={services}
        categories={catalog.categories}
        presentCategories={catalog.presentCategories}
        activeCategory={category}
        onSelectCategory={catalog.toggleCategory}
      />

      {/* La lista de lugares sólo aparece al buscar o filtrar. */}
      {catalog.filtersActive && (
        <section id="lugares" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="home-places">
          <SectionHeading
            id="home-places"
            eyebrow={m.placesEyebrow}
            title={m.resultsHeading}
            action={<TextLink to={exploreLink(search, municipality, category)}>{m.viewAllPlaces}</TextLink>}
          />
          <PlaceResults catalog={catalog} />
        </section>
      )}

      <HomeProviders services={services} loading={servicesLoading} />
      <HomeFinalCta photo={finalPlace?.imagenPrincipal?.url ?? null} name={finalPlace?.nombre} />
    </>
  );
};
