// Corte real del terreno de la Sierra Gorda, de oeste a este:
// Peñamiller → Pinal de Amoles → Jalpan de Serra → Landa de Matamoros.
// 60 muestras [longitud, altitud en m] tomadas del modelo digital de elevación de Open-Meteo
// (Copernicus DEM, 90 m) el 17-nov-2026. El relieve no cambia: se guarda aquí para que funcione sin conexión.
export const SIERRA_TERRAIN: ReadonlyArray<readonly [number, number]> = [
  [-99.8, 1418], [-99.7898, 1385], [-99.7797, 1409], [-99.7695, 1363], [-99.7593, 1392], [-99.7492, 1398],
  [-99.739, 1390], [-99.7288, 1668], [-99.7186, 1584], [-99.7085, 1660], [-99.6983, 2126], [-99.6881, 2413],
  [-99.6782, 2634], [-99.6692, 2631], [-99.6602, 2604], [-99.6513, 2535], [-99.6423, 2544], [-99.6333, 2434],
  [-99.6236, 2342], [-99.6122, 2344], [-99.6009, 2122], [-99.5895, 1990], [-99.5782, 1820], [-99.5668, 1748],
  [-99.5541, 1307], [-99.5394, 1363], [-99.5246, 1324], [-99.5099, 1141], [-99.4951, 1057], [-99.4804, 857],
  [-99.4668, 755], [-99.4544, 895], [-99.4421, 1021], [-99.4297, 989], [-99.4173, 1130], [-99.4049, 1282],
  [-99.3919, 1205], [-99.3783, 1289], [-99.3647, 1312], [-99.3512, 1322], [-99.3376, 1413], [-99.3241, 1071],
  [-99.3058, 976], [-99.2854, 1037], [-99.2651, 1088], [-99.2447, 1257], [-99.2244, 1424], [-99.2041, 1397],
  [-99.1864, 1605], [-99.1695, 1686], [-99.1525, 1690], [-99.1356, 1633], [-99.1186, 1222], [-99.1017, 965],
  [-99.0908, 987], [-99.0807, 1107], [-99.0705, 924], [-99.0603, 792], [-99.0502, 1023], [-99.04, 607],
];

/** Cabeceras sobre el corte (longitud aproximada de cada una), para orientar al lector. */
export const TERRAIN_TOWNS: ReadonlyArray<{ name: string; lon: number }> = [
  { name: 'Peñamiller', lon: -99.78 },
  { name: 'Pinal de Amoles', lon: -99.627 },
  { name: 'Jalpan', lon: -99.473 },
  { name: 'Landa', lon: -99.32 },
];

