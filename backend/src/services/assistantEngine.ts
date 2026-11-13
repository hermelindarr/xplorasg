// Motor semántico local del asistente XploraSG.
// Se usa cuando no hay un proveedor de IA configurado (o si falla). Detecta la intención de la
// pregunta, cruza el clima real (Open-Meteo) con el catálogo verificado y redacta una respuesta
// conversacional. Nunca inventa lugares: todo sale de los registros publicados que recibe.

import { normalizeForSearch, type AssistantReference } from './assistantService';

export type Intent =
  | 'saludo' | 'gracias' | 'clima' | 'hospedaje' | 'comida' | 'misiones' | 'naturaleza'
  | 'aventura' | 'cultura' | 'eventos' | 'cerca' | 'ruta' | 'itinerario' | 'ayuda' | 'senal'
  | 'nadar' | 'mascotas' | 'acampar' | 'alcohol';

export interface EnginePlace {
  tipo: 'lugar' | 'servicio' | 'actividad';
  id: number;
  nombre: string;
  slug: string | null;
  municipio: string;
  categoria: string | null;
  descripcion: string | null;
  actividades: string | null;
  horarios: string | null;
  contacto: string | null;
  precio: string | null;
  /** Cómo llegar (sólo lugares). Se usa para avisar de tramos de terracería. */
  acceso?: string | null;
  /** Recomendaciones y reglas del lugar (p. ej. "prohibido nadar"). Se usan para advertir. */
  recomendaciones?: string | null;
  latitud: number | null;
  longitud: number | null;
  /** Textos traducidos para mostrar (si el idioma no es español). */
  traducciones?: Record<string, Record<string, unknown>> | null;
}

export interface EngineWeather {
  municipio: string;
  temperatura: number | null;
  condicion: string;
  codigo: number;
  maxima: number | null;
  minima: number | null;
  probabilidadLluvia: number | null;
}

export interface EngineEvent {
  titulo: string;
  fecha_inicio: string;
  lugar_nombre: string | null;
  municipio: string | null;
}

export interface EngineInput {
  question: string;
  items: EnginePlace[];
  municipalities: string[];
  weather: EngineWeather | null;
  events: EngineEvent[];
  origin: { latitud: number; longitud: number } | null;
  firstMessage: boolean;
  now?: Date;
  lang?: 'es' | 'en';
}

export interface EngineOutput {
  /** Respuesta completa (incluye la lista de lugares); es el borrador que recibe el proveedor de IA. */
  respuesta: string;
  /** Versión para la interfaz: sin la lista, porque cada lugar se muestra como tarjeta con sus acciones. */
  texto: string;
  referencias: AssistantReference[];
  sugerencias: string[];
  intenciones: Intent[];
  municipio: string | null;
}

// Cada intención reconoce palabras en español y en inglés.
const INTENT_PATTERNS: Array<[Intent, RegExp]> = [
  ['saludo', /^(hola|buen[oa]s|que tal|hey|saludos|buen dia|hi|hello|good (morning|afternoon|evening))\b/],
  ['gracias', /\b(gracias|muchas gracias|te agradezco|thanks|thank you|thx)\b/],
  ['clima', /\b(clima|lluv\w*|llover|calor|frio|temperatura|pronostico|tiempo hace|nublado|soleado|weather|rain\w*|hot|cold|temperature|forecast|cloudy|sunny)\b/],
  ['hospedaje', /\b(hosped\w*|hotel\w*|caban\w*|dormir|quedarme|quedarnos|alojamiento|acampar|campamento|camping|hostal|cabin\w*|lodg\w*|sleep|stay|accommodation\w*|hostel|camp)\b/],
  ['comida', /\b(comer|comida|restaur\w*|gastronom\w*|desayun\w*|cenar|antojitos|fonda\w*|platillo\w*|zacahuil|enchiladas|eat|food|breakfast|lunch|dinner|dish\w*|cuisine)\b/],
  ['misiones', /\b(mision\w*|iglesia\w*|templo\w*|patrimonio|unesco|junipero|franciscan\w*|barroco|missions?|church\w*|heritage|baroque)\b/],
  ['naturaleza', /\b(cascada\w*|rio\w*|poza\w*|nadar|naturaleza|bosque\w*|mirador\w*|gruta\w*|sotano|canon|presa|balneario|paisaje\w*|aves|waterfall\w*|rivers?|swim\w*|nature|forest\w*|viewpoint\w*|caves?|canyon\w*|birds?|landscape\w*)\b/],
  ['aventura', /\b(aventura|rapel|tirolesa|cuatrimoto\w*|senderismo|caminata\w*|kayak|escalar|extremo|adventure\w*|rappel\w*|zip ?line\w*|atv|hik\w*|trek\w*|climb\w*)\b/],
  ['cultura', /\b(arqueolog\w*|cultura\w*|rupestre|museo\w*|artesan\w*|historia|tradicion\w*|archaeolog\w*|culture|cultural|museum\w*|craft\w*|history|tradition\w*)\b/],
  ['eventos', /\b(evento\w*|fiesta\w*|festival\w*|huapango|agenda|feria\w*|muertos|celebracion\w*|events?|fair\w*|celebration\w*|day of the dead)\b/],
  ['cerca', /\b(cerca|cercan\w*|proxim\w*|alrededor|near\w*|close by|around me)\b/],
  ['ruta', /\b(como llego|como llegar|llegar|ruta (a|al|hacia)|route to|distancia|carretera|manejar|how (do|can) i get|directions?|distance|drive|driving)\b/],
  ['itinerario', /\b(itinerario|fin de semana|plan\w*|recorrido|dias|ruta de|ruta para hoy|para hoy|itinerary|weekend|trip|days|route for today|today'?s route)\b/],
  ['senal', /\b(sin senal|senal|cobertura|sin internet|sin datos|no signal|signal|coverage|offline)\b/],
  // Actividades que algunos lugares prohíben: se revisan contra sus recomendaciones.
  ['nadar', /\b(nadar|nado|banar\w*|banarse|banarnos|meterse al agua|meternos al agua|alberca\w*|swim\w*|bathe|bathing)\b/],
  ['mascotas', /\b(mascota\w*|perr[oi]\w*|lomito\w*|pets?|dogs?)\b/],
  ['acampar', /\b(acampar|acampo|casa de campana|camping|camp)\b/],
  ['alcohol', /\b(alcohol\w*|cervez\w*|chela\w*|bebidas alcoholicas|beer|alcohol|drinks?)\b/],
  ['ayuda', /\b(que puedes hacer|ayuda|como funcionas|quien eres|what can you do|help|who are you)\b/],
];

export const detectIntents = (question: string): Intent[] => {
  const text = normalizeForSearch(question);
  return INTENT_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([intent]) => intent);
};

export const detectMunicipality = (question: string, municipalities: string[]): string | null => {
  const text = normalizeForSearch(question);
  const aliases: Record<string, string> = { jalpan: 'Jalpan de Serra', landa: 'Landa de Matamoros', pinal: 'Pinal de Amoles', conca: 'Arroyo Seco' };
  const direct = municipalities.find((name) => text.includes(normalizeForSearch(name)));
  if (direct) return direct;
  const alias = Object.entries(aliases).find(([key]) => new RegExp(`\\b${key}\\b`).test(text));
  return alias && municipalities.includes(alias[1]) ? alias[1] : null;
};

const isClosed = (item: EnginePlace) => /\bcerrad[oa]\b/i.test(item.horarios ?? '');

// Palabras que no indican un tema (se ignoran al decidir si la pregunta tiene respuesta en las fichas).
const STOPWORDS = new Set(('cuanto cuanta cuantos cuesta cuestan como donde para quiero queremos puedo podemos tiene tienen '
  + 'esta estan desde hasta cual cuales mejor mejores algo sobre llegar hacer visitar conocer recomiendas recomienda '
  + 'queretaro sierra gorda lugar lugares favor gracias porfa saber dime decir necesito busco buscar '
  + 'hago hacemos visito ver voy vamos andar pasear paseo recomiendan conviene vale pena existe existen '
  + 'algun alguna algunos algunas buen buena bueno buenos muy mucho aqui alla hablame cuentame platicame informacion '
  // Gustos y público: piden una recomendación general, no un dato que falte.
  + 'bonito bonita bonitos bonitas lindo lindos padre padres chido chidos hermoso hermosos increible imperdible imperdibles '
  + 'familia familiar familiares ninos nino ninas pareja parejas amigos tranquilo tranquilos barato baratos economico economicos '
  + 'romantico divertido divertidos interesante interesantes famoso famosos popular populares recomendado recomendados '
  + 'kids family nice beautiful cheap quiet fun popular famous '
  + 'what where when which does have from with about there want need know tell best place places').split(' '));

type RuleIntent = 'nadar' | 'mascotas' | 'acampar' | 'alcohol';
const RULE_INTENTS: RuleIntent[] = ['nadar', 'mascotas', 'acampar', 'alcohol'];

// Frases de las fichas que prohíben cada actividad (texto ya normalizado, sin acentos).
const PROHIBITION_PATTERNS: Record<RuleIntent, RegExp> = {
  nadar: /(prohibido|prohibe|no se permite|no esta permitido|no permitido|evita|no)\s+(\w+\s+){0,2}(nadar|banarse|el nado|meterse al agua)/,
  mascotas: /(prohibido|prohibe|no se permite|no se permiten|no introducir|no)\s+(\w+\s+){0,6}mascotas/,
  acampar: /(prohibido|prohibe|no se permite|no esta permitido)\s+(\w+\s+){0,2}acampar/,
  alcohol: /(prohibido|prohibe|no se permite|no se permiten|no introducir|no)\s+(\w+\s+){0,3}(bebidas alcoholicas|alcohol)/,
};

/** Actividades que la ficha del lugar prohíbe expresamente. */
export const prohibitedActivities = (item: Pick<EnginePlace, 'recomendaciones' | 'acceso' | 'actividades'>): RuleIntent[] => {
  const text = normalizeForSearch(`${item.recomendaciones ?? ''} ${item.acceso ?? ''}`);
  if (!text.trim()) return [];
  return RULE_INTENTS.filter((rule) => PROHIBITION_PATTERNS[rule].test(text));
};

/** Lugares donde la ficha sí menciona nadar o pozas y no lo prohíbe. */
const allowsSwimming = (item: EnginePlace) => item.tipo === 'lugar'
  && /natacion|nadar|alberca|balneario|poza|banarse|acuatic/.test(normalizeForSearch(`${item.nombre} ${item.actividades ?? ''} ${item.descripcion ?? ''}`))
  && !prohibitedActivities(item).includes('nadar');

const distanceKm = (a: { latitud: number; longitud: number }, b: { latitud: number; longitud: number }) => {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

type WeatherMood = 'lluvia' | 'calor' | 'frio' | 'nublado' | 'despejado';

export const weatherMood = (weather: EngineWeather | null): WeatherMood | null => {
  if (!weather) return null;
  const rainCode = weather.codigo >= 51;
  if (rainCode || (weather.probabilidadLluvia ?? 0) >= 60) return 'lluvia';
  const temp = weather.temperatura ?? weather.maxima;
  if (temp !== null && temp >= 30) return 'calor';
  if (temp !== null && temp <= 12) return 'frio';
  if (weather.codigo >= 2 && weather.codigo <= 48) return 'nublado';
  return 'despejado';
};

const WATER = /cascada|rio|río|poza|presa|balneario|cañon|canon|adjuntas/i;
const INDOOR = /misi[oó]n|gruta|museo|artesan|arqueol/i;
const VIEW = /mirador|cuatro palos|cristal/i;

/** Ordena los lugares según su afinidad con el clima actual. */
const weatherScore = (item: EnginePlace, mood: WeatherMood | null): number => {
  if (!mood) return 0;
  const text = `${item.nombre} ${item.categoria ?? ''} ${item.actividades ?? ''}`;
  switch (mood) {
    case 'lluvia': return INDOOR.test(text) ? 4 : WATER.test(text) ? -6 : VIEW.test(text) ? -2 : 0;
    case 'calor': return WATER.test(text) ? 4 : VIEW.test(text) ? -1 : 0;
    case 'frio': return INDOOR.test(text) ? 2 : WATER.test(text) ? -2 : 0;
    case 'nublado': return INDOOR.test(text) ? 1 : 0;
    case 'despejado': return VIEW.test(text) ? 3 : WATER.test(text) ? 2 : 0;
  }
};

const short = (value: string | null, length = 140) => {
  if (!value) return '';
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > length ? `${compact.slice(0, length - 1).trim()}…` : compact;
};

const pick = <T,>(options: T[], seed: string): T => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
};

type Lang = 'es' | 'en';

// Textos del asistente en cada idioma. Los nombres propios (lugares, municipios) no se traducen.
const T = {
  es: {
    locale: 'es-MX',
    greeting: (h: number) => (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'),
    intro: 'Soy Chatboot, la guía de XploraSG. Te oriento con las fichas verificadas de la Sierra Gorda y el clima del día.',
    thanks: ['Con gusto. Buen camino por la Sierra.', 'Para eso estoy. Si cambia el plan, aquí sigo.', 'Gracias a ti. Viaja con calma y deja los senderos como los encontraste.'],
    thanksSuggestions: ['Ruta para hoy', 'Fiestas próximas'],
    help: 'Puedo armarte una ruta según el clima de hoy, decirte dónde dormir y comer, contarte de las misiones franciscanas y avisarte de las fiestas que vienen. Todo sale de las fichas verificadas; si algo no está ahí, te lo digo.',
    helpSuggestions: ['Ruta para hoy', 'Comida cercana', 'Lugares sin señal', 'Fiestas próximas'],
    weather: (where: string, temp: string, condition: string, range: string, rain: string) => `Ahora en ${where}: ${temp}${condition.toLowerCase()}${range}${rain}.`,
    tempPart: (t: number) => `${t} °C, `,
    rangePart: (min: number, max: number) => ` (hoy de ${min} a ${max} °C)`,
    rainPart: (p: number) => `, ${p}% de probabilidad de lluvia`,
    advice: {
      lluvia: 'Con lluvia, mejor misiones y planes bajo techo. Evita ríos, cañones y cascadas: las crecidas llegan rápido.',
      calor: 'Hace calor: buen día para pozas y balnearios. Lleva agua, sombrero y bloqueador biodegradable.',
      frio: 'Está fresco. Si vas a un mirador temprano, lleva abrigo.',
      nublado: 'Está nublado: los miradores pueden verse cerrados; las misiones y los pueblos son buena opción.',
      despejado: 'Cielo despejado: día para miradores, senderos y fotografía.',
    } as Record<WeatherMood, string>,
    noWeather: 'No pude consultar el clima. Revisa el pronóstico antes de salir, sobre todo si vas a ríos o cascadas.',
    closed: (names: string, detail: string) => `Aviso: ${names} está cerrado temporalmente (${detail}).`,
    eventsIntro: (list: string) => `Próximas fiestas en la agenda:\n${list}\n\nLas fechas pueden moverse; confírmalas con turismo municipal.`,
    eventAt: (place: string) => ` en ${place}`,
    noEvents: 'No hay fiestas próximas publicadas en la agenda. Vuelve a revisar la sección Agenda en unos días.',
    scopeIn: (m: string) => ` en ${m}`,
    scopeDefault: ' en la Sierra Gorda',
    introLodging: (scope: string) => `Para dormir${scope}:`,
    introFood: (scope: string) => `Para comer cocina serrana${scope}:`,
    introMissions: 'Las misiones franciscanas son Patrimonio Mundial de la UNESCO. Estas son las que están en las fichas:',
    introNearby: 'Lo más cerca de ti:',
    introItinerary: (scope: string) => `Ruta propuesta${scope}, en este orden:`,
    introWeather: (scope: string) => `Con este clima, te propongo${scope}:`,
    introDefault: (scope: string) => `Te propongo${scope}:`,
    away: (km: string) => ` · a ${km} km`,
    activities: 'Qué hacer',
    price: 'Precio',
    contact: 'Contacto',
    noMatchIn: (m: string) => `No encontré fichas publicadas que coincidan en ${m}. Prueba con misiones, cascadas, hospedaje o comida.`,
    noMatch: 'No tengo fichas que respondan eso, y prefiero no inventar. Prueba con un municipio (Jalpan, Landa, Pinal de Amoles, San Joaquín, Arroyo Seco o Peñamiller) o con un tipo de plan.',
    route: 'Para llegar: toca “Ver en mapa” en el lugar y luego “Preparar ruta”. También puedes abrir la ruta en Google Maps.',
    book: 'Para reservar, usa “Contactar” en el servicio o abre su ficha.',
    nearNoOrigin: 'Si activas “Usar mi ubicación”, te los ordeno por distancia.',
    signal: 'No tengo datos verificados de cobertura celular por lugar, así que no te doy una lista inventada. Para tramos sin señal: abre y guarda en Favoritos las fichas antes de salir (las que ya consultaste se pueden ver sin conexión), descarga el mapa de la zona en tu teléfono y avisa a alguien tu ruta.',
    signalList: 'Según su ficha, a estos lugares se llega por terracería; ve preparado:',
    tips: [
      'Abre cada ficha para ver horarios y costos antes de salir.',
      'En cada ficha están el acceso, los horarios y las recomendaciones de conservación.',
      'Confirma horarios en la ficha y lleva efectivo: en varias comunidades no hay terminal.',
    ],
    sWeather: 'Ruta para hoy',
    sLodging: (m: string | null) => `¿Dónde dormir${m ? ` en ${m}` : ''}?`,
    sFood: 'Comida cercana',
    sEvents: 'Fiestas próximas',
    sMissions: 'Las misiones',
    ruleNames: { nadar: 'nadar', mascotas: 'llevar mascotas', acampar: 'acampar', alcohol: 'llevar bebidas alcohólicas' } as Record<RuleIntent, string>,
    prohibited: (name: string, what: string, detail: string) => (detail ? `Importante, sobre ${name}: ${detail}` : `Importante: en ${name} está prohibido ${what}.`),
    introSwim: (scope: string) => `Lugares${scope} donde la ficha sí menciona nado o pozas (revisa siempre el nivel del agua):`,
    noSwim: 'No encontré lugares publicados donde la ficha permita nadar. Prefiero no sugerirte uno al azar.',
    partialData: (topic: string) => `Las fichas no mencionan “${topic}”. Te muestro las opciones que sí tengo; confírmalo directamente con el prestador.`,
    noData: (topic: string) => `No tengo ese dato: las fichas de XploraSG no dicen nada sobre “${topic}”, y prefiero no inventarlo. Puedo ayudarte con lugares, hospedaje, comida, fiestas y el clima.`,
    sSwim: '¿Dónde puedo nadar?',
  },
  en: {
    locale: 'en-US',
    greeting: (h: number) => (h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'),
    intro: "I'm Chatboot, the XploraSG guide. I point you in the right direction using verified Sierra Gorda listings and today's weather.",
    thanks: ['My pleasure. Enjoy the Sierra.', 'Anytime. If plans change, I’m here.', 'Thank you. Travel slowly and leave the trails as you found them.'],
    thanksSuggestions: ['Route for today', 'Upcoming festivals'],
    help: 'I can put together a route for today’s weather, tell you where to sleep and eat, walk you through the Franciscan missions and flag upcoming festivals. Everything comes from verified listings; if something isn’t there, I’ll say so.',
    helpSuggestions: ['Route for today', 'Food nearby', 'Places with no signal', 'Upcoming festivals'],
    weather: (where: string, temp: string, condition: string, range: string, rain: string) => `Right now in ${where}: ${temp}${condition.toLowerCase()}${range}${rain}.`,
    tempPart: (t: number) => `${t} °C, `,
    rangePart: (min: number, max: number) => ` (${min} to ${max} °C today)`,
    rainPart: (p: number) => `, ${p}% chance of rain`,
    advice: {
      lluvia: 'With rain, go for the missions and indoor plans. Stay away from rivers, canyons and waterfalls: flash floods come fast.',
      calor: 'It’s hot: a good day for natural pools and swimming spots. Bring water, a hat and biodegradable sunscreen.',
      frio: 'It’s chilly. If you’re heading to a viewpoint early, bring a jacket.',
      nublado: 'It’s cloudy: viewpoints may be fogged in; the missions and towns are a good option.',
      despejado: 'Clear skies: a day for viewpoints, trails and photography.',
    } as Record<WeatherMood, string>,
    noWeather: 'I couldn’t check the weather. Look at the forecast before heading out, especially for rivers or waterfalls.',
    closed: (names: string, detail: string) => `Note: ${names} is temporarily closed (${detail}).`,
    eventsIntro: (list: string) => `Upcoming festivals on the calendar:\n${list}\n\nDates can shift; confirm with the municipal tourism office.`,
    eventAt: (place: string) => ` at ${place}`,
    noEvents: 'There are no upcoming festivals published on the calendar. Check the Events section again in a few days.',
    scopeIn: (m: string) => ` in ${m}`,
    scopeDefault: ' in the Sierra Gorda',
    introLodging: (scope: string) => `Places to stay${scope}:`,
    introFood: (scope: string) => `For local mountain cooking${scope}:`,
    introMissions: 'The Franciscan missions are a UNESCO World Heritage Site. These are the ones in our listings:',
    introNearby: 'Closest to you:',
    introItinerary: (scope: string) => `Suggested route${scope}, in this order:`,
    introWeather: (scope: string) => `With this weather, I’d suggest${scope}:`,
    introDefault: (scope: string) => `I’d suggest${scope}:`,
    away: (km: string) => ` · ${km} km away`,
    activities: 'What to do',
    price: 'Price',
    contact: 'Contact',
    noMatchIn: (m: string) => `I couldn’t find published listings that match in ${m}. Try missions, waterfalls, lodging or food.`,
    noMatch: 'I don’t have listings that answer that, and I’d rather not make things up. Try a municipality (Jalpan, Landa, Pinal de Amoles, San Joaquín, Arroyo Seco or Peñamiller) or a type of plan.',
    route: 'To get there: tap “View on map” on the place, then “Plan route”. You can also open the route in Google Maps.',
    book: 'To book, use “Contact” on the service or open its listing.',
    nearNoOrigin: 'Turn on “Use my location” and I’ll sort them by distance.',
    signal: 'I don’t have verified cell-coverage data per place, so I won’t give you a made-up list. For stretches with no signal: open and save listings to Favorites before you leave (the ones you’ve already opened work offline), download the area map on your phone and tell someone your route.',
    signalList: 'According to their listings, these places are reached by dirt road; go prepared:',
    tips: [
      'Open each listing to check hours and prices before you go.',
      'Each listing has access notes, opening hours and conservation tips.',
      'Confirm hours on the listing and bring cash: many communities have no card terminal.',
    ],
    sWeather: 'Route for today',
    sLodging: (m: string | null) => `Where to stay${m ? ` in ${m}` : ''}?`,
    sFood: 'Food nearby',
    sEvents: 'Upcoming festivals',
    sMissions: 'The missions',
    ruleNames: { nadar: 'swimming', mascotas: 'bringing pets', acampar: 'camping', alcohol: 'bringing alcohol' } as Record<RuleIntent, string>,
    prohibited: (name: string, what: string, detail: string) => (detail ? `Important, about ${name}: ${detail}` : `Important: ${what} is not allowed at ${name}.`),
    introSwim: (scope: string) => `Places${scope} whose listing mentions swimming or natural pools (always check the water level):`,
    noSwim: 'I couldn’t find published places whose listing allows swimming, so I won’t suggest one at random.',
    partialData: (topic: string) => `The listings don’t mention “${topic}”. Here are the options I do have; please confirm it directly with the business.`,
    noData: (topic: string) => `I don’t have that information: XploraSG listings say nothing about “${topic}”, and I’d rather not make it up. I can help with places, lodging, food, festivals and the weather.`,
    sSwim: 'Where can I swim?',
  },
};

const hourIn = (now: Date) => Number(new Intl.DateTimeFormat('es-MX', { hour: 'numeric', hour12: false, timeZone: 'America/Mexico_City' }).format(now));

/** Texto para mostrar de un registro: traducido si existe, si no, el original. */
const show = (item: EnginePlace, field: 'descripcion' | 'actividades' | 'horarios' | 'precio' | 'contacto' | 'recomendaciones', lang: Lang): string | null => {
  if (lang !== 'es') {
    const tr = item.traducciones?.[lang];
    const value = tr?.[field];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return item[field] ?? null;
};

const weatherSentence = (weather: EngineWeather, mood: WeatherMood | null, lang: Lang) => {
  const t = T[lang];
  const temp = weather.temperatura === null ? '' : t.tempPart(Math.round(weather.temperatura));
  const range = weather.maxima !== null && weather.minima !== null ? t.rangePart(Math.round(weather.minima), Math.round(weather.maxima)) : '';
  const rain = weather.probabilidadLluvia !== null ? t.rainPart(weather.probabilidadLluvia) : '';
  return `${t.weather(weather.municipio, temp, weather.condicion, range, rain)} ${mood ? t.advice[mood] : ''}`.trim();
};

const typeFilters: Partial<Record<Intent, (item: EnginePlace) => boolean>> = {
  hospedaje: (item) => item.tipo === 'servicio' && /hosped|hotel|cabañ|caban|camp|villa/i.test(`${item.categoria} ${item.nombre} ${item.descripcion}`),
  comida: (item) => item.tipo === 'servicio' && /aliment|restaur|comida|fonda|gastronom|comedor/i.test(`${item.categoria} ${item.nombre} ${item.descripcion}`),
  misiones: (item) => item.tipo === 'lugar' && /misi[oó]n/i.test(item.nombre),
  naturaleza: (item) => item.tipo === 'lugar' && /naturaleza/i.test(item.categoria ?? ''),
  aventura: (item) => /aventura|sender|cañon|canon|rapel|cuatrimoto|tour|guía|guia/i.test(`${item.categoria} ${item.actividades} ${item.nombre} ${item.descripcion}`),
  cultura: (item) => item.tipo === 'lugar' && /cultura|arqueolog/i.test(item.categoria ?? ''),
  nadar: allowsSwimming,
};

const toReference = (item: EnginePlace, origin: EngineInput['origin'], lang: Lang): AssistantReference => ({
  tipo: item.tipo,
  id: item.id,
  nombre: item.nombre,
  slug: item.slug,
  municipio: item.municipio,
  resumen: show(item, 'descripcion', lang),
  distanciaKm: origin && item.latitud !== null && item.longitud !== null
    ? Math.round(distanceKm(origin, { latitud: item.latitud, longitud: item.longitud }) * 10) / 10
    : null,
  // Para las acciones de la tarjeta: sólo los lugares con coordenadas aparecen en el mapa.
  enMapa: item.tipo === 'lugar' && item.latitud !== null && item.longitud !== null,
  contacto: item.tipo === 'servicio' ? show(item, 'contacto', lang) : null,
  detalle: (item.tipo === 'servicio' ? show(item, 'precio', lang) : show(item, 'actividades', lang)) ?? null,
});

export const runAssistantEngine = (input: EngineInput): EngineOutput => {
  const now = input.now ?? new Date();
  const lang: Lang = input.lang === 'en' ? 'en' : 'es';
  const t = T[lang];
  const intents = detectIntents(input.question);
  const municipality = detectMunicipality(input.question, input.municipalities);
  const mood = weatherMood(input.weather);
  const text = normalizeForSearch(input.question);
  const tokens = text.split(' ').filter((token) => token.length > 3);
  const lines: string[] = [];

  // 1) Saludo / cortesía. La interfaz ya da la bienvenida: sólo se presenta si la persona saluda.
  if (intents.includes('saludo')) {
    lines.push(`${t.greeting(hourIn(now))}. ${t.intro}`);
  }
  if (intents.includes('gracias') && intents.length === 1) {
    return {
      respuesta: pick(t.thanks, input.question),
      texto: pick(t.thanks, input.question),
      referencias: [], sugerencias: t.thanksSuggestions, intenciones: intents, municipio: municipality,
    };
  }
  if (intents.includes('ayuda') || (intents.length === 1 && intents[0] === 'saludo')) {
    lines.push(t.help);
    return {
      respuesta: lines.join('\n\n'), texto: lines.join('\n\n'), referencias: [],
      sugerencias: t.helpSuggestions,
      intenciones: intents, municipio: municipality,
    };
  }

  // Señal: no hay datos de cobertura; se dice con claridad y sólo se listan lugares cuya ficha menciona terracería.
  if (intents.includes('senal')) {
    lines.push(t.signal);
    const rough = input.items
      .filter((item) => item.tipo === 'lugar' && !isClosed(item) && /terracer/i.test(item.acceso ?? '') && (!municipality || item.municipio === municipality))
      .slice(0, 5);
    const texto = [...lines, ...(rough.length ? [t.signalList] : [])].join('\n\n');
    if (rough.length) lines.push(`${t.signalList}\n${rough.map((item) => `• ${item.nombre} (${item.municipio})`).join('\n')}`);
    return {
      respuesta: lines.join('\n\n'),
      texto,
      referencias: rough.map((item) => toReference(item, input.origin, lang)),
      sugerencias: [t.sWeather, t.sFood, t.sEvents],
      intenciones: intents, municipio: municipality,
    };
  }

  // Pregunta fuera de las fichas (p. ej. "¿cuánto cuesta un Uber?"): si ninguna intención aplica y ninguna
  // palabra con contenido aparece en el catálogo, se dice que no hay dato en lugar de proponer lugares al azar.
  const municipalityWords = new Set(input.municipalities.flatMap((name) => normalizeForSearch(name).split(' ')));
  const content = tokens.filter((token) => !STOPWORDS.has(token) && !municipalityWords.has(token));
  // Se compara por palabra completa (o su raíz), no por fragmento: "uber" no debe coincidir con "descubre".
  const catalogWords = [...new Set(normalizeForSearch(input.items.map((item) => `${item.nombre} ${item.categoria ?? ''} ${item.descripcion ?? ''} ${item.actividades ?? ''}`).join(' ')).split(' '))];
  const known = (token: string) => catalogWords.some((word) => word.startsWith(token) || (word.length >= 5 && token.startsWith(word)));
  const unknown = content.filter((token) => !known(token));
  if (!intents.length) {
    if (content.length && unknown.length === content.length) {
      lines.push(t.noData(unknown.slice(0, 2).join(' ')));
      return {
        respuesta: lines.join('\n\n'), texto: lines.join('\n\n'), referencias: [],
        sugerencias: t.helpSuggestions.slice(0, 3), intenciones: intents, municipio: municipality,
      };
    }
  } else if (intents.includes('comida') || intents.includes('hospedaje')) {
    // Preferencias que las fichas no registran ("vegano", "barato", "con jacuzzi"): se avisa antes de las opciones.
    const isIntentWord = (token: string) => INTENT_PATTERNS.some(([, pattern]) => pattern.test(token));
    const missing = unknown.filter((token) => token.length >= 4 && !isIntentWord(token));
    if (missing.length) lines.push(t.partialData(missing.slice(0, 2).join(' ')));
  }

  // 2) Clima (siempre que se pida o cuando ayuda a recomendar)
  const wantsWeather = intents.includes('clima') || intents.includes('itinerario');
  if (input.weather && (wantsWeather || intents.some((intent) => ['naturaleza', 'aventura', 'cerca'].includes(intent)) || intents.length === 0)) {
    lines.push(weatherSentence(input.weather, mood, lang));
  } else if (wantsWeather && !input.weather) {
    lines.push(t.noWeather);
  }

  // 3) Reglas del lugar: si la persona nombra un lugar y una actividad que su ficha prohíbe, se avisa primero.
  const askedRules = RULE_INTENTS.filter((rule) => intents.includes(rule));
  const ruleWarnings: string[] = [];
  const blocked = new Set<number>();
  if (askedRules.length) {
    for (const item of input.items) {
      if (item.tipo !== 'lugar') continue;
      const named = tokens.some((token) => normalizeForSearch(item.nombre).split(' ').includes(token));
      const banned = prohibitedActivities(item).filter((rule) => askedRules.includes(rule));
      if (!banned.length) continue;
      blocked.add(item.id);
      if (named) {
        const what = banned.map((rule) => t.ruleNames[rule]).join(lang === 'es' ? ' y ' : ' and ');
        ruleWarnings.push(t.prohibited(item.nombre, what, short(show(item, 'recomendaciones', lang), 160)));
      }
    }
  }
  if (ruleWarnings.length) lines.unshift(...ruleWarnings);

  // 4) Selección de registros del catálogo
  let pool = input.items.filter((item) => (!municipality || item.municipio === municipality) && !blocked.has(item.id));
  const wantsSwim = intents.includes('nadar');
  // Para nadar sólo valen los lugares cuya ficha lo menciona; no se mezcla con "naturaleza" (grutas, miradores…).
  const activeFilters = (wantsSwim ? [typeFilters.nadar] : intents.map((intent) => typeFilters[intent])).filter(Boolean) as Array<(item: EnginePlace) => boolean>;
  if (wantsSwim) {
    pool = pool.filter((item) => allowsSwimming(item));
  } else if (activeFilters.length) {
    const filtered = pool.filter((item) => activeFilters.some((filter) => filter(item)));
    if (filtered.length) pool = filtered;
  } else if (!intents.includes('eventos')) {
    pool = pool.filter((item) => item.tipo === 'lugar');
  }

  const closedMatches = pool.filter((item) => isClosed(item) && tokens.some((token) => normalizeForSearch(item.nombre).includes(token)));
  pool = pool.filter((item) => !isClosed(item));

  const scored = pool.map((item) => {
    const translated = lang === 'es' ? '' : `${show(item, 'descripcion', lang) ?? ''} ${show(item, 'actividades', lang) ?? ''}`;
    const haystack = normalizeForSearch(`${item.nombre} ${item.municipio} ${item.categoria ?? ''} ${item.descripcion ?? ''} ${item.actividades ?? ''} ${translated}`);
    const textScore = tokens.reduce((total, token) => total + (normalizeForSearch(item.nombre).includes(token) ? 6 : 0) + (haystack.includes(token) ? 1 : 0), 0);
    const distance = input.origin && item.latitud !== null && item.longitud !== null ? distanceKm(input.origin, { latitud: item.latitud, longitud: item.longitud }) : null;
    return { item, score: textScore + weatherScore(item, mood), distance };
  });

  const wantsNearby = intents.includes('cerca') && input.origin;
  scored.sort((a, b) => {
    if (wantsNearby) return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    return b.score - a.score || a.item.nombre.localeCompare(b.item.nombre, t.locale);
  });

  const hasContext = Boolean(municipality || activeFilters.length || wantsNearby || wantsWeather || intents.length === 0);
  const limit = intents.includes('itinerario') ? 4 : 5;
  let candidates = scored.filter((entry) => hasContext || entry.score > 0);
  // Si no hay coincidencias de texto, se diversifica por categoría y municipio para no repetir lo mismo.
  if (!wantsNearby && candidates.length > limit && candidates[0].score === candidates[limit - 1].score) {
    const buckets = new Map<string, typeof candidates>();
    for (const entry of candidates) {
      const keyName = `${entry.item.categoria ?? ''}`;
      buckets.set(keyName, [...(buckets.get(keyName) ?? []), entry]);
    }
    const mixed: typeof candidates = [];
    const usedMunicipalities = new Set<string>();
    while (mixed.length < candidates.length) {
      let added = false;
      for (const list of buckets.values()) {
        const index = list.findIndex((entry) => !usedMunicipalities.has(entry.item.municipio) || list.length === 1);
        const [entry] = list.splice(index >= 0 ? index : 0, 1);
        if (entry) { mixed.push(entry); usedMunicipalities.add(entry.item.municipio); added = true; }
      }
      if (!added) break;
    }
    candidates = mixed;
  }
  const selected = candidates.slice(0, limit);

  // 5) Redacción
  if (closedMatches.length) {
    lines.push(t.closed(closedMatches.map((item) => item.nombre).join(', '), short(show(closedMatches[0], 'horarios', lang), 120)));
  }

  if (intents.includes('eventos') && input.events.length) {
    const formatter = new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });
    const eventLines = input.events.slice(0, 4).map((event) => `• ${event.titulo} — ${formatter.format(new Date(event.fecha_inicio))}${event.lugar_nombre ? t.eventAt(event.lugar_nombre) : ''}`);
    lines.push(t.eventsIntro(eventLines.join('\n')));
  } else if (intents.includes('eventos')) {
    lines.push(t.noEvents);
  }

  const listItems = intents.includes('eventos') && !activeFilters.length ? [] : selected;
  let listIndex = -1;
  let listIntro = '';
  if (listItems.length) {
    const scope = municipality ? t.scopeIn(municipality) : t.scopeDefault;
    const intro = wantsSwim ? t.introSwim(scope)
      : intents.includes('hospedaje') ? t.introLodging(scope)
      : intents.includes('comida') ? t.introFood(scope)
        : intents.includes('misiones') ? t.introMissions
          : wantsNearby ? t.introNearby
            : intents.includes('itinerario') ? t.introItinerary(scope)
              : mood && !activeFilters.length ? t.introWeather(scope)
                : t.introDefault(scope);
    const itemLines = listItems.map(({ item, distance }, index) => {
      const bullet = intents.includes('itinerario') ? `${index + 1}.` : '•';
      const where = distance !== null && wantsNearby ? t.away(distance.toFixed(1)) : ` (${item.municipio})`;
      const price = show(item, 'precio', lang);
      const activities = show(item, 'actividades', lang);
      const extra = item.tipo === 'servicio'
        ? [price && `${t.price}: ${short(price, 80)}`, show(item, 'contacto', lang) && `${t.contact}: ${short(show(item, 'contacto', lang), 70)}`].filter(Boolean).join(' · ')
        : activities ? `${t.activities}: ${short(activities, 90)}` : '';
      return `${bullet} ${item.nombre}${where}: ${short(show(item, 'descripcion', lang), 130)}${extra ? `\n   ${extra}` : ''}`;
    });
    listIndex = lines.length;
    listIntro = intro;
    lines.push(`${intro}\n${itemLines.join('\n')}`);
  } else if (wantsSwim) {
    lines.push(t.noSwim);
  } else if (!intents.includes('eventos')) {
    lines.push(municipality ? t.noMatchIn(municipality) : t.noMatch);
  }

  if (intents.includes('cerca') && !input.origin && listItems.length) {
    lines.push(t.nearNoOrigin);
  }
  if (intents.includes('ruta')) {
    lines.push(t.route);
  }
  if (listItems.some(({ item }) => item.tipo === 'servicio')) {
    lines.push(t.book);
  } else if (listItems.length) {
    lines.push(pick(t.tips, input.question));
  }

  const sugerencias = [
    !intents.includes('clima') && t.sWeather,
    !intents.includes('hospedaje') && t.sLodging(municipality),
    !intents.includes('comida') && t.sFood,
    !intents.includes('eventos') && t.sEvents,
    !intents.includes('misiones') && t.sMissions,
  ].filter((value): value is string => Boolean(value)).slice(0, 3);

  return {
    respuesta: lines.join('\n\n'),
    texto: lines.map((line, index) => (index === listIndex ? listIntro : line)).join('\n\n'),
    referencias: listItems.map(({ item }) => toReference(item, input.origin, lang)),
    sugerencias,
    intenciones: intents,
    municipio: municipality,
  };
};
