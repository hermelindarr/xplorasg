import { useEffect, useState } from 'react';
import { travelApi, type WeatherData } from '../services/travelApi';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { CloudSunIcon, FogIcon, RainIcon, StormIcon, SunIcon } from './ui/LineIcons';

const messages = defineMessages({
  unavailable: 'El clima no está disponible en este momento.',
  feelsLike: 'Sensación térmica',
  wind: 'Viento',
  humidity: 'Humedad',
  uv: 'Índice UV',
  uvLevels: ['bajo', 'moderado', 'alto', 'muy alto', 'extremo'],
  nextDays: 'Próximos días',
  today: 'Hoy',
  rain: (p: number) => `${p} % lluvia`,
  disclaimer: 'Pronóstico de Open-Meteo. Puede cambiar; verifica las condiciones antes de viajar.',
  updatedAt: 'Actualizado',
}, {
  unavailable: 'Weather is not available right now.',
  feelsLike: 'Feels like',
  wind: 'Wind',
  humidity: 'Humidity',
  uv: 'UV index',
  uvLevels: ['low', 'moderate', 'high', 'very high', 'extreme'],
  nextDays: 'Next days',
  today: 'Today',
  rain: (p: number) => `${p}% rain`,
  disclaimer: 'Forecast by Open-Meteo. It may change; check conditions before you travel.',
  updatedAt: 'Updated',
});

const WeatherGlyph = ({ code, className }: { code: number; className?: string }) => {
  if (code === 0) return <SunIcon className={className} />;
  if (code === 45 || code === 48) return <FogIcon className={className} />;
  if (code >= 95) return <StormIcon className={className} />;
  if (code >= 51 && code <= 82) return <RainIcon className={className} />;
  return <CloudSunIcon className={className} />;
};

/** Escala de la OMS: 0–2 bajo, 3–5 moderado, 6–7 alto, 8–10 muy alto, 11+ extremo. */
const uvLevel = (uv: number) => (uv < 3 ? 0 : uv < 6 ? 1 : uv < 8 ? 2 : uv < 11 ? 3 : 4);

interface WeatherCardProps {
  latitude: number;
  longitude: number;
  /** Altitud registrada en la ficha; si no hay, se usa la del modelo de elevación de Open-Meteo. */
  altitude?: number | null;
}

// Clima de montaña en formato de bitácora: temperatura en serif, cuatro lecturas con filetes de 1 px
// y el pronóstico de los próximos días (la altitud y la ubicación viven en la ficha del lugar).
export const WeatherCard = ({ latitude, longitude }: WeatherCardProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);
  const m = useMessages(messages);
  const { lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'es-MX';

  // Lectura en vivo: se consulta Open-Meteo al abrir la ficha y cada 10 minutos mientras la pestaña esté visible.
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    travelApi.weather(latitude, longitude, controller.signal)
      .then((response) => { setWeather(response.data); setError(false); })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, [latitude, longitude, refreshKey]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') setRefreshKey((key) => key + 1); };
    const id = window.setInterval(tick, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  // Pronóstico de los próximos días: es lo que sirve para decidir cuándo ir (lluvia = ríos crecidos, caminos lodosos).
  const dayName = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');

  if (error) {
    return (
      <p className="mt-4 text-sm text-brand-blue/70">{m.unavailable}</p>
    );
  }
  if (!weather) return <div className="mt-4 h-56 animate-pulse rounded-lg bg-brand-sand/50" />;

  const round = (value: number | null | undefined, unit = '°') => (value === null || value === undefined ? '—' : `${Math.round(value)}${unit}`);
  const uv = weather.current.uvIndex;
  const readings = [
    { label: m.feelsLike, value: round(weather.current.apparentTemperature) },
    { label: m.wind, value: round(weather.current.windSpeed, ' km/h') },
    { label: m.humidity, value: round(weather.current.humidity, ' %') },
    { label: m.uv, value: uv === null || uv === undefined ? '—' : `${Math.round(uv)} · ${m.uvLevels[uvLevel(uv)]}` },
  ];

  return (
    <div className="mt-4 rounded-lg border border-brand-sand bg-brand-paper p-5">
      <div className="flex items-center gap-4">
        <WeatherGlyph code={weather.current.weatherCode} className="size-9 shrink-0 text-brand-teal" />
        <p className="font-display text-5xl leading-none tabular-nums text-brand-blue">{round(weather.current.temperature)}</p>
        <p className="min-w-0 text-sm leading-5 text-brand-blue/75">{weather.current.condition}</p>
      </div>
      <dl className="mt-5 grid grid-cols-2 border-t border-brand-sand text-sm">
        {readings.map((item, index) => (
          <div key={item.label} className={`border-b border-brand-sand py-3 ${index % 2 ? 'border-l pl-4' : 'pr-4'}`}>
            <dt className="label-quiet">{item.label}</dt>
            <dd className="font-display mt-1 text-lg leading-6 tabular-nums text-brand-blue">{item.value}</dd>
          </div>
        ))}
      </dl>
      {weather.forecast.length > 0 && (
        <div className="mt-5">
          <p className="label-quiet">{m.nextDays}</p>
          <ul className="mt-2 grid grid-cols-3 border-y border-brand-sand">
            {weather.forecast.slice(0, 3).map((day, index) => (
              <li key={day.date} className={`min-w-0 py-3 ${index ? 'border-l border-brand-sand pl-3' : 'pr-3'}`} title={day.condition}>
                <p className="text-xs capitalize text-brand-blue/70">{index === 0 ? m.today : dayName(day.date)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-base tabular-nums text-brand-blue">
                  <WeatherGlyph code={day.weatherCode} className="size-4 shrink-0 text-brand-teal" />
                  {round(day.temperatureMax)}<span className="text-brand-blue/70">/{round(day.temperatureMin)}</span>
                </p>
                {day.precipitationProbability !== null && (
                  <p className="mt-0.5 text-xs tabular-nums text-brand-blue/70">{m.rain(day.precipitationProbability)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs leading-4 text-brand-blue/70">
        {weather.current.time ? `${m.updatedAt} ${weather.current.time.slice(11, 16)} · ` : ''}{m.disclaimer}
      </p>
    </div>
  );
};
